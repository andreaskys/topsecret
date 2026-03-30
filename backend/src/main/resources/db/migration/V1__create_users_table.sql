CREATE TABLE users (
    id            BIGSERIAL    PRIMARY KEY,
    full_name     VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    birth_date    DATE         NOT NULL,
    cpf           VARCHAR(14)  NOT NULL,
    phone_number  VARCHAR(20)  NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT uk_users_email        UNIQUE (email),
    CONSTRAINT uk_users_cpf          UNIQUE (cpf),
    CONSTRAINT uk_users_phone_number UNIQUE (phone_number)
);

CREATE INDEX idx_users_email ON users (email);
