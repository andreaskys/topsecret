package com.eventhub.api.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateListingRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 200, message = "Name must be at most 200 characters")
    private String name;

    @NotBlank(message = "Description is required")
    @Size(max = 10000, message = "Description must be at most 10000 characters")
    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than zero")
    private BigDecimal price;

    @NotBlank(message = "Location is required")
    @Size(max = 500, message = "Location must be at most 500 characters")
    private String location;

    @NotNull(message = "Max guests is required")
    @Min(value = 1, message = "Must allow at least 1 guest")
    private Integer maxGuests;

    private List<String> amenities;

    private String eventType;
}
