package com.eventhub.api.controller;

import com.eventhub.api.dto.request.CreateListingRequest;
import com.eventhub.api.dto.response.ListingResponse;
import com.eventhub.api.service.ListingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
public class ListingController {

    private final ListingService listingService;

    @GetMapping
    public ResponseEntity<Page<ListingResponse>> getAll(
            Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer minGuests,
            @RequestParam(required = false) String eventType) {
        return ResponseEntity.ok(listingService.findAll(pageable, search, minPrice, maxPrice, minGuests, eventType));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ListingResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(listingService.findById(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ListingResponse> create(
            @Valid @RequestPart("listing") CreateListingRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(listingService.create(request, files, userDetails.getUsername()));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ListingResponse> update(
            @PathVariable Long id,
            @Valid @RequestPart("listing") CreateListingRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(listingService.update(id, request, files, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        listingService.delete(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-listings")
    public ResponseEntity<Page<ListingResponse>> getMyListings(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable) {
        return ResponseEntity.ok(listingService.findByOwner(userDetails.getUsername(), pageable));
    }
}
