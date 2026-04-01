package com.eventhub.api.domain.entity;

import com.eventhub.api.domain.enums.MediaType;
import com.eventhub.api.domain.enums.TranscodingStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "listing_media")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @Column(nullable = false, length = 1000)
    private String url;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 10)
    private MediaType mediaType;

    @Enumerated(EnumType.STRING)
    @Column(name = "transcoding_status", length = 20)
    @Builder.Default
    private TranscodingStatus transcodingStatus = TranscodingStatus.READY;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
