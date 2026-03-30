package com.eventhub.api.service;

import com.eventhub.api.config.KafkaConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void sendBookingEvent(String eventType, Long bookingId, Long userId, Long listingId, String listingName) {
        send(KafkaConfig.TOPIC_BOOKING_EVENTS, Map.of(
                "event", eventType,
                "bookingId", bookingId,
                "userId", userId,
                "listingId", listingId,
                "listingName", listingName
        ));
    }

    public void sendReviewEvent(Long reviewId, Long userId, Long listingId, String listingName, int rating) {
        send(KafkaConfig.TOPIC_REVIEW_EVENTS, Map.of(
                "event", "REVIEW_CREATED",
                "reviewId", reviewId,
                "userId", userId,
                "listingId", listingId,
                "listingName", listingName,
                "rating", rating
        ));
    }

    public void sendNotificationEvent(Long userId, String title, String message, String type) {
        send(KafkaConfig.TOPIC_NOTIFICATION_EVENTS, Map.of(
                "userId", userId,
                "title", title,
                "message", message,
                "type", type
        ));
    }

    private void send(String topic, Map<String, Object> payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            kafkaTemplate.send(topic, json);
            log.info("Kafka event sent to {}: {}", topic, json);
        } catch (Exception e) {
            log.error("Failed to send Kafka event to {}: {}", topic, e.getMessage());
        }
    }
}
