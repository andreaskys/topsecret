package com.eventhub.api.domain.repository;

import com.eventhub.api.domain.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByListingId(Long listingId, Pageable pageable);

    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM Review r WHERE r.listing.id = :listingId")
    BigDecimal calculateAverageRating(Long listingId);

    long countByListingId(Long listingId);

    boolean existsByUserIdAndListingId(Long userId, Long listingId);
}
