package com.eventhub.api.service;

import com.eventhub.api.domain.entity.Favorite;
import com.eventhub.api.domain.entity.Listing;
import com.eventhub.api.domain.entity.User;
import com.eventhub.api.domain.repository.FavoriteRepository;
import com.eventhub.api.domain.repository.ListingRepository;
import com.eventhub.api.domain.repository.UserRepository;
import com.eventhub.api.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FavoriteServiceTest {

    @Mock
    private FavoriteRepository favoriteRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private FavoriteService favoriteService;

    private User user;
    private Listing listing;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L).fullName("John").email("john@test.com")
                .phoneNumber("11111").build();

        listing = Listing.builder()
                .id(10L).name("Event Space").active(true)
                .owner(User.builder().id(2L).fullName("Owner").email("owner@test.com").phoneNumber("22222").build())
                .price(new BigDecimal("500.00")).maxGuests(100)
                .location("SP").avgRating(BigDecimal.ZERO).ratingCount(0)
                .amenities(new ArrayList<>()).media(new ArrayList<>())
                .build();
    }

    @Test
    void toggle_addFavorite() {
        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(user));
        when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));
        when(favoriteRepository.existsByUserIdAndListingId(1L, 10L)).thenReturn(false);

        favoriteService.toggle(10L, "john@test.com");

        verify(favoriteRepository).save(any(Favorite.class));
        verify(favoriteRepository, never()).deleteByUserIdAndListingId(anyLong(), anyLong());
    }

    @Test
    void toggle_removeFavorite() {
        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(user));
        when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));
        when(favoriteRepository.existsByUserIdAndListingId(1L, 10L)).thenReturn(true);

        favoriteService.toggle(10L, "john@test.com");

        verify(favoriteRepository).deleteByUserIdAndListingId(1L, 10L);
        verify(favoriteRepository, never()).save(any());
    }

    @Test
    void toggle_listingNotFound_throwsException() {
        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(user));
        when(listingRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> favoriteService.toggle(99L, "john@test.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Listing not found");
    }

    @Test
    void isFavorited_true() {
        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(user));
        when(favoriteRepository.existsByUserIdAndListingId(1L, 10L)).thenReturn(true);

        assertThat(favoriteService.isFavorited(10L, "john@test.com")).isTrue();
    }

    @Test
    void isFavorited_false() {
        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(user));
        when(favoriteRepository.existsByUserIdAndListingId(1L, 10L)).thenReturn(false);

        assertThat(favoriteService.isFavorited(10L, "john@test.com")).isFalse();
    }

    @Test
    void isFavorited_userNotFound_throwsException() {
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> favoriteService.isFavorited(10L, "unknown@test.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("User not found");
    }
}
