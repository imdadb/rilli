BEGIN;

-- 0 · extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1 · tables
CREATE TABLE roles (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE
);
CREATE TABLE permissions (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE
);
CREATE TABLE users (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  password text,
  name  text
);
CREATE TABLE role_user (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);
CREATE TABLE permission_role (
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 2 · seed roles
INSERT INTO roles (name) VALUES
  ('super_admin'), ('CEO'), ('campus_director')
ON CONFLICT DO NOTHING;

-- 3 · seed core users (blank passwords – UI will set)
WITH new_users AS (
  INSERT INTO users (email, name) VALUES
    ('imdadb@gmail.com','System Super Admin'),
    ('tfssteam@gmail.com','Test CEO'),
    ('tfss.manage@gmail.com','Test Campus Dir')
  RETURNING id, email
)
INSERT INTO role_user (user_id, role_id)
SELECT
  u.id,
  r.id
FROM new_users u
JOIN roles r
  ON (r.name='super_admin'      AND u.email='imdadb@gmail.com')
  OR (r.name='CEO'              AND u.email='tfssteam@gmail.com')
  OR (r.name='campus_director'  AND u.email='tfss.manage@gmail.com');

COMMIT;
