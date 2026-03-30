package com.eventhub.api.controller;

import com.eventhub.api.dto.request.CreateBookingRequest;
import com.eventhub.api.dto.response.BookingResponse;
import com.eventhub.api.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/listings/{listingId}")
    public ResponseEntity<BookingResponse> create(
            @PathVariable Long listingId,
            @Valid @RequestBody CreateBookingRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.create(listingId, request, userDetails.getUsername()));
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<Page<BookingResponse>> getMyBookings(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable) {
        return ResponseEntity.ok(bookingService.getMyBookings(userDetails.getUsername(), pageable));
    }

    @GetMapping("/listings/{listingId}")
    public ResponseEntity<Page<BookingResponse>> getBookingsForListing(
            @PathVariable Long listingId,
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable) {
        return ResponseEntity.ok(bookingService.getBookingsForListing(listingId, userDetails.getUsername(), pageable));
    }

    @PatchMapping("/{bookingId}/status")
    public ResponseEntity<BookingResponse> updateStatus(
            @PathVariable Long bookingId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(bookingService.updateStatus(bookingId, body.get("status"), userDetails.getUsername()));
    }
}
