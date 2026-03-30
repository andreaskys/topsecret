CREATE TABLE listings (
    id             BIGSERIAL      PRIMARY KEY,
    owner_id       BIGINT         NOT NULL REFERENCES users(id),
    name           VARCHAR(255)   NOT NULL,
    description    TEXT           NOT NULL,
    price          DECIMAL(12, 2) NOT NULL,
    location       VARCHAR(500)   NOT NULL,
    max_guests     INT            NOT NULL,
    avg_rating     DECIMAL(3, 2)  NOT NULL DEFAULT 0.00,
    rating_count   INT            NOT NULL DEFAULT 0,
    active         BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listings_owner_id ON listings (owner_id);
CREATE INDEX idx_listings_active   ON listings (active);

CREATE TABLE listing_amenities (
    id         BIGSERIAL    PRIMARY KEY,
    listing_id BIGINT       NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL
);

CREATE INDEX idx_listing_amenities_listing_id ON listing_amenities (listing_id);

CREATE TABLE listing_media (
    id         BIGSERIAL    PRIMARY KEY,
    listing_id BIGINT       NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    url        VARCHAR(1000) NOT NULL,
    media_type VARCHAR(10)  NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listing_media_listing_id ON listing_media (listing_id);

CREATE TABLE reviews (
    id         BIGSERIAL    PRIMARY KEY,
    listing_id BIGINT       NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    user_id    BIGINT       NOT NULL REFERENCES users(id),
    rating     INT          NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment    TEXT,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT uk_reviews_user_listing UNIQUE (user_id, listing_id)
);

CREATE INDEX idx_reviews_listing_id ON reviews (listing_id);
