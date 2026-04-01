package com.eventhub.api.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MediaResponse {
    private Long id;
    private String url;
    private String mediaType;
    private String transcodingStatus;
}
