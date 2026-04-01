package com.eventhub.api.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateBookingRequest {

    @NotNull(message = "Event date is required")
    @Future(message = "Event date must be in the future")
    private LocalDate eventDate;

    @NotNull(message = "Guest count is required")
    @Min(value = 1, message = "Must have at least 1 guest")
    private Integer guestCount;

    @Size(max = 2000, message = "Notes must be at most 2000 characters")
    private String notes;
}
