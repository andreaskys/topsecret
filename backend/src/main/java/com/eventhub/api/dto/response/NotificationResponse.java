package com.eventhub.api.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private String title;
    private String message;
    private Boolean read;
    private String type;
    private LocalDateTime createdAt;
}
