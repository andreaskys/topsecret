package com.eventhub.api.service;

import com.eventhub.api.domain.entity.Booking;
import com.eventhub.api.domain.entity.Listing;
import com.eventhub.api.domain.entity.Payment;
import com.eventhub.api.domain.entity.User;
import com.eventhub.api.domain.enums.BookingStatus;
import com.eventhub.api.domain.enums.PaymentStatus;
import com.eventhub.api.domain.repository.BookingRepository;
import com.eventhub.api.domain.repository.PaymentRepository;
import com.eventhub.api.domain.repository.UserRepository;
import com.eventhub.api.dto.request.PaymentRequest;
import com.eventhub.api.dto.response.PaymentResponse;
import com.eventhub.api.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EventProducer eventProducer;

    @Mock
    private com.eventhub.api.config.StripeConfig stripeConfig;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private PaymentService paymentService;

    private User booker;
    private User owner;
    private Listing listing;
    private Booking booking;
    private PaymentRequest paymentRequest;

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
                .location("SP").build();

        booking = Booking.builder()
                .id(1L).listing(listing).user(booker)
                .totalPrice(new BigDecimal("500.00"))
                .status(BookingStatus.PENDING).build();

        paymentRequest = new PaymentRequest();
        paymentRequest.setBookingId(1L);
        paymentRequest.setPaymentMethod("CREDIT_CARD");
    }

    @Test
    void processPayment_success() {
        when(userRepository.findByEmail("booker@test.com")).thenReturn(Optional.of(booker));
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(paymentRepository.findByBookingId(1L)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> {
            Payment p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

        PaymentResponse response = paymentService.processPayment(paymentRequest, "booker@test.com");

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("COMPLETED");
        assertThat(response.getAmount()).isEqualByComparingTo(new BigDecimal("500.00"));
        assertThat(response.getTransactionId()).startsWith("TXN-");
        verify(bookingRepository).save(argThat(b -> BookingStatus.CONFIRMED == b.getStatus()));
        verify(eventProducer).sendNotificationEvent(eq(1L), eq("Pagamento Recebido"), anyString(), eq("PAYMENT"));
    }

    @Test
    void processPayment_notOwnBooking_throwsException() {
        when(userRepository.findByEmail("stranger@test.com")).thenReturn(Optional.of(
                User.builder().id(99L).fullName("Stranger").email("stranger@test.com").build()));
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> paymentService.processPayment(paymentRequest, "stranger@test.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("You can only pay for your own bookings");
    }

    @Test
    void processPayment_cancelledBooking_throwsException() {
        booking.setStatus(BookingStatus.CANCELLED);
        when(userRepository.findByEmail("booker@test.com")).thenReturn(Optional.of(booker));
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> paymentService.processPayment(paymentRequest, "booker@test.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Booking is not in a payable state");
    }

    @Test
    void processPayment_alreadyPaid_throwsException() {
        when(userRepository.findByEmail("booker@test.com")).thenReturn(Optional.of(booker));
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(paymentRepository.findByBookingId(1L)).thenReturn(Optional.of(Payment.builder().build()));

        assertThatThrownBy(() -> paymentService.processPayment(paymentRequest, "booker@test.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Payment already exists for this booking");
    }

    @Test
    void getByBookingId_asBooker_success() {
        Payment payment = Payment.builder()
                .id(1L).booking(booking).amount(new BigDecimal("500.00"))
                .status(PaymentStatus.COMPLETED).paymentMethod("CREDIT_CARD")
                .transactionId("TXN-12345678").build();

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(paymentRepository.findByBookingId(1L)).thenReturn(Optional.of(payment));

        PaymentResponse response = paymentService.getByBookingId(1L, "booker@test.com");

        assertThat(response.getTransactionId()).isEqualTo("TXN-12345678");
    }

    @Test
    void getByBookingId_unauthorized_throwsException() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> paymentService.getByBookingId(1L, "stranger@test.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Not authorized");
    }
}
