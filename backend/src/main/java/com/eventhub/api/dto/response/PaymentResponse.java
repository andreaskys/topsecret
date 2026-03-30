package com.eventhub.api.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PaymentResponse {
    private Long id;
    private Long bookingId;
    private BigDecimal amount;
    private String status;
    private String paymentMethod;
    private String transactionId;
    private LocalDateTime createdAt;
}
