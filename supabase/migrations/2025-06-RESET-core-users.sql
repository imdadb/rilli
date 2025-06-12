BEGIN;

-- Ensure needed extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) Core tables (only if they don’t exist)
--    (Adjust column definitions as per your original schema)
CREATE TABLE IF NOT EXISTS users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text UNIQUE NOT NULL,
  password    text,
  user_type   text,
  status      text,
  email_verified boolean,
  name        text,
  school_id   text
);

CREATE TABLE IF NOT EXISTS roles (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE
);

CREATE TABLE IF NOT EXISTS role_user (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- 2) Seed role names (idempotent)
INSERT INTO roles (name)
VALUES ('super_admin'), ('CEO'), ('campus_director')
ON CONFLICT (name) DO NOTHING;

-- 3) Wipe existing data
TRUNCATE TABLE role_user, users CASCADE;

-- 4) Insert three core users
WITH new_users AS (
  INSERT INTO users (email, password, user_type, status, email_verified, name, school_id)
  VALUES
    ('imdadb@gmail.com',     '', 'staff','active', true,'System Super Admin','STAFF-0001'),
    ('tfssteam@gmail.com',   '', 'staff','active', true,'Test CEO','STAFF-0002'),
    ('tfss.manage@gmail.com','', 'staff','active', true,'Test Campus Dir','STAFF-0003')
  RETURNING id, email
)
INSERT INTO role_user (user_id, role_id)
SELECT
  u.id,
  r.id
FROM new_users u
JOIN roles r
  ON (r.name = 'super_admin'     AND u.email = 'imdadb@gmail.com')
  OR (r.name = 'CEO'             AND u.email = 'tfssteam@gmail.com')
  OR (r.name = 'campus_director' AND u.email = 'tfss.manage@gmail.com');

COMMIT;
