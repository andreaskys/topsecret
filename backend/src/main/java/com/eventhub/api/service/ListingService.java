package com.eventhub.api.service;

import com.eventhub.api.domain.entity.*;
import com.eventhub.api.domain.repository.ListingRepository;
import com.eventhub.api.domain.repository.ListingSpecification;
import com.eventhub.api.domain.repository.UserRepository;
import com.eventhub.api.dto.request.CreateListingRequest;
import com.eventhub.api.dto.response.ListingResponse;
import com.eventhub.api.dto.response.MediaResponse;
import com.eventhub.api.dto.response.UserResponse;
import com.eventhub.api.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ListingService {

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    @Cacheable(value = "listings", key = "#pageable.pageNumber + '-' + #pageable.pageSize + '-' + #search + '-' + #minPrice + '-' + #maxPrice + '-' + #minGuests + '-' + #eventType")
    public Page<ListingResponse> findAll(Pageable pageable, String search, BigDecimal minPrice, BigDecimal maxPrice, Integer minGuests, String eventType) {
        Specification<Listing> spec = Specification.where(ListingSpecification.isActive());
        if (search != null && !search.isBlank()) {
            spec = spec.and(ListingSpecification.searchByNameOrLocation(search));
        }
        if (minPrice != null) {
            spec = spec.and(ListingSpecification.minPrice(minPrice));
        }
        if (maxPrice != null) {
            spec = spec.and(ListingSpecification.maxPrice(maxPrice));
        }
        if (minGuests != null) {
            spec = spec.and(ListingSpecification.minGuests(minGuests));
        }
        if (eventType != null && !eventType.isBlank()) {
            spec = spec.and(ListingSpecification.eventType(eventType));
        }
        return listingRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Cacheable(value = "listing", key = "#id")
    public ListingResponse findById(Long id) {
        Listing listing = listingRepository.findById(id)
                .filter(Listing::getActive)
                .orElseThrow(() -> new BusinessException("Listing not found"));
        return toResponse(listing);
    }

    public Page<ListingResponse> findByOwner(String email, Pageable pageable) {
        User owner = findUserByEmail(email);
        return listingRepository.findByOwnerIdAndActiveTrue(owner.getId(), pageable).map(this::toResponse);
    }

    @Transactional
    @CacheEvict(value = "listings", allEntries = true)
    public ListingResponse create(CreateListingRequest request, List<MultipartFile> files, String email) {
        User owner = findUserByEmail(email);

        Listing listing = Listing.builder()
                .owner(owner)
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .location(request.getLocation())
                .maxGuests(request.getMaxGuests())
                .eventType(request.getEventType())
                .build();

        if (request.getAmenities() != null) {
            request.getAmenities().forEach(name -> {
                ListingAmenity amenity = ListingAmenity.builder()
                        .listing(listing)
                        .name(name)
                        .build();
                listing.getAmenities().add(amenity);
            });
        }

        if (files != null) {
            files.forEach(file -> {
                String url = storageService.upload(file);
                String mediaType = file.getContentType() != null && file.getContentType().startsWith("video")
                        ? "VIDEO" : "IMAGE";
                ListingMedia media = ListingMedia.builder()
                        .listing(listing)
                        .url(url)
                        .mediaType(mediaType)
                        .build();
                listing.getMedia().add(media);
            });
        }

        return toResponse(listingRepository.save(listing));
    }

    @Transactional
    @CacheEvict(value = {"listings", "listing"}, allEntries = true)
    public ListingResponse update(Long id, CreateListingRequest request, List<MultipartFile> files, String email) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Listing not found"));

        if (!listing.getOwner().getEmail().equals(email)) {
            throw new BusinessException("You can only edit your own listings");
        }

        listing.setName(request.getName());
        listing.setDescription(request.getDescription());
        listing.setPrice(request.getPrice());
        listing.setLocation(request.getLocation());
        listing.setMaxGuests(request.getMaxGuests());
        listing.setEventType(request.getEventType());

        listing.getAmenities().clear();
        if (request.getAmenities() != null) {
            request.getAmenities().forEach(name -> {
                ListingAmenity amenity = ListingAmenity.builder()
                        .listing(listing)
                        .name(name)
                        .build();
                listing.getAmenities().add(amenity);
            });
        }

        if (files != null && !files.isEmpty()) {
            files.forEach(file -> {
                String url = storageService.upload(file);
                String mediaType = file.getContentType() != null && file.getContentType().startsWith("video")
                        ? "VIDEO" : "IMAGE";
                ListingMedia media = ListingMedia.builder()
                        .listing(listing)
                        .url(url)
                        .mediaType(mediaType)
                        .build();
                listing.getMedia().add(media);
            });
        }

        return toResponse(listingRepository.save(listing));
    }

    @Transactional
    @CacheEvict(value = {"listings", "listing"}, allEntries = true)
    public void delete(Long id, String email) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Listing not found"));

        if (!listing.getOwner().getEmail().equals(email)) {
            throw new BusinessException("You can only delete your own listings");
        }

        listing.setActive(false);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found"));
    }

    private ListingResponse toResponse(Listing listing) {
        List<String> amenities = listing.getAmenities() != null
                ? listing.getAmenities().stream().map(ListingAmenity::getName).toList()
                : new ArrayList<>();

        List<MediaResponse> media = listing.getMedia() != null
                ? listing.getMedia().stream()
                    .map(m -> MediaResponse.builder()
                            .id(m.getId())
                            .url(m.getUrl())
                            .mediaType(m.getMediaType())
                            .build())
                    .toList()
                : new ArrayList<>();

        return ListingResponse.builder()
                .id(listing.getId())
                .name(listing.getName())
                .description(listing.getDescription())
                .price(listing.getPrice())
                .location(listing.getLocation())
                .maxGuests(listing.getMaxGuests())
                .avgRating(listing.getAvgRating())
                .ratingCount(listing.getRatingCount())
                .eventType(listing.getEventType())
                .amenities(amenities)
                .media(media)
                .owner(UserResponse.builder()
                        .id(listing.getOwner().getId())
                        .fullName(listing.getOwner().getFullName())
                        .email(listing.getOwner().getEmail())
                        .phoneNumber(listing.getOwner().getPhoneNumber())
                        .avatarUrl(listing.getOwner().getAvatarUrl())
                        .role(listing.getOwner().getRole())
                        .build())
                .build();
    }
}
