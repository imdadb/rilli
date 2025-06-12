/*
  # Hash existing plain text passwords

  This migration updates any remaining plain text passwords to bcrypt hashes.
  This is a one-time operation to secure existing test accounts.

  1. Security Update
    - Convert plain text "administan" passwords to bcrypt hashes
    - Uses Supabase's built-in crypt function with bcrypt algorithm
    - Only affects users with plain text passwords

  Note: This requires the pgcrypto extension to be enabled in Supabase.
*/

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update plain text passwords to bcrypt hashes
-- This will only affect rows where password is exactly 'administan'
UPDATE users 
SET password = crypt('administan', gen_salt('bf', 10))
WHERE password = 'administan';