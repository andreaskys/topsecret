package com.eventhub.api.service;

import com.eventhub.api.domain.entity.Booking;
import com.eventhub.api.domain.entity.Listing;
import com.eventhub.api.domain.entity.User;
import com.eventhub.api.domain.enums.BookingStatus;
import com.eventhub.api.domain.repository.BookingRepository;
import com.eventhub.api.domain.repository.ListingRepository;
import com.eventhub.api.domain.repository.UserRepository;
import com.eventhub.api.dto.request.CreateBookingRequest;
import com.eventhub.api.dto.response.BookingResponse;
import com.eventhub.api.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EventProducer eventProducer;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private BookingService bookingService;

    private User booker;
    private User owner;
    private Listing listing;
    private CreateBookingRequest bookingRequest;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L).fullName("Owner").email("owner@test.com")
                .phoneNumber("11111").build();

        booker = User.builder()
                .id(2L).fullName("Booker").email("booker@test.com")
                .phoneNumber("22222").build();

        listing = Listing.builder()
                .id(10L).name("Event Space").owner(owner)
                .price(new BigDecimal("500.00")).maxGuests(100).active(true)
                .location("SP").build();

        bookingRequest = new CreateBookingRequest();
        bookingRequest.setEventDate(LocalDate.now().plusDays(7));
        bookingRequest.setGuestCount(50);
        bookingRequest.setNotes("Birthday party");
    }

    @Test
    void create_success() {
        when(userRepository.findByEmail("booker@test.com")).thenReturn(Optional.of(booker));
        when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));
        when(bookingRepository.existsByListingIdAndEventDateAndStatusNot(eq(10L), any(), eq(BookingStatus.CANCELLED)))
                .thenReturn(false);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> {
            Booking b = inv.getArgument(0);
            b.setId(1L);
            return b;
        });

        BookingResponse response = bookingService.create(10L, bookingRequest, "booker@test.com");

        assertThat(response).isNotNull();
        assertThat(response.getListingName()).isEqualTo("Event Space");
        assertThat(response.getGuestCount()).isEqualTo(50);
        assertThat(response.getTotalPrice()).isEqualByComparingTo(new BigDecimal("500.00"));
        verify(eventProducer).sendBookingEvent(eq("BOOKING_CREATED"), any(), eq(2L), eq(10L), eq("Event Space"));
        verify(eventProducer).sendNotificationEvent(eq(1L), eq("Nova Reserva"), anyString(), eq("BOOKING"));
    }

    @Test
    void create_ownListing_throwsException() {
        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(owner));
        when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));

        assertThatThrownBy(() -> bookingService.create(10L, bookingRequest, "owner@test.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("You cannot book your own listing");
    }

    @Test
    void create_exceedsCapacity_throwsException() {
        bookingRequest.setGuestCount(200);

        when(userRepository.findByEmail("booker@test.com")).thenReturn(Optional.of(booker));
        when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));

        assertThatThrownBy(() -> bookingService.create(10L, bookingRequest, "booker@test.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Guest count exceeds maximum capacity");
    }

    @Test
    void create_dateAlreadyBooked_throwsException() {
        when(userRepository.findByEmail("booker@test.com")).thenReturn(Optional.of(booker));
        when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));
        when(bookingRepository.existsByListingIdAndEventDateAndStatusNot(eq(10L), any(), eq(BookingStatus.CANCELLED)))
                .thenReturn(true);

        assertThatThrownBy(() -> bookingService.create(10L, bookingRequest, "booker@test.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("This date is already booked");
    }

    @Test
    void create_listingNotFound_throwsException() {
        when(userRepository.findByEmail("booker@test.com")).thenReturn(Optional.of(booker));
        when(listingRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.create(10L, bookingRequest, "booker@test.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Listing not found");
    }

    @Test
    void updateStatus_cancelByBooker_success() {
        Booking booking = Booking.builder()
                .id(1L).listing(listing).user(booker)
                .status(BookingStatus.PENDING).eventDate(LocalDate.now().plusDays(7))
                .guestCount(50).totalPrice(new BigDecimal("500.00"))
                .build();

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

        BookingResponse response = bookingService.updateStatus(1L, "CANCELLED", "booker@test.com");

        assertThat(response.getStatus()).isEqualTo("CANCELLED");
        verify(eventProducer).sendNotificationEvent(eq(1L), anyString(), anyString(), eq("BOOKING"));
    }

    @Test
    void updateStatus_confirmByNonOwner_throwsException() {
        Booking booking = Booking.builder()
                .id(1L).listing(listing).user(booker)
                .status(BookingStatus.PENDING).eventDate(LocalDate.now().plusDays(7))
                .guestCount(50).totalPrice(new BigDecimal("500.00"))
                .build();

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.updateStatus(1L, "CONFIRMED", "booker@test.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Only the listing owner can confirm bookings");
    }

    @Test
    void updateStatus_unauthorizedUser_throwsException() {
        Booking booking = Booking.builder()
                .id(1L).listing(listing).user(booker)
                .status(BookingStatus.PENDING).eventDate(LocalDate.now().plusDays(7))
                .guestCount(50).totalPrice(new BigDecimal("500.00"))
                .build();

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.updateStatus(1L, "CANCELLED", "stranger@test.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Not authorized to update this booking");
    }
}
