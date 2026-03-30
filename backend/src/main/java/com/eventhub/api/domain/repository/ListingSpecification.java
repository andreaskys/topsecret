package com.eventhub.api.domain.repository;

import com.eventhub.api.domain.entity.Listing;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

public class ListingSpecification {

    public static Specification<Listing> isActive() {
        return (root, query, cb) -> cb.isTrue(root.get("active"));
    }

    public static Specification<Listing> searchByNameOrLocation(String search) {
        return (root, query, cb) -> {
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("location")), pattern)
            );
        };
    }

    public static Specification<Listing> minPrice(BigDecimal minPrice) {
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("price"), minPrice);
    }

    public static Specification<Listing> maxPrice(BigDecimal maxPrice) {
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("price"), maxPrice);
    }

    public static Specification<Listing> minGuests(Integer minGuests) {
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("maxGuests"), minGuests);
    }

    public static Specification<Listing> eventType(String eventType) {
        return (root, query, cb) -> cb.equal(cb.lower(root.get("eventType")), eventType.toLowerCase());
    }
}
