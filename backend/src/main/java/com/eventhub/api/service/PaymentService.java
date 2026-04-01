package com.eventhub.api.service;

import com.eventhub.api.config.StripeConfig;
import com.eventhub.api.domain.entity.Booking;
import com.eventhub.api.domain.entity.Payment;
import com.eventhub.api.domain.entity.User;
import com.eventhub.api.domain.enums.BookingStatus;
import com.eventhub.api.domain.enums.PaymentStatus;
import com.eventhub.api.domain.repository.BookingRepository;
import com.eventhub.api.domain.repository.PaymentRepository;
import com.eventhub.api.domain.repository.UserRepository;
import com.eventhub.api.dto.request.PaymentRequest;
import com.eventhub.api.dto.response.PaymentIntentResponse;
import com.eventhub.api.dto.response.PaymentResponse;
import com.eventhub.api.exception.BusinessException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.RequestOptions;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final EventProducer eventProducer;
    private final StripeConfig stripeConfig;
    private final AuditService auditService;

    /**
     * Creates a Stripe PaymentIntent and a PENDING payment record.
     * Returns the client secret for the frontend to complete the payment.
     */
    @Transactional
    public PaymentIntentResponse createPaymentIntent(PaymentRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found"));

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new BusinessException("Booking not found"));

        if (!booking.getUser().getId().equals(user.getId())) {
            throw new BusinessException("You can only pay for your own bookings");
        }

        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BusinessException("Booking is not in a payable state");
        }

        if (paymentRepository.findByBookingId(booking.getId()).isPresent()) {
            throw new BusinessException("Payment already exists for this booking");
        }

        // Convert amount to centavos (Stripe works with smallest currency unit)
        long amountInCents = booking.getTotalPrice().multiply(BigDecimal.valueOf(100)).longValue();

        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency(stripeConfig.getCurrency())
                    .putMetadata("booking_id", booking.getId().toString())
                    .putMetadata("user_email", email)
                    .addPaymentMethodType("card")
                    .build();

            RequestOptions requestOptions = RequestOptions.builder()
                    .setIdempotencyKey("pi-" + booking.getId() + "-" + user.getId())
                    .build();
            PaymentIntent intent = PaymentIntent.create(params, requestOptions);

            // Save payment as PENDING with Stripe PaymentIntent ID
            Payment payment = Payment.builder()
                    .booking(booking)
                    .amount(booking.getTotalPrice())
                    .paymentMethod(request.getPaymentMethod())
                    .transactionId(intent.getId())
                    .build();
            paymentRepository.save(payment);

            auditService.log("PAYMENT_INITIATED", "PAYMENT", payment.getId(), user.getId(),
                    "PaymentIntent " + intent.getId() + " for booking " + booking.getId());

            return PaymentIntentResponse.builder()
                    .clientSecret(intent.getClientSecret())
                    .paymentIntentId(intent.getId())
                    .bookingId(booking.getId())
                    .amount(booking.getTotalPrice())
                    .currency(stripeConfig.getCurrency())
                    .build();

        } catch (StripeException e) {
            log.error("Stripe error creating PaymentIntent: {}", e.getMessage());
            throw new BusinessException("Payment processing error: " + e.getMessage());
        }
    }

    /**
     * Handles Stripe webhook events.
     * Called when payment_intent.succeeded or payment_intent.payment_failed.
     */
    @Transactional
    public void handleWebhook(String payload, String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, stripeConfig.getWebhookSecret());
        } catch (SignatureVerificationException e) {
            log.error("Stripe webhook signature verification failed: {}", e.getMessage());
            throw new BusinessException("Invalid webhook signature");
        } catch (Exception e) {
            log.error("Error parsing Stripe webhook: {}", e.getMessage());
            throw new BusinessException("Webhook parsing error");
        }

        if ("payment_intent.succeeded".equals(event.getType())) {
            PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer()
                    .getObject().orElse(null);
            if (intent != null) {
                confirmPayment(intent.getId(), intent.getMetadata());
            }
        } else if ("payment_intent.payment_failed".equals(event.getType())) {
            PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer()
                    .getObject().orElse(null);
            if (intent != null) {
                failPayment(intent.getId());
            }
        }
    }

    private void confirmPayment(String paymentIntentId, Map<String, String> metadata) {
        Payment payment = paymentRepository.findByTransactionId(paymentIntentId).orElse(null);
        if (payment == null) {
            log.warn("Payment not found for PaymentIntent: {}", paymentIntentId);
            return;
        }

        payment.setStatus(PaymentStatus.COMPLETED);
        paymentRepository.save(payment);

        Booking booking = payment.getBooking();
        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        eventProducer.sendNotificationEvent(
                booking.getListing().getOwner().getId(),
                "Pagamento Recebido",
                "Pagamento de R$ " + payment.getAmount() + " recebido para " + booking.getListing().getName(),
                "PAYMENT"
        );

        auditService.log("PAYMENT_COMPLETED", "PAYMENT", payment.getId(), booking.getUser().getId(),
                "PaymentIntent " + paymentIntentId + " for booking " + booking.getId());

        log.info("Payment {} confirmed for booking {}", paymentIntentId, booking.getId());
    }

    private void failPayment(String paymentIntentId) {
        Payment payment = paymentRepository.findByTransactionId(paymentIntentId).orElse(null);
        if (payment == null) {
            log.warn("Payment not found for PaymentIntent: {}", paymentIntentId);
            return;
        }

        payment.setStatus(PaymentStatus.FAILED);
        paymentRepository.save(payment);

        log.info("Payment {} failed for booking {}", paymentIntentId, payment.getBooking().getId());
    }

    /**
     * Fallback: process payment directly (simulated) for development/testing
     * when Stripe is not configured.
     */
    @Transactional
    public PaymentResponse processPayment(PaymentRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found"));

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new BusinessException("Booking not found"));

        if (!booking.getUser().getId().equals(user.getId())) {
            throw new BusinessException("You can only pay for your own bookings");
        }

        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BusinessException("Booking is not in a payable state");
        }

        if (paymentRepository.findByBookingId(booking.getId()).isPresent()) {
            throw new BusinessException("Payment already exists for this booking");
        }

        // Simulated payment processing (fallback)
        String transactionId = "TXN-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Payment payment = Payment.builder()
                .booking(booking)
                .amount(booking.getTotalPrice())
                .paymentMethod(request.getPaymentMethod())
                .transactionId(transactionId)
                .status(PaymentStatus.COMPLETED)
                .build();

        payment = paymentRepository.save(payment);

        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        auditService.log("PAYMENT_COMPLETED", "PAYMENT", payment.getId(), user.getId(),
                "Simulated payment " + transactionId + " for booking " + booking.getId());

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
                .status(payment.getStatus().name())
                .paymentMethod(payment.getPaymentMethod())
                .transactionId(payment.getTransactionId())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
