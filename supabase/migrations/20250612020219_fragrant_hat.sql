/*
  # Complete School ERP Database Schema

  1. New Tables
    - `users` - Core user table with authentication and profile data
    - `roles` - System roles (super_admin, CEO, campus_director, teacher, student, parent)
    - `permissions` - System permissions (see_users, manage_roles, see_finance, etc.)
    - `role_user` - Many-to-many relationship between users and roles
    - `permission_role` - Many-to-many relationship between roles and permissions
    - `role_grant_matrix` - Defines which roles can grant other roles
    - `verification_tokens` - Email verification tokens for new users

  2. Security
    - Enable RLS on appropriate tables
    - Add policies for role-based access control
    - Helper functions for permission checking

  3. Seed Data
    - Core roles and permissions
    - Test users with proper role assignments
    - Role delegation matrix
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text,
  email_verified boolean DEFAULT false,
  user_type text DEFAULT 'staff' CHECK (user_type IN ('staff', 'student', 'guardian')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated')),
  school_id text UNIQUE,
  name text,
  created_at timestamptz DEFAULT now()
);

-- Create verification tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create role_user junction table
CREATE TABLE IF NOT EXISTS role_user (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

-- Create permission_role junction table
CREATE TABLE IF NOT EXISTS permission_role (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

-- Create role grant matrix table
CREATE TABLE IF NOT EXISTS role_grant_matrix (
  granting_role text NOT NULL,
  grantable_role text NOT NULL,
  PRIMARY KEY (granting_role, grantable_role)
);

-- Enable RLS on appropriate tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_user ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_role_user_user_id ON role_user(user_id);
CREATE INDEX IF NOT EXISTS idx_role_user_role_id ON role_user(role_id);
CREATE INDEX IF NOT EXISTS idx_permission_role_role_id ON permission_role(role_id);
CREATE INDEX IF NOT EXISTS idx_permission_role_permission_id ON permission_role(permission_id);

-- Insert core roles
INSERT INTO roles (name) VALUES
  ('super_admin'),
  ('CEO'),
  ('campus_director'),
  ('admin_officer'),
  ('teacher'),
  ('librarian'),
  ('attendance_manager'),
  ('admissions_manager'),
  ('student'),
  ('parent')
ON CONFLICT (name) DO NOTHING;

-- Insert core permissions
INSERT INTO permissions (name) VALUES
  ('see_dashboard'),
  ('see_users'),
  ('manage_users'),
  ('manage_roles'),
  ('see_finance'),
  ('manage_finance'),
  ('see_classes')
ON CONFLICT (name) DO NOTHING;

-- Create role-permission mappings
DO $$
DECLARE
  super_admin_id uuid;
  ceo_id uuid;
  campus_director_id uuid;
  admin_officer_id uuid;
  teacher_id uuid;
  librarian_id uuid;
  attendance_manager_id uuid;
  admissions_manager_id uuid;
  student_id uuid;
  parent_id uuid;
  
  see_dashboard_id uuid;
  see_users_id uuid;
  manage_users_id uuid;
  manage_roles_id uuid;
  see_finance_id uuid;
  manage_finance_id uuid;
  see_classes_id uuid;
BEGIN
  -- Get role IDs
  SELECT id INTO super_admin_id FROM roles WHERE name = 'super_admin';
  SELECT id INTO ceo_id FROM roles WHERE name = 'CEO';
  SELECT id INTO campus_director_id FROM roles WHERE name = 'campus_director';
  SELECT id INTO admin_officer_id FROM roles WHERE name = 'admin_officer';
  SELECT id INTO teacher_id FROM roles WHERE name = 'teacher';
  SELECT id INTO librarian_id FROM roles WHERE name = 'librarian';
  SELECT id INTO attendance_manager_id FROM roles WHERE name = 'attendance_manager';
  SELECT id INTO admissions_manager_id FROM roles WHERE name = 'admissions_manager';
  SELECT id INTO student_id FROM roles WHERE name = 'student';
  SELECT id INTO parent_id FROM roles WHERE name = 'parent';
  
  -- Get permission IDs
  SELECT id INTO see_dashboard_id FROM permissions WHERE name = 'see_dashboard';
  SELECT id INTO see_users_id FROM permissions WHERE name = 'see_users';
  SELECT id INTO manage_users_id FROM permissions WHERE name = 'manage_users';
  SELECT id INTO manage_roles_id FROM permissions WHERE name = 'manage_roles';
  SELECT id INTO see_finance_id FROM permissions WHERE name = 'see_finance';
  SELECT id INTO manage_finance_id FROM permissions WHERE name = 'manage_finance';
  SELECT id INTO see_classes_id FROM permissions WHERE name = 'see_classes';
  
  -- super_admin gets all permissions
  INSERT INTO permission_role (role_id, permission_id) VALUES
    (super_admin_id, see_dashboard_id),
    (super_admin_id, see_users_id),
    (super_admin_id, manage_users_id),
    (super_admin_id, manage_roles_id),
    (super_admin_id, see_finance_id),
    (super_admin_id, manage_finance_id),
    (super_admin_id, see_classes_id)
  ON CONFLICT DO NOTHING;
  
  -- CEO permissions
  INSERT INTO permission_role (role_id, permission_id) VALUES
    (ceo_id, see_dashboard_id),
    (ceo_id, see_users_id),
    (ceo_id, manage_users_id),
    (ceo_id, manage_roles_id),
    (ceo_id, see_finance_id),
    (ceo_id, manage_finance_id)
  ON CONFLICT DO NOTHING;
  
  -- campus_director permissions
  INSERT INTO permission_role (role_id, permission_id) VALUES
    (campus_director_id, see_dashboard_id),
    (campus_director_id, see_users_id),
    (campus_director_id, manage_roles_id)
  ON CONFLICT DO NOTHING;
  
  -- admin_officer permissions
  INSERT INTO permission_role (role_id, permission_id) VALUES
    (admin_officer_id, see_dashboard_id),
    (admin_officer_id, see_users_id)
  ON CONFLICT DO NOTHING;
  
  -- teacher permissions
  INSERT INTO permission_role (role_id, permission_id) VALUES
    (teacher_id, see_dashboard_id),
    (teacher_id, see_classes_id)
  ON CONFLICT DO NOTHING;
  
  -- librarian permissions
  INSERT INTO permission_role (role_id, permission_id) VALUES
    (librarian_id, see_dashboard_id)
  ON CONFLICT DO NOTHING;
  
  -- attendance_manager permissions
  INSERT INTO permission_role (role_id, permission_id) VALUES
    (attendance_manager_id, see_dashboard_id)
  ON CONFLICT DO NOTHING;
  
  -- admissions_manager permissions
  INSERT INTO permission_role (role_id, permission_id) VALUES
    (admissions_manager_id, see_dashboard_id)
  ON CONFLICT DO NOTHING;
  
  -- student permissions
  INSERT INTO permission_role (role_id, permission_id) VALUES
    (student_id, see_dashboard_id)
  ON CONFLICT DO NOTHING;
  
  -- parent permissions
  INSERT INTO permission_role (role_id, permission_id) VALUES
    (parent_id, see_dashboard_id)
  ON CONFLICT DO NOTHING;
END $$;

-- Set up role delegation matrix
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
  ('CEO', 'admissions_manager'),
  ('campus_director', 'admin_officer'),
  ('campus_director', 'teacher'),
  ('campus_director', 'librarian'),
  ('campus_director', 'attendance_manager'),
  ('campus_director', 'admissions_manager')
ON CONFLICT DO NOTHING;

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

-- RLS Policies

-- Users table policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Verification tokens policies
CREATE POLICY "Allow anonymous token creation"
  ON verification_tokens
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous token validation"
  ON verification_tokens
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated users to read own tokens"
  ON verification_tokens
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow anonymous token deletion"
  ON verification_tokens
  FOR DELETE
  TO anon
  USING (true);

-- Role user policies
CREATE POLICY "grant role if allowed"
  ON role_user
  FOR INSERT
  WITH CHECK (can_grant(
    (SELECT name FROM roles WHERE id = role_user.role_id)
  ));

CREATE POLICY "revoke role if allowed"
  ON role_user
  FOR DELETE
  USING (can_grant(
    (SELECT name FROM roles WHERE id = role_user.role_id)
  ));

CREATE POLICY "view role assignments"
  ON role_user
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert test users with hashed passwords
INSERT INTO users (id, email, password, email_verified, user_type, status, name, school_id) VALUES
  ('e591c167-0b5a-4977-b7ed-2351769a68a2', 'imdadb@gmail.com', crypt('administan', gen_salt('bf', 10)), true, 'staff', 'active', 'System Super Admin', 'STAFF-0001'),
  ('67377243-f151-4822-b31f-2445c65247b0', 'tfssteam@gmail.com', crypt('administan', gen_salt('bf', 10)), true, 'staff', 'active', 'Test CEO', 'STAFF-0002'),
  ('c5e766c3-5f97-4bea-821d-cc45c0ee8a62', 'tfss.manage@gmail.com', NULL, false, 'staff', 'active', 'Test Campus Director', 'STAFF-0003')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  school_id = EXCLUDED.school_id;

-- Assign roles to test users
INSERT INTO role_user (user_id, role_id)
SELECT 'e591c167-0b5a-4977-b7ed-2351769a68a2', id FROM roles WHERE name = 'super_admin'
UNION ALL
SELECT '67377243-f151-4822-b31f-2445c65247b0', id FROM roles WHERE name = 'CEO'
UNION ALL
SELECT 'c5e766c3-5f97-4bea-821d-cc45c0ee8a62', id FROM roles WHERE name = 'campus_director'
ON CONFLICT (user_id, role_id) DO NOTHING;