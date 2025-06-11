/*
  # Phase 11-C: Users extra columns + Delegation matrix

  1. New Columns
    - Add `school_id` (text, unique) and `name` (text) to users table
  
  2. New Tables
    - `role_grant_matrix` - defines which roles can grant other roles
  
  3. Security
    - Enable RLS on `role_user` table
    - Add helper function `can_grant()` to check delegation permissions
    - Add policies for INSERT and DELETE on role_user based on delegation rules
  
  4. Data Updates
    - Populate name and school_id for existing test users
*/

-- Add new columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS school_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS name text;

-- Create delegation matrix table
CREATE TABLE IF NOT EXISTS role_grant_matrix (
  granting_role text NOT NULL,
  grantable_role text NOT NULL,
  PRIMARY KEY (granting_role, grantable_role)
);

-- Seed delegation rules (initial scope)
INSERT INTO role_grant_matrix (granting_role, grantable_role) VALUES
  ('super_admin', 'CEO'),
  ('super_admin', 'campus_director'),
  ('super_admin', 'admin_officer'),
  ('super_admin', 'teacher'),
  ('super_admin', 'librarian'),
  ('super_admin', 'attendance_manager'),
  ('super_admin', 'admissions_manager'),
  ('CEO', 'campus_director'),
  ('CEO', 'admin_officer'),
  ('CEO', 'teacher'),
  ('CEO', 'librarian'),
  ('CEO', 'attendance_manager'),
  ('CEO', 'admissions_manager')
ON CONFLICT (granting_role, grantable_role) DO NOTHING;

-- Enable row-level security on role_user
ALTER TABLE role_user ENABLE ROW LEVEL SECURITY;

-- Helper function: can the current user grant role X?
CREATE OR REPLACE FUNCTION can_grant(target_role text)
RETURNS boolean AS $$
DECLARE
  my_roles text[];
BEGIN
  -- Get current user's roles
  SELECT array_agg(r.name) INTO my_roles
  FROM roles r
  JOIN role_user ru ON ru.role_id = r.id
  JOIN users u ON u.id = ru.user_id
  WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email';

  -- Check if any of my roles can grant the target role
  RETURN EXISTS (
    SELECT 1 FROM role_grant_matrix
    WHERE granting_role = ANY(my_roles)
      AND grantable_role = target_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy for adding roles
CREATE POLICY "grant role if allowed"
ON role_user FOR INSERT
WITH CHECK (can_grant(
  (SELECT name FROM roles WHERE id = role_user.role_id)
));

-- Policy for removing roles
CREATE POLICY "revoke role if allowed"
ON role_user FOR DELETE
USING (can_grant(
  (SELECT name FROM roles WHERE id = role_user.role_id)
));

-- Policy for reading role assignments (allow authenticated users to see all)
CREATE POLICY "view role assignments"
ON role_user FOR SELECT
TO authenticated
USING (true);

-- Update existing users with name and school_id
UPDATE users
SET name = CASE email
  WHEN 'superadmin' THEN 'System Super Admin'
  WHEN 'tfssteam@gmail.com' THEN 'Test CEO'
  WHEN 'tfss.manage@gmail.com' THEN 'Test Campus Director'
  ELSE email -- fallback to email if no specific name
END,
school_id = CASE email
  WHEN 'superadmin' THEN 'STAFF-0001'
  WHEN 'tfssteam@gmail.com' THEN 'STAFF-0002'
  WHEN 'tfss.manage@gmail.com' THEN 'STAFF-0003'
  ELSE NULL
END
WHERE email IN ('superadmin', 'tfssteam@gmail.com', 'tfss.manage@gmail.com');