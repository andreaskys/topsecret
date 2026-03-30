package com.eventhub.api.service;

import com.eventhub.api.domain.entity.Listing;
import com.eventhub.api.domain.entity.Review;
import com.eventhub.api.domain.entity.User;
import com.eventhub.api.domain.repository.ListingRepository;
import com.eventhub.api.domain.repository.ReviewRepository;
import com.eventhub.api.domain.repository.UserRepository;
import com.eventhub.api.dto.request.CreateReviewRequest;
import com.eventhub.api.dto.response.ReviewResponse;
import com.eventhub.api.dto.response.UserResponse;
import com.eventhub.api.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReviewResponse create(Long listingId, CreateReviewRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found"));

        Listing listing = listingRepository.findById(listingId)
                .filter(Listing::getActive)
                .orElseThrow(() -> new BusinessException("Listing not found"));

        if (listing.getOwner().getId().equals(user.getId())) {
            throw new BusinessException("You cannot review your own listing");
        }

        if (reviewRepository.existsByUserIdAndListingId(user.getId(), listingId)) {
            throw new BusinessException("You have already reviewed this listing");
        }

        Review review = Review.builder()
                .listing(listing)
                .user(user)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        review = reviewRepository.save(review);

        BigDecimal avgRating = reviewRepository.calculateAverageRating(listingId);
        long count = reviewRepository.countByListingId(listingId);
        listing.setAvgRating(avgRating);
        listing.setRatingCount((int) count);
        listingRepository.save(listing);

        return toResponse(review);
    }

    public Page<ReviewResponse> findByListing(Long listingId, Pageable pageable) {
        if (!listingRepository.existsById(listingId)) {
            throw new BusinessException("Listing not found");
        }
        return reviewRepository.findByListingId(listingId, pageable).map(this::toResponse);
    }

    private ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .user(UserResponse.builder()
                        .id(review.getUser().getId())
                        .fullName(review.getUser().getFullName())
                        .email(review.getUser().getEmail())
                        .phoneNumber(review.getUser().getPhoneNumber())
                        .build())
                .build();
    }
}
