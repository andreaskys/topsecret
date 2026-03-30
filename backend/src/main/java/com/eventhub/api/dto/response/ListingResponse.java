package com.eventhub.api.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ListingResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String location;
    private Integer maxGuests;
    private BigDecimal avgRating;
    private Integer ratingCount;
    private String eventType;
    private List<String> amenities;
    private List<MediaResponse> media;
    private UserResponse owner;
}
