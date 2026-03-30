package com.eventhub.api.domain.repository;

import com.eventhub.api.domain.entity.Listing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ListingRepository extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {

    Page<Listing> findByActiveTrue(Pageable pageable);

    Page<Listing> findByOwnerIdAndActiveTrue(Long ownerId, Pageable pageable);

    long countByActiveTrue();
}
