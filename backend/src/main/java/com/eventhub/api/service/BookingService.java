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
import com.eventhub.api.dto.response.UserResponse;
import com.eventhub.api.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final EventProducer eventProducer;
    private final AuditService auditService;

    @Transactional
    public BookingResponse create(Long listingId, CreateBookingRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found"));

        Listing listing = listingRepository.findById(listingId)
                .filter(Listing::getActive)
                .orElseThrow(() -> new BusinessException("Listing not found"));

        if (listing.getOwner().getId().equals(user.getId())) {
            throw new BusinessException("You cannot book your own listing");
        }

        if (request.getGuestCount() > listing.getMaxGuests()) {
            throw new BusinessException("Guest count exceeds maximum capacity of " + listing.getMaxGuests());
        }

        if (bookingRepository.existsByListingIdAndEventDateAndStatusNot(listingId, request.getEventDate(), BookingStatus.CANCELLED)) {
            throw new BusinessException("This date is already booked");
        }

        Booking booking = Booking.builder()
                .listing(listing)
                .user(user)
                .eventDate(request.getEventDate())
                .guestCount(request.getGuestCount())
                .totalPrice(listing.getPrice())
                .notes(request.getNotes())
                .build();

        try {
            booking = bookingRepository.save(booking);
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException("This date is already booked");
        }

        eventProducer.sendBookingEvent("BOOKING_CREATED", booking.getId(), user.getId(), listingId, listing.getName());
        eventProducer.sendNotificationEvent(
                listing.getOwner().getId(),
                "Nova Reserva",
                user.getFullName() + " fez uma reserva em " + listing.getName() + " para " + request.getEventDate(),
                "BOOKING"
        );

        auditService.log("BOOKING_CREATED", "BOOKING", booking.getId(), user.getId());

        return toResponse(booking);
    }

    public Page<BookingResponse> getMyBookings(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found"));
        return bookingRepository.findByUserId(user.getId(), pageable).map(this::toResponse);
    }

    public Page<BookingResponse> getBookingsForListing(Long listingId, String email, Pageable pageable) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new BusinessException("Listing not found"));
        if (!listing.getOwner().getEmail().equals(email)) {
            throw new BusinessException("You can only view bookings for your own listings");
        }
        return bookingRepository.findByListingId(listingId, pageable).map(this::toResponse);
    }

    @Transactional
    public BookingResponse updateStatus(Long bookingId, String status, String email) {
        BookingStatus newStatus;
        try {
            newStatus = BookingStatus.valueOf(status);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BusinessException("Invalid status. Must be one of: PENDING, CONFIRMED, CANCELLED");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException("Booking not found"));

        if (BookingStatus.CANCELLED == booking.getStatus()) {
            throw new BusinessException("Cannot update a cancelled booking");
        }

        boolean isOwner = booking.getListing().getOwner().getEmail().equals(email);
        boolean isBooker = booking.getUser().getEmail().equals(email);

        if (!isOwner && !isBooker) {
            throw new BusinessException("Not authorized to update this booking");
        }

        if (BookingStatus.CONFIRMED == newStatus && !isOwner) {
            throw new BusinessException("Only the listing owner can confirm bookings");
        }

        booking.setStatus(newStatus);
        booking = bookingRepository.save(booking);

        Long notifyUserId = isOwner ? booking.getUser().getId() : booking.getListing().getOwner().getId();
        eventProducer.sendNotificationEvent(
                notifyUserId,
                "Reserva " + newStatus.name(),
                "A reserva em " + booking.getListing().getName() + " foi " + newStatus.name().toLowerCase(),
                "BOOKING"
        );

        Long actorId = isOwner ? booking.getListing().getOwner().getId() : booking.getUser().getId();
        auditService.log("BOOKING_STATUS_CHANGED", "BOOKING", bookingId, actorId,
                "Status changed to " + newStatus.name());

        return toResponse(booking);
    }

    public List<LocalDate> getBookedDates(Long listingId) {
        return bookingRepository.findBookedDatesByListingId(listingId);
    }

    private BookingResponse toResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .listingId(booking.getListing().getId())
                .listingName(booking.getListing().getName())
                .listingLocation(booking.getListing().getLocation())
                .user(UserResponse.builder()
                        .id(booking.getUser().getId())
                        .fullName(booking.getUser().getFullName())
                        .email(booking.getUser().getEmail())
                        .phoneNumber(booking.getUser().getPhoneNumber())
                        .avatarUrl(booking.getUser().getAvatarUrl())
                        .role(booking.getUser().getRole().name())
                        .build())
                .eventDate(booking.getEventDate())
                .guestCount(booking.getGuestCount())
                .totalPrice(booking.getTotalPrice())
                .status(booking.getStatus().name())
                .notes(booking.getNotes())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
