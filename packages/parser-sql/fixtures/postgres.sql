CREATE TYPE order_status AS ENUM ('pending', 'paid', 'cancelled');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  status order_status NOT NULL DEFAULT 'pending'
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE UNIQUE INDEX idx_orders_user_created ON orders (user_id, created_at);
