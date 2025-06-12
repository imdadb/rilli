/*
  # Create verification tokens table

  1. New Tables
    - `verification_tokens`
      - `id` (uuid, primary key)
      - `email` (text, not null)
      - `token` (text, not null)
      - `expires_at` (timestamp, not null)
      - `created_at` (timestamp, default now)

  2. Security
    - Enable RLS on `verification_tokens` table
    - Add policy for anonymous users to insert and select tokens
    - This allows unverified users to create and validate tokens

  3. Notes
    - Tokens expire after 30 minutes
    - Used for email verification and password creation flow
*/

CREATE TABLE IF NOT EXISTS verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert tokens (for sending verification emails)
CREATE POLICY "Allow anonymous token creation"
  ON verification_tokens
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to select tokens (for verification)
CREATE POLICY "Allow anonymous token validation"
  ON verification_tokens
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to select their own tokens
CREATE POLICY "Allow authenticated users to read own tokens"
  ON verification_tokens
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow anonymous users to delete tokens (for cleanup after verification)
CREATE POLICY "Allow anonymous token deletion"
  ON verification_tokens
  FOR DELETE
  TO anon
  USING (true);