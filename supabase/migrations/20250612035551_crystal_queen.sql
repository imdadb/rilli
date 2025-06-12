/*
  # Align Auth UUIDs and Enable RLS

  1. Database Changes
    - Align users.id with Supabase Auth UUIDs
    - Re-link role assignments to new UUIDs
    - Enable Row Level Security on users and role_user tables

  2. Security
    - Add RLS policies for authenticated access
    - Create can_grant() helper function for role management
    - Restrict role assignments based on permissions

  3. Test Users
    - imdadb@gmail.com → super_admin (c551678f-8682-4795-8231-8ac09d6b1c58)
    - tfssteam@gmail.com → CEO (42db8bd3-1e01-4529-89f9-b2569a3ee8e5)
    - tfss.manage@gmail.com → campus_director (504b81e7-d6f1-48fa-a06d-c61f15b246f2)
*/

-- Create mapping with actual Auth UUIDs
WITH mapping AS (
  SELECT * FROM (VALUES
    ('c551678f-8682-4795-8231-8ac09d6b1c58'::uuid, 'imdadb@gmail.com',     'super_admin'),
    ('42db8bd3-1e01-4529-89f9-b2569a3ee8e5'::uuid, 'tfssteam@gmail.com',   'CEO'),
    ('504b81e7-d6f1-48fa-a06d-c61f15b246f2'::uuid, 'tfss.manage@gmail.com','campus_director')
  ) AS m(id, email, role)
)

-- 1. Align users.id to Auth UUIDs (insert or update)
INSERT INTO users (id, email, password, name, user_type, status, email_verified, school_id)
SELECT
  m.id,
  m.email,
  '',                      -- keep blank; Auth handles hashing
  CASE m.role
       WHEN 'super_admin'      THEN 'System Super Admin'
       WHEN 'CEO'              THEN 'Test CEO'
       ELSE                        'Test Campus Dir'
  END,
  'staff',
  'active',
  true,
  CASE m.role
       WHEN 'super_admin'      THEN 'STAFF-0001'
       WHEN 'CEO'              THEN 'STAFF-0002'
       ELSE                        'STAFF-0003'
  END
FROM mapping m
ON CONFLICT (email) DO UPDATE SET 
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  school_id = EXCLUDED.school_id;

-- 2. Re-link role_user to the new IDs
WITH mapping AS (
  SELECT * FROM (VALUES
    ('c551678f-8682-4795-8231-8ac09d6b1c58'::uuid, 'imdadb@gmail.com',     'super_admin'),
    ('42db8bd3-1e01-4529-89f9-b2569a3ee8e5'::uuid, 'tfssteam@gmail.com',   'CEO'),
    ('504b81e7-d6f1-48fa-a06d-c61f15b246f2'::uuid, 'tfss.manage@gmail.com','campus_director')
  ) AS m(id, email, role)
)
DELETE FROM role_user
WHERE user_id IN (SELECT id FROM mapping);

WITH mapping AS (
  SELECT * FROM (VALUES
    ('c551678f-8682-4795-8231-8ac09d6b1c58'::uuid, 'imdadb@gmail.com',     'super_admin'),
    ('42db8bd3-1e01-4529-89f9-b2569a3ee8e5'::uuid, 'tfssteam@gmail.com',   'CEO'),
    ('504b81e7-d6f1-48fa-a06d-c61f15b246f2'::uuid, 'tfss.manage@gmail.com','campus_director')
  ) AS m(id, email, role)
)
INSERT INTO role_user (user_id, role_id)
SELECT
  m.id,
  r.id
FROM mapping m
JOIN roles r ON r.name = m.role
ON CONFLICT DO NOTHING;

-- 3. Enable RLS + helper + policies

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read user data
DROP POLICY IF EXISTS "logged_in_can_select_users" ON users;
CREATE POLICY "logged_in_can_select_users"
  ON users FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Enable RLS on role_user table
ALTER TABLE role_user ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current user can grant a specific role
CREATE OR REPLACE FUNCTION can_grant(target_role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM role_user ru
    JOIN roles r_grant ON r_grant.id = ru.role_id
    JOIN role_grant_matrix g ON g.granting_role = r_grant.name
    WHERE ru.user_id = auth.uid()
      AND g.grantable_role = target_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Allow role assignment only if user has permission to grant that role
DROP POLICY IF EXISTS "grant_role_if_allowed" ON role_user;
CREATE POLICY "grant_role_if_allowed"
  ON role_user FOR INSERT
  WITH CHECK (
    can_grant((SELECT name FROM roles WHERE id = role_user.role_id))
  );

-- Policy: Allow role revocation only if user has permission to grant that role
DROP POLICY IF EXISTS "revoke_role_if_allowed" ON role_user;
CREATE POLICY "revoke_role_if_allowed"
  ON role_user FOR DELETE
  USING (
    can_grant((SELECT name FROM roles WHERE id = role_user.role_id))
  );

-- Policy: Allow authenticated users to read role assignments
DROP POLICY IF EXISTS "logged_in_can_read_role_links" ON role_user;
CREATE POLICY "logged_in_can_read_role_links"
  ON role_user FOR SELECT
  USING (auth.uid() IS NOT NULL);