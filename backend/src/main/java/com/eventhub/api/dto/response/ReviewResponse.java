package com.eventhub.api.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReviewResponse {
    private Long id;
    private Integer rating;
    private String comment;
    private UserResponse user;
    private LocalDateTime createdAt;
}
