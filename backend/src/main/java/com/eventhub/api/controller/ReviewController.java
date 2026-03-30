package com.eventhub.api.controller;

import com.eventhub.api.dto.request.CreateReviewRequest;
import com.eventhub.api.dto.response.ReviewResponse;
import com.eventhub.api.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/listings/{listingId}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewResponse> create(
            @PathVariable Long listingId,
            @Valid @RequestBody CreateReviewRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.create(listingId, request, userDetails.getUsername()));
    }

    @GetMapping
    public ResponseEntity<Page<ReviewResponse>> getByListing(
            @PathVariable Long listingId,
            Pageable pageable) {
        return ResponseEntity.ok(reviewService.findByListing(listingId, pageable));
    }
}
