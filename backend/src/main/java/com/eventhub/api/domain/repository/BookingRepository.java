package com.eventhub.api.domain.repository;

import com.eventhub.api.domain.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    Page<Booking> findByUserId(Long userId, Pageable pageable);

    Page<Booking> findByListingId(Long listingId, Pageable pageable);

    boolean existsByListingIdAndEventDateAndStatusNot(Long listingId, LocalDate eventDate, String status);
}
