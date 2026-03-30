-- Avatar and role for users
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(1000);
ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- Event type for listings
ALTER TABLE listings ADD COLUMN event_type VARCHAR(100);

CREATE INDEX idx_listings_event_type ON listings (event_type);
CREATE INDEX idx_listings_price ON listings (price);
CREATE INDEX idx_listings_max_guests ON listings (max_guests);

-- Favorites
CREATE TABLE favorites (
    id         BIGSERIAL  PRIMARY KEY,
    user_id    BIGINT     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id BIGINT     NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMP  NOT NULL DEFAULT NOW(),

    CONSTRAINT uk_favorites_user_listing UNIQUE (user_id, listing_id)
);

CREATE INDEX idx_favorites_user_id ON favorites (user_id);

-- Bookings
CREATE TABLE bookings (
    id          BIGSERIAL      PRIMARY KEY,
    listing_id  BIGINT         NOT NULL REFERENCES listings(id),
    user_id     BIGINT         NOT NULL REFERENCES users(id),
    event_date  DATE           NOT NULL,
    guest_count INT            NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    status      VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    notes       TEXT,
    created_at  TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_listing_id ON bookings (listing_id);
CREATE INDEX idx_bookings_user_id    ON bookings (user_id);
CREATE INDEX idx_bookings_status     ON bookings (status);

-- Payments
CREATE TABLE payments (
    id             BIGSERIAL      PRIMARY KEY,
    booking_id     BIGINT         NOT NULL REFERENCES bookings(id),
    amount         DECIMAL(12, 2) NOT NULL,
    status         VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    created_at     TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_booking_id ON payments (booking_id);

-- Notifications
CREATE TABLE notifications (
    id         BIGSERIAL    PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(255) NOT NULL,
    message    TEXT         NOT NULL,
    read       BOOLEAN      NOT NULL DEFAULT FALSE,
    type       VARCHAR(50)  NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_read    ON notifications (read);
