CREATE TYPE provider AS ENUM ('local', 'goolge', 'facebook');
CREATE TYPE is_verify AS ENUM ('pass', 'not_yet');

CREATE TABLE IF NOT EXISTS users (
    id serial PRIMARY KEY,
    email VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(50),
    hashed_password VARCHAR(200),
    provider provider NOT NULL,
    subject VARCHAR(50),
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_verify is_verify NOT NULL,
    last_login_time TIMESTAMP,
    login_times INT DEFAULT 0,
    last_active_time TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verify_email (
    id serial PRIMARY KEY,
    user_id int UNIQUE NOT NULL,
    hash VARCHAR(300) UNIQUE NOT NULL,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);