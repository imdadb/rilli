/*
  # Sync table IDs to Supabase Auth UUIDs

  1. User ID Updates
    - Update users table to use the new Auth UUIDs
    - Align email addresses to match Auth records
    - Super Admin: e591c167-0b5a-4977-b7ed-2351769a68a2 (imdadb@gmail.com)
    - CEO: 67377243-f151-4822-b31f-2445c65247b0 (tfssadmin@gmail.com)
    - Campus Director: c5e766c3-5f97-4bea-821d-cc45c0ee8a62 (tfss.manage@gmail.com)

  2. Role User Links
    - Clean up old role_user entries
    - Re-insert correct role assignments with new UUIDs

  3. Data Integrity
    - Use ON CONFLICT DO NOTHING to prevent duplicate entries
    - Maintain referential integrity
*/

-- 1. Align users table with Auth UUIDs
-- Super Admin (note: original row might still have email "superadmin")
UPDATE users
SET id = 'e591c167-0b5a-4977-b7ed-2351769a68a2',
    email = 'imdadb@gmail.com',
    name = 'System Super Admin',
    school_id = 'STAFF-0001'
WHERE email IN ('superadmin', 'imdadb@gmail.com');

-- CEO
UPDATE users
SET id = '67377243-f151-4822-b31f-2445c65247b0',
    email = 'tfssadmin@gmail.com',
    name = 'Test CEO',
    school_id = 'STAFF-0002'
WHERE email IN ('tfssteam@gmail.com', 'tfssadmin@gmail.com');

-- Campus Director
UPDATE users
SET id = 'c5e766c3-5f97-4bea-821d-cc45c0ee8a62'
WHERE email = 'tfss.manage@gmail.com';

-- 2. Refresh role_user links
-- Remove any old links that might still use outdated user_ids
DELETE FROM role_user
WHERE user_id NOT IN (
    'e591c167-0b5a-4977-b7ed-2351769a68a2',
    '67377243-f151-4822-b31f-2445c65247b0',
    'c5e766c3-5f97-4bea-821d-cc45c0ee8a62'
)
AND user_id IN (
    SELECT id FROM users
    WHERE email IN ('imdadb@gmail.com', 'tfssadmin@gmail.com', 'tfss.manage@gmail.com')
);

-- Re-insert correct role assignments (skip if they already exist)
INSERT INTO role_user (user_id, role_id)
SELECT 'e591c167-0b5a-4977-b7ed-2351769a68a2', id 
FROM roles 
WHERE name = 'super_admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO role_user (user_id, role_id)
SELECT '67377243-f151-4822-b31f-2445c65247b0', id 
FROM roles 
WHERE name = 'CEO'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO role_user (user_id, role_id)
SELECT 'c5e766c3-5f97-4bea-821d-cc45c0ee8a62', id 
FROM roles 
WHERE name = 'campus_director'
ON CONFLICT (user_id, role_id) DO NOTHING;