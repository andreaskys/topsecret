package com.eventhub.api.domain.repository;

import com.eventhub.api.domain.entity.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    Page<Favorite> findByUserId(Long userId, Pageable pageable);

    Optional<Favorite> findByUserIdAndListingId(Long userId, Long listingId);

    boolean existsByUserIdAndListingId(Long userId, Long listingId);

    void deleteByUserIdAndListingId(Long userId, Long listingId);

    List<Long> findListingIdsByUserId(Long userId);
}
