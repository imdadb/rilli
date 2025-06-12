/*
  # Align Auth UUIDs and Enable RLS

  1. Database Changes
    - Align users.id with Supabase Auth UUIDs for existing test users
    - Re-link role_user assignments to new UUIDs
    - Enable Row Level Security on users and role_user tables
    - Create helper function for role granting permissions
    - Add RLS policies for secure access control

  2. Security
    - Enable RLS on users table with authenticated user access
    - Enable RLS on role_user table with permission-based access
    - Create can_grant() helper function for role management
    - Add policies for INSERT/DELETE role assignments based on permissions
    - Allow SELECT access for authenticated users

  3. Test Users
    - Super Admin: imdadb@gmail.com (STAFF-0001)
    - CEO: tfssteam@gmail.com (STAFF-0002) 
    - Campus Director: tfss.manage@gmail.com (STAFF-0003)

  IMPORTANT: Replace the placeholder UUIDs below with actual Auth UUIDs from Supabase Auth dashboard
*/

-- ▼▼ REPLACE these placeholder UUIDs with actual Auth UUIDs ▼▼
DO $$
DECLARE
  mapping_data RECORD;
BEGIN
  -- Create temporary mapping of Auth UUIDs to emails and roles
  FOR mapping_data IN
    SELECT * FROM (VALUES
      ('00000000-0000-0000-0000-000000000001'::uuid, 'imdadb@gmail.com',     'super_admin'),
      ('00000000-0000-0000-0000-000000000002'::uuid, 'tfssteam@gmail.com',   'CEO'),
      ('00000000-0000-0000-0000-000000000003'::uuid, 'tfss.manage@gmail.com','campus_director')
    ) AS m(auth_id, email, role_name)
  LOOP
    -- 1. Align users.id to Auth UUIDs (insert or update)
    INSERT INTO users (id, email, password, name, user_type, status, email_verified, school_id)
    VALUES (
      mapping_data.auth_id,
      mapping_data.email,
      '', -- keep blank; Auth handles authentication
      CASE mapping_data.role_name
        WHEN 'super_admin' THEN 'System Super Admin'
        WHEN 'CEO' THEN 'Test CEO'
        ELSE 'Test Campus Dir'
      END,
      'staff',
      'active',
      true,
      CASE mapping_data.role_name
        WHEN 'super_admin' THEN 'STAFF-0001'
        WHEN 'CEO' THEN 'STAFF-0002'
        ELSE 'STAFF-0003'
      END
    )
    ON CONFLICT (email) DO UPDATE SET 
      id = EXCLUDED.id,
      name = EXCLUDED.name,
      school_id = EXCLUDED.school_id;

    -- 2. Re-link role_user to the new IDs
    -- First, remove old role assignments for this user
    DELETE FROM role_user 
    WHERE user_id IN (
      SELECT id FROM users WHERE email = mapping_data.email
    );

    -- Then add the correct role assignment with new UUID
    INSERT INTO role_user (user_id, role_id)
    SELECT 
      mapping_data.auth_id,
      r.id
    FROM roles r 
    WHERE r.name = mapping_data.role_name
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 3. Enable RLS and create policies

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read user data
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
CREATE POLICY "grant_role_if_allowed"
  ON role_user FOR INSERT
  WITH CHECK (
    can_grant((SELECT name FROM roles WHERE id = role_user.role_id))
  );

-- Policy: Allow role revocation only if user has permission to grant that role  
CREATE POLICY "revoke_role_if_allowed"
  ON role_user FOR DELETE
  USING (
    can_grant((SELECT name FROM roles WHERE id = role_user.role_id))
  );

-- Policy: Allow authenticated users to read role assignments
CREATE POLICY "logged_in_can_read_role_links"
  ON role_user FOR SELECT
  USING (auth.uid() IS NOT NULL);