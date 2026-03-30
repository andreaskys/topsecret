package com.eventhub.api.service;

import com.eventhub.api.domain.entity.Booking;
import com.eventhub.api.domain.entity.Payment;
import com.eventhub.api.domain.entity.User;
import com.eventhub.api.domain.repository.BookingRepository;
import com.eventhub.api.domain.repository.PaymentRepository;
import com.eventhub.api.domain.repository.UserRepository;
import com.eventhub.api.dto.request.PaymentRequest;
import com.eventhub.api.dto.response.PaymentResponse;
import com.eventhub.api.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final EventProducer eventProducer;

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found"));

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new BusinessException("Booking not found"));

        if (!booking.getUser().getId().equals(user.getId())) {
            throw new BusinessException("You can only pay for your own bookings");
        }

        if (!"PENDING".equals(booking.getStatus()) && !"CONFIRMED".equals(booking.getStatus())) {
            throw new BusinessException("Booking is not in a payable state");
        }

        if (paymentRepository.findByBookingId(booking.getId()).isPresent()) {
            throw new BusinessException("Payment already exists for this booking");
        }

        // Simulated payment processing
        String transactionId = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Payment payment = Payment.builder()
                .booking(booking)
                .amount(booking.getTotalPrice())
                .paymentMethod(request.getPaymentMethod())
                .transactionId(transactionId)
                .status("COMPLETED")
                .build();

        payment = paymentRepository.save(payment);

        booking.setStatus("CONFIRMED");
        bookingRepository.save(booking);

        eventProducer.sendNotificationEvent(
                booking.getListing().getOwner().getId(),
                "Pagamento Recebido",
                "Pagamento de R$ " + payment.getAmount() + " recebido para " + booking.getListing().getName(),
                "PAYMENT"
        );

        return toResponse(payment);
    }

    public PaymentResponse getByBookingId(Long bookingId, String email) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException("Booking not found"));

        boolean isOwner = booking.getListing().getOwner().getEmail().equals(email);
        boolean isBooker = booking.getUser().getEmail().equals(email);
        if (!isOwner && !isBooker) {
            throw new BusinessException("Not authorized");
        }

        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new BusinessException("Payment not found"));

        return toResponse(payment);
    }

    private PaymentResponse toResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .bookingId(payment.getBooking().getId())
                .amount(payment.getAmount())
                .status(payment.getStatus())
                .paymentMethod(payment.getPaymentMethod())
                .transactionId(payment.getTransactionId())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
