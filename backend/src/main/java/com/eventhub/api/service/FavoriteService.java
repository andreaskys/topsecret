package com.eventhub.api.service;

import com.eventhub.api.domain.entity.Favorite;
import com.eventhub.api.domain.entity.Listing;
import com.eventhub.api.domain.entity.User;
import com.eventhub.api.domain.repository.FavoriteRepository;
import com.eventhub.api.domain.repository.ListingRepository;
import com.eventhub.api.domain.repository.UserRepository;
import com.eventhub.api.dto.response.ListingResponse;
import com.eventhub.api.dto.response.MediaResponse;
import com.eventhub.api.dto.response.PublicUserResponse;
import com.eventhub.api.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;

    @Transactional
    public void toggle(Long listingId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found"));
        Listing listing = listingRepository.findById(listingId)
                .filter(Listing::getActive)
                .orElseThrow(() -> new BusinessException("Listing not found"));

        if (favoriteRepository.existsByUserIdAndListingId(user.getId(), listingId)) {
            favoriteRepository.deleteByUserIdAndListingId(user.getId(), listingId);
        } else {
            favoriteRepository.save(Favorite.builder().user(user).listing(listing).build());
        }
    }

    public boolean isFavorited(Long listingId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found"));
        return favoriteRepository.existsByUserIdAndListingId(user.getId(), listingId);
    }

    public Page<ListingResponse> getFavorites(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found"));
        return favoriteRepository.findByUserId(user.getId(), pageable)
                .map(fav -> toListingResponse(fav.getListing()));
    }

    private ListingResponse toListingResponse(Listing listing) {
        List<String> amenities = listing.getAmenities() != null
                ? listing.getAmenities().stream()
                    .map(a -> a.getName()).toList()
                : new ArrayList<>();

        List<MediaResponse> media = listing.getMedia() != null
                ? listing.getMedia().stream()
                    .map(m -> MediaResponse.builder().id(m.getId()).url(m.getUrl()).mediaType(m.getMediaType().name()).build())
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
                .owner(PublicUserResponse.builder()
                        .id(listing.getOwner().getId())
                        .fullName(listing.getOwner().getFullName())
                        .avatarUrl(listing.getOwner().getAvatarUrl())
                        .build())
                .build();
    }
}
