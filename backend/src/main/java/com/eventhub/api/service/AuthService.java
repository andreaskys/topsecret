package com.eventhub.api.service;

import com.eventhub.api.domain.entity.User;
import com.eventhub.api.domain.repository.UserRepository;
import com.eventhub.api.dto.request.LoginRequest;
import com.eventhub.api.dto.request.RegisterRequest;
import com.eventhub.api.dto.response.AuthResponse;
import com.eventhub.api.exception.BusinessException;
import com.eventhub.api.security.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;
    private final EmailService emailService;
    private final AuditService auditService;

    @Value("${jwt.cookie-secure:false}")
    private boolean cookieSecure;

    @Value("${jwt.cookie-domain:}")
    private String cookieDomain;

    @Transactional
    public AuthResponse register(RegisterRequest request, HttpServletResponse response) {
        if (userRepository.existsByEmail(request.getEmail())
                || userRepository.existsByCpf(request.getCpf())
                || userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new BusinessException("Registration failed. Please check your information.");
        }

        String verificationToken = UUID.randomUUID().toString();

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .birthDate(parseBirthDate(request.getBirthDate()))
                .cpf(request.getCpf())
                .phoneNumber(request.getPhoneNumber())
                .verificationToken(verificationToken)
                .verificationTokenExpiry(LocalDateTime.now().plusHours(24))
                .build();

        user = userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), verificationToken);

        auditService.log("USER_REGISTERED", "USER", user.getId(), user.getId());

        return issueTokens(user, response);
    }

    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessException("Invalid credentials");
        }

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BusinessException("Email not verified. Please check your inbox.");
        }

        auditService.log("USER_LOGIN", "USER", user.getId(), user.getId());

        return issueTokens(user, response);
    }

    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new BusinessException("Invalid verification token"));

        if (user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Verification token expired");
        }

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);
    }

    @Transactional
    public void resendVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found"));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BusinessException("Email already verified");
        }

        String token = UUID.randomUUID().toString();
        user.setVerificationToken(token);
        user.setVerificationTokenExpiry(LocalDateTime.now().plusHours(24));
        userRepository.save(user);

        emailService.sendVerificationEmail(email, token);
    }

    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            // Don't reveal whether the email exists
            return;
        }

        String token = UUID.randomUUID().toString();
        user.setPasswordResetToken(token);
        user.setPasswordResetTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        emailService.sendPasswordResetEmail(email, token);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new BusinessException("Invalid reset token"));

        if (user.getPasswordResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Reset token expired");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiry(null);
        userRepository.save(user);
    }

    public AuthResponse refresh(String refreshToken, HttpServletResponse response) {
        if (refreshToken == null || !jwtService.isTokenValid(refreshToken)) {
            throw new BusinessException("Invalid refresh token");
        }

        String jti = jwtService.extractJti(refreshToken);
        String email = tokenBlacklistService.getRefreshTokenEmail(jti);
        if (email == null) {
            throw new BusinessException("Refresh token revoked or expired");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found"));

        // Revoke old refresh token
        tokenBlacklistService.revokeRefreshToken(jti);

        return issueTokens(user, response);
    }

    public void logout(String accessToken, String refreshToken, HttpServletResponse response) {
        Long logoutUserId = null;

        if (accessToken != null) {
            try {
                String email = jwtService.extractEmail(accessToken);
                User user = userRepository.findByEmail(email).orElse(null);
                if (user != null) {
                    logoutUserId = user.getId();
                }
                String jti = jwtService.extractJti(accessToken);
                long remaining = jwtService.extractExpiration(accessToken).getTime() - System.currentTimeMillis();
                tokenBlacklistService.blacklistAccessToken(jti, remaining);
            } catch (Exception e) {
                // Token may be invalid/expired — that's fine on logout
            }
        }

        if (refreshToken != null) {
            try {
                String jti = jwtService.extractJti(refreshToken);
                tokenBlacklistService.revokeRefreshToken(jti);
            } catch (Exception e) {
                // Token may be invalid — that's fine
            }
        }

        if (logoutUserId != null) {
            auditService.log("USER_LOGOUT", "USER", logoutUserId, logoutUserId);
        }

        clearCookies(response);
    }

    private AuthResponse issueTokens(User user, HttpServletResponse response) {
        String accessToken = jwtService.generateAccessToken(user.getEmail());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        // Store refresh token JTI in Redis
        String refreshJti = jwtService.extractJti(refreshToken);
        tokenBlacklistService.storeRefreshToken(
                refreshJti, user.getEmail(),
                Duration.ofMillis(jwtService.getRefreshTokenExpiration())
        );

        // Set httpOnly cookies
        addCookie(response, "access_token", accessToken,
                (int) (jwtService.getAccessTokenExpiration() / 1000));
        addCookie(response, "refresh_token", refreshToken,
                (int) (jwtService.getRefreshTokenExpiration() / 1000));

        return new AuthResponse(user.getEmail(), user.getFullName(), user.getId(), user.getRole().name());
    }

    private void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/");
        cookie.setMaxAge(maxAge);
        if (cookieDomain != null && !cookieDomain.isBlank()) {
            cookie.setDomain(cookieDomain);
        }
        response.addCookie(cookie);
    }

    private void clearCookies(HttpServletResponse response) {
        addCookie(response, "access_token", "", 0);
        addCookie(response, "refresh_token", "", 0);
    }

    private LocalDate parseBirthDate(String birthDate) {
        try {
            return LocalDate.parse(birthDate);
        } catch (DateTimeParseException e) {
            throw new BusinessException("Invalid birth date format. Use yyyy-MM-dd");
        }
    }
}
