/*
  # Roles and Permissions System

  1. New Tables
    - `roles`
      - `id` (uuid, primary key)
      - `name` (text, unique) - role names like super_admin, CEO, etc.
    - `permissions`
      - `id` (uuid, primary key)  
      - `name` (text, unique) - permission names like see_users, manage_finance
    - `role_user`
      - `user_id` (uuid, foreign key to users.id)
      - `role_id` (uuid, foreign key to roles.id)
    - `permission_role`
      - `role_id` (uuid, foreign key to roles.id)
      - `permission_id` (uuid, foreign key to permissions.id)

  2. Seed Data
    - 6 roles: super_admin, CEO, campus_director, teacher, student, parent
    - 6 permissions: see_dashboard, see_users, manage_users, see_finance, manage_finance, see_classes
    - Role-permission mappings as specified
    - User-role assignments for existing test users

  3. Security
    - RLS disabled for now (will be tightened later)
    - Foreign key constraints for data integrity
*/

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

-- Insert roles
INSERT INTO roles (name) VALUES
  ('super_admin'),
  ('CEO'),
  ('campus_director'),
  ('teacher'),
  ('student'),
  ('parent')
ON CONFLICT (name) DO NOTHING;

-- Insert permissions
INSERT INTO permissions (name) VALUES
  ('see_dashboard'),
  ('see_users'),
  ('manage_users'),
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
  teacher_id uuid;
  student_id uuid;
  parent_id uuid;
  
  see_dashboard_id uuid;
  see_users_id uuid;
  manage_users_id uuid;
  see_finance_id uuid;
  manage_finance_id uuid;
  see_classes_id uuid;
BEGIN
  -- Get role IDs
  SELECT id INTO super_admin_id FROM roles WHERE name = 'super_admin';
  SELECT id INTO ceo_id FROM roles WHERE name = 'CEO';
  SELECT id INTO campus_director_id FROM roles WHERE name = 'campus_director';
  SELECT id INTO teacher_id FROM roles WHERE name = 'teacher';
  SELECT id INTO student_id FROM roles WHERE name = 'student';
  SELECT id INTO parent_id FROM roles WHERE name = 'parent';
  
  -- Get permission IDs
  SELECT id INTO see_dashboard_id FROM permissions WHERE name = 'see_dashboard';
  SELECT id INTO see_users_id FROM permissions WHERE name = 'see_users';
  SELECT id INTO manage_users_id FROM permissions WHERE name = 'manage_users';
  SELECT id INTO see_finance_id FROM permissions WHERE name = 'see_finance';
  SELECT id INTO manage_finance_id FROM permissions WHERE name = 'manage_finance';
  SELECT id INTO see_classes_id FROM permissions WHERE name = 'see_classes';
  
  -- super_admin gets all permissions
  INSERT INTO permission_role (role_id, permission_id) VALUES
    (super_admin_id, see_dashboard_id),
    (super_admin_id, see_users_id),
    (super_admin_id, manage_users_id),
    (super_admin_id, see_finance_id),
    (super_admin_id, manage_finance_id),
    (super_admin_id, see_classes_id)
  ON CONFLICT DO NOTHING;
  
  -- CEO permissions
  INSERT INTO permission_role (role_id, permission_id) VALUES
    (ceo_id, see_dashboard_id),
    (ceo_id, see_users_id),
    (ceo_id, manage_users_id),
    (ceo_id, see_finance_id),
    (ceo_id, manage_finance_id)
  ON CONFLICT DO NOTHING;
  
  -- campus_director permissions
  INSERT INTO permission_role (role_id, permission_id) VALUES
    (campus_director_id, see_dashboard_id),
    (campus_director_id, see_users_id)
  ON CONFLICT DO NOTHING;
  
  -- teacher permissions
  INSERT INTO permission_role (role_id, permission_id) VALUES
    (teacher_id, see_dashboard_id),
    (teacher_id, see_classes_id)
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

-- Assign roles to existing test users
DO $$
DECLARE
  super_admin_role_id uuid;
  ceo_role_id uuid;
  campus_director_role_id uuid;
  
  superadmin_user_id uuid;
  tfssteam_user_id uuid;
  tfssmanage_user_id uuid;
BEGIN
  -- Get role IDs
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'super_admin';
  SELECT id INTO ceo_role_id FROM roles WHERE name = 'CEO';
  SELECT id INTO campus_director_role_id FROM roles WHERE name = 'campus_director';
  
  -- Get user IDs (handle case where users might not exist yet)
  SELECT id INTO superadmin_user_id FROM users WHERE email = 'superadmin' LIMIT 1;
  SELECT id INTO tfssteam_user_id FROM users WHERE email = 'tfssteam@gmail.com' LIMIT 1;
  SELECT id INTO tfssmanage_user_id FROM users WHERE email = 'tfss.manage@gmail.com' LIMIT 1;
  
  -- Assign roles to users (only if users exist)
  IF superadmin_user_id IS NOT NULL THEN
    INSERT INTO role_user (user_id, role_id) VALUES
      (superadmin_user_id, super_admin_role_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF tfssteam_user_id IS NOT NULL THEN
    INSERT INTO role_user (user_id, role_id) VALUES
      (tfssteam_user_id, ceo_role_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF tfssmanage_user_id IS NOT NULL THEN
    INSERT INTO role_user (user_id, role_id) VALUES
      (tfssmanage_user_id, campus_director_role_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_role_user_user_id ON role_user(user_id);
CREATE INDEX IF NOT EXISTS idx_role_user_role_id ON role_user(role_id);
CREATE INDEX IF NOT EXISTS idx_permission_role_role_id ON permission_role(role_id);
CREATE INDEX IF NOT EXISTS idx_permission_role_permission_id ON permission_role(permission_id);