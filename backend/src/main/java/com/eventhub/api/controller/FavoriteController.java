package com.eventhub.api.controller;

import com.eventhub.api.dto.response.ListingResponse;
import com.eventhub.api.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @PostMapping("/{listingId}")
    public ResponseEntity<Map<String, Boolean>> toggle(
            @PathVariable Long listingId,
            @AuthenticationPrincipal UserDetails userDetails) {
        favoriteService.toggle(listingId, userDetails.getUsername());
        boolean favorited = favoriteService.isFavorited(listingId, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("favorited", favorited));
    }

    @GetMapping("/{listingId}/check")
    public ResponseEntity<Map<String, Boolean>> check(
            @PathVariable Long listingId,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean favorited = favoriteService.isFavorited(listingId, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("favorited", favorited));
    }

    @GetMapping
    public ResponseEntity<Page<ListingResponse>> getFavorites(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable) {
        return ResponseEntity.ok(favoriteService.getFavorites(userDetails.getUsername(), pageable));
    }
}
