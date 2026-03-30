package com.eventhub.api.service;

import com.eventhub.api.domain.entity.Notification;
import com.eventhub.api.domain.entity.User;
import com.eventhub.api.domain.repository.NotificationRepository;
import com.eventhub.api.domain.repository.UserRepository;
import com.eventhub.api.dto.response.NotificationResponse;
import com.eventhub.api.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L).fullName("John").email("john@test.com").build();
    }

    @Test
    void getNotifications_success() {
        Notification n1 = Notification.builder()
                .id(1L).user(user).title("Booking").message("New booking")
                .read(false).type("BOOKING").createdAt(LocalDateTime.now())
                .build();
        Notification n2 = Notification.builder()
                .id(2L).user(user).title("Payment").message("Payment received")
                .read(true).type("PAYMENT").createdAt(LocalDateTime.now())
                .build();

        Pageable pageable = PageRequest.of(0, 10);
        Page<Notification> page = new PageImpl<>(List.of(n1, n2), pageable, 2);

        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(user));
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L, pageable)).thenReturn(page);

        Page<NotificationResponse> result = notificationService.getNotifications("john@test.com", pageable);

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("Booking");
        assertThat(result.getContent().get(0).getRead()).isFalse();
        assertThat(result.getContent().get(1).getRead()).isTrue();
    }

    @Test
    void getUnreadCount_success() {
        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(user));
        when(notificationRepository.countByUserIdAndReadFalse(1L)).thenReturn(5L);

        long count = notificationService.getUnreadCount("john@test.com");

        assertThat(count).isEqualTo(5);
    }

    @Test
    void markAllAsRead_success() {
        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(user));

        notificationService.markAllAsRead("john@test.com");

        verify(notificationRepository).markAllAsRead(1L);
    }

    @Test
    void getNotifications_userNotFound_throwsException() {
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.getNotifications("unknown@test.com", PageRequest.of(0, 10)))
                .isInstanceOf(BusinessException.class)
                .hasMessage("User not found");
    }

    @Test
    void getUnreadCount_userNotFound_throwsException() {
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.getUnreadCount("unknown@test.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("User not found");
    }

    @Test
    void markAllAsRead_userNotFound_throwsException() {
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markAllAsRead("unknown@test.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("User not found");
    }
}
