package com.eventhub.api.service;

import com.eventhub.api.domain.entity.User;
import com.eventhub.api.domain.enums.UserRole;
import com.eventhub.api.domain.repository.UserRepository;
import com.eventhub.api.dto.request.LoginRequest;
import com.eventhub.api.dto.request.RegisterRequest;
import com.eventhub.api.dto.response.AuthResponse;
import com.eventhub.api.exception.BusinessException;
import com.eventhub.api.security.JwtService;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private TokenBlacklistService tokenBlacklistService;

    @Mock
    private EmailService emailService;

    @Mock
    private AuditService auditService;

    @Mock
    private HttpServletResponse httpResponse;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User user;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setFullName("John Doe");
        registerRequest.setEmail("john@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setBirthDate("1990-01-01");
        registerRequest.setCpf("123.456.789-00");
        registerRequest.setPhoneNumber("(11) 99999-0000");

        loginRequest = new LoginRequest();
        loginRequest.setEmail("john@example.com");
        loginRequest.setPassword("password123");

        user = User.builder()
                .id(1L)
                .fullName("John Doe")
                .email("john@example.com")
                .passwordHash("encoded_password")
                .role(UserRole.USER)
                .emailVerified(true)
                .build();
    }

    @Test
    void register_success() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByCpf(anyString())).thenReturn(false);
        when(userRepository.existsByPhoneNumber(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_password");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtService.generateAccessToken(anyString())).thenReturn("access_token");
        when(jwtService.generateRefreshToken(anyString())).thenReturn("refresh_token");
        when(jwtService.extractJti(anyString())).thenReturn("jti-123");
        when(jwtService.getAccessTokenExpiration()).thenReturn(900000L);
        when(jwtService.getRefreshTokenExpiration()).thenReturn(604800000L);

        AuthResponse response = authService.register(registerRequest, httpResponse);

        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo("john@example.com");
        assertThat(response.getFullName()).isEqualTo("John Doe");
        assertThat(response.getUserId()).isEqualTo(1L);
        assertThat(response.getRole()).isEqualTo("USER");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_duplicate_throwsException() {
        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest, httpResponse))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Registration failed. Please check your information.");

        verify(userRepository, never()).save(any());
    }

    @Test
    void login_success() {
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encoded_password")).thenReturn(true);
        when(jwtService.generateAccessToken("john@example.com")).thenReturn("access_token");
        when(jwtService.generateRefreshToken("john@example.com")).thenReturn("refresh_token");
        when(jwtService.extractJti(anyString())).thenReturn("jti-123");
        when(jwtService.getAccessTokenExpiration()).thenReturn(900000L);
        when(jwtService.getRefreshTokenExpiration()).thenReturn(604800000L);

        AuthResponse response = authService.login(loginRequest, httpResponse);

        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo("john@example.com");
    }

    @Test
    void login_invalidEmail_throwsException() {
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(loginRequest, httpResponse))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Invalid credentials");
    }

    @Test
    void login_invalidPassword_throwsException() {
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encoded_password")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(loginRequest, httpResponse))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Invalid credentials");
    }
}
