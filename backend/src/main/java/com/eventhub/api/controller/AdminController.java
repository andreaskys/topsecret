package com.eventhub.api.controller;

import com.eventhub.api.domain.repository.*;
import com.eventhub.api.dto.response.UserResponse;
import com.eventhub.api.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(Map.of(
                "totalUsers", userRepository.count(),
                "totalListings", listingRepository.countByActiveTrue(),
                "totalBookings", bookingRepository.count(),
                "totalReviews", reviewRepository.count()
        ));
    }

    @GetMapping("/users")
    public ResponseEntity<Page<UserResponse>> getUsers(Pageable pageable) {
        return ResponseEntity.ok(userRepository.findAll(pageable).map(u ->
                UserResponse.builder()
                        .id(u.getId())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .phoneNumber(u.getPhoneNumber())
                        .avatarUrl(u.getAvatarUrl())
                        .role(u.getRole())
                        .build()
        ));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<UserResponse> updateRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        var user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("User not found"));
        user.setRole(body.get("role"));
        userRepository.save(user);
        return ResponseEntity.ok(UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .build());
    }
}
