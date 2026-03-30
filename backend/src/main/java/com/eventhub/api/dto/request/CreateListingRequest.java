package com.eventhub.api.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateListingRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than zero")
    private BigDecimal price;

    @NotBlank(message = "Location is required")
    private String location;

    @NotNull(message = "Max guests is required")
    @Min(value = 1, message = "Must allow at least 1 guest")
    private Integer maxGuests;

    private List<String> amenities;

    private String eventType;
}
