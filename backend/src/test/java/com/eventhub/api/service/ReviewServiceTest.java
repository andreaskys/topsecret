package com.eventhub.api.service;

import com.eventhub.api.domain.entity.Listing;
import com.eventhub.api.domain.entity.Review;
import com.eventhub.api.domain.entity.User;
import com.eventhub.api.domain.repository.ListingRepository;
import com.eventhub.api.domain.repository.ReviewRepository;
import com.eventhub.api.domain.repository.UserRepository;
import com.eventhub.api.dto.request.CreateReviewRequest;
import com.eventhub.api.dto.response.ReviewResponse;
import com.eventhub.api.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ReviewService reviewService;

    private User reviewer;
    private User owner;
    private Listing listing;
    private CreateReviewRequest reviewRequest;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L).fullName("Owner").email("owner@test.com")
                .phoneNumber("11111").build();

        reviewer = User.builder()
                .id(2L).fullName("Reviewer").email("reviewer@test.com")
                .phoneNumber("22222").build();

        listing = Listing.builder()
                .id(10L).name("Event Space").owner(owner)
                .active(true).avgRating(BigDecimal.ZERO).ratingCount(0)
                .build();

        reviewRequest = new CreateReviewRequest();
        reviewRequest.setRating(5);
        reviewRequest.setComment("Great space!");
    }

    @Test
    void create_success() {
        when(userRepository.findByEmail("reviewer@test.com")).thenReturn(Optional.of(reviewer));
        when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));
        when(reviewRepository.existsByUserIdAndListingId(2L, 10L)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> {
            Review r = inv.getArgument(0);
            r.setId(1L);
            return r;
        });
        when(reviewRepository.calculateAverageRating(10L)).thenReturn(new BigDecimal("5.00"));
        when(reviewRepository.countByListingId(10L)).thenReturn(1L);
        when(listingRepository.save(any(Listing.class))).thenReturn(listing);

        ReviewResponse response = reviewService.create(10L, reviewRequest, "reviewer@test.com");

        assertThat(response).isNotNull();
        assertThat(response.getRating()).isEqualTo(5);
        assertThat(response.getComment()).isEqualTo("Great space!");
        verify(listingRepository).save(any(Listing.class));
    }

    @Test
    void create_ownListing_throwsException() {
        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(owner));
        when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));

        assertThatThrownBy(() -> reviewService.create(10L, reviewRequest, "owner@test.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("You cannot review your own listing");
    }

    @Test
    void create_alreadyReviewed_throwsException() {
        when(userRepository.findByEmail("reviewer@test.com")).thenReturn(Optional.of(reviewer));
        when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));
        when(reviewRepository.existsByUserIdAndListingId(2L, 10L)).thenReturn(true);

        assertThatThrownBy(() -> reviewService.create(10L, reviewRequest, "reviewer@test.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("You have already reviewed this listing");
    }

    @Test
    void create_listingNotFound_throwsException() {
        when(userRepository.findByEmail("reviewer@test.com")).thenReturn(Optional.of(reviewer));
        when(listingRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reviewService.create(10L, reviewRequest, "reviewer@test.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Listing not found");
    }

    @Test
    void findByListing_listingNotFound_throwsException() {
        when(listingRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> reviewService.findByListing(99L, null))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Listing not found");
    }
}
