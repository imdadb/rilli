/*
  # Database Cleanup & Realignment to New Core Users

  1. Clear volatile link tables
  2. Ensure core users exist with final UUIDs
  3. Map roles to those users
  4. Seed permission_role (initial minimal set)
  5. Delegation matrix (who may grant which staff roles)
*/

BEGIN;

-- 1. Clear volatile link tables
DELETE FROM role_user;
DELETE FROM permission_role;
DELETE FROM role_grant_matrix;

-- 2. Ensure core users exist with final UUIDs
INSERT INTO users (id, email, password, user_type, status, email_verified, name, school_id)
VALUES
  ('f830afa5-dbac-4db0-9d93-dc67dfd1f9db','imdadb@gmail.com','', 'staff','active', true,'System Super Admin','STAFF-0001'),
  ('685fa97c-9fc4-474d-ace6-c57a309e3a8d','tfssteam@gmail.com','', 'staff','active', true,'Test CEO','STAFF-0002'),
  ('f76688ec-d633-4b56-af06-a5f7cb42179c','tfss.manage@gmail.com','', 'staff','active', true,'Test Campus Director','STAFF-0003')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;  -- idempotent

-- 3. Map roles to those users
INSERT INTO role_user (user_id, role_id)
SELECT u.id, r.id FROM users u
JOIN roles r ON r.name = 'super_admin'
WHERE u.email = 'imdadb@gmail.com'
UNION ALL
SELECT u.id, r.id FROM users u
JOIN roles r ON r.name = 'CEO'
WHERE u.email = 'tfssteam@gmail.com'
UNION ALL
SELECT u.id, r.id FROM users u
JOIN roles r ON r.name = 'campus_director'
WHERE u.email = 'tfss.manage@gmail.com';

-- 4. Seed permission_role (initial minimal set)
WITH rp AS (
  SELECT id,name FROM roles
), pp AS (
  SELECT id,name FROM permissions
)
INSERT INTO permission_role (role_id, permission_id)
-- super_admin → all permissions
SELECT rp.id, pp.id FROM rp, pp WHERE rp.name = 'super_admin'
UNION ALL
-- CEO
SELECT rp.id, pp.id FROM rp JOIN pp ON pp.name IN ('see_dashboard','see_users','manage_users','see_finance','manage_finance','manage_roles') WHERE rp.name = 'CEO'
UNION ALL
-- campus_director
SELECT rp.id, pp.id FROM rp JOIN pp ON pp.name IN ('see_dashboard','see_users','manage_roles') WHERE rp.name = 'campus_director'
UNION ALL
-- teacher
SELECT rp.id, pp.id FROM rp JOIN pp ON pp.name = 'see_dashboard' WHERE rp.name = 'teacher'
UNION ALL
SELECT rp.id, pp.id FROM rp JOIN pp ON pp.name = 'see_classes'  WHERE rp.name = 'teacher'
UNION ALL
-- student & parent
SELECT rp.id, pp.id FROM rp JOIN pp ON pp.name = 'see_dashboard' WHERE rp.name IN ('student','parent')
ON CONFLICT DO NOTHING;

-- 5. Delegation matrix (who may grant which staff roles)
INSERT INTO role_grant_matrix (granting_role, grantable_role) VALUES
  ('super_admin','CEO'),
  ('super_admin','campus_director'),
  ('super_admin','admin_officer'),
  ('super_admin','teacher'),
  ('super_admin','librarian'),
  ('super_admin','attendance_manager'),
  ('super_admin','admissions_manager'),
  ('CEO','campus_director'),
  ('CEO','admin_officer'),
  ('CEO','teacher'),
  ('CEO','librarian'),
  ('CEO','attendance_manager'),
  ('CEO','admissions_manager');

COMMIT;

-- Verification queries (read-only)
SELECT id,email FROM users WHERE email IN ('imdadb@gmail.com','tfssteam@gmail.com','tfss.manage@gmail.com');
SELECT * FROM role_user;
SELECT * FROM role_grant_matrix;