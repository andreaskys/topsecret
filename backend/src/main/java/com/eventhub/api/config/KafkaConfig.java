package com.eventhub.api.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    public static final String TOPIC_BOOKING_EVENTS = "booking-events";
    public static final String TOPIC_REVIEW_EVENTS = "review-events";
    public static final String TOPIC_NOTIFICATION_EVENTS = "notification-events";

    @Bean
    public NewTopic bookingEventsTopic() {
        return TopicBuilder.name(TOPIC_BOOKING_EVENTS).partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic reviewEventsTopic() {
        return TopicBuilder.name(TOPIC_REVIEW_EVENTS).partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic notificationEventsTopic() {
        return TopicBuilder.name(TOPIC_NOTIFICATION_EVENTS).partitions(1).replicas(1).build();
    }
}
