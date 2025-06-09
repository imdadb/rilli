/*
  # Create users table for authentication

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique, not null)
      - `password` (text, nullable for unverified users)
      - `email_verified` (boolean, default false)
      - `created_at` (timestamp with timezone, default now)

  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to read their own data

  3. Initial Data
    - Seed three test users:
      - superadmin (verified, password: administan)
      - tfssteam@gmail.com (verified, password: administan)
      - tfss.manage@gmail.com (unverified, no password)
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text,
  email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Insert test data
INSERT INTO users (email, password, email_verified) VALUES
  ('superadmin', 'administan', true),
  ('tfssteam@gmail.com', 'administan', true),
  ('tfss.manage@gmail.com', NULL, false)
ON CONFLICT (email) DO NOTHING;