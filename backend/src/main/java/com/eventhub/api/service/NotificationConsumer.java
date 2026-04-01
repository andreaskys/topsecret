package com.eventhub.api.service;

import com.eventhub.api.config.KafkaConfig;
import com.eventhub.api.domain.entity.Notification;
import com.eventhub.api.domain.entity.User;
import com.eventhub.api.domain.enums.NotificationType;
import com.eventhub.api.domain.repository.NotificationRepository;
import com.eventhub.api.domain.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    private final EmailService emailService;

    @KafkaListener(topics = KafkaConfig.TOPIC_NOTIFICATION_EVENTS, groupId = "eventhub-notifications")
    public void handleNotificationEvent(String message) {
        try {
            JsonNode json = objectMapper.readTree(message);
            Long userId = json.get("userId").asLong();
            String title = json.get("title").asText();
            String body = json.get("message").asText();
            String type = json.get("type").asText();

            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return;

            Notification notification = Notification.builder()
                    .user(user)
                    .title(title)
                    .message(body)
                    .type(NotificationType.valueOf(type))
                    .build();
            notificationRepository.save(notification);

            // WebSocket broadcast
            messagingTemplate.convertAndSend("/topic/notifications/" + userId,
                    objectMapper.writeValueAsString(Map.of(
                            "id", notification.getId(),
                            "title", title,
                            "message", body,
                            "type", type
                    )));

            // Email notification
            emailService.sendNotificationEmail(user.getEmail(), title, body);

            log.info("Notification saved, sent via WebSocket and email to user {}: {}", userId, title);
        } catch (Exception e) {
            log.error("Failed to process notification event: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = KafkaConfig.TOPIC_BOOKING_EVENTS, groupId = "eventhub-notifications")
    public void handleBookingEvent(String message) {
        try {
            JsonNode json = objectMapper.readTree(message);
            String event = json.get("event").asText();
            String listingName = json.get("listingName").asText();
            log.info("Booking event received: {} for listing '{}'", event, listingName);
        } catch (Exception e) {
            log.error("Failed to process booking event: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = KafkaConfig.TOPIC_REVIEW_EVENTS, groupId = "eventhub-notifications")
    public void handleReviewEvent(String message) {
        try {
            JsonNode json = objectMapper.readTree(message);
            String listingName = json.get("listingName").asText();
            int rating = json.get("rating").asInt();
            log.info("Review event received: {} stars for '{}'", rating, listingName);
        } catch (Exception e) {
            log.error("Failed to process review event: {}", e.getMessage());
        }
    }
}
