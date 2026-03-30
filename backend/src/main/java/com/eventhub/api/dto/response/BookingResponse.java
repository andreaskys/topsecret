package com.eventhub.api.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class BookingResponse {
    private Long id;
    private Long listingId;
    private String listingName;
    private String listingLocation;
    private UserResponse user;
    private LocalDate eventDate;
    private Integer guestCount;
    private BigDecimal totalPrice;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
}
