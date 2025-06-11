/*
  # Fix Foreign Key Error & Reset Role Assignments

  1. Database Reset
    - Clear role_user table to remove any stale foreign key references
    - Re-insert clean role assignments using current user IDs
    
  2. Verification
    - Confirm all role assignments point to valid user records
*/

BEGIN;

-- 1. Empty role_user (keeps users untouched)
DELETE FROM role_user;

-- 2. Re-insert clean links pointing at the CURRENT ids in users
INSERT INTO role_user (user_id, role_id)
SELECT id, (SELECT id FROM roles WHERE name='super_admin')
FROM users WHERE email='imdadb@gmail.com'
UNION ALL
SELECT id, (SELECT id FROM roles WHERE name='CEO')
FROM users WHERE email='tfssteam@gmail.com'
UNION ALL
SELECT id, (SELECT id FROM roles WHERE name='campus_director')
FROM users WHERE email='tfss.manage@gmail.com';

COMMIT;

-- Sanity check (read-only)
SELECT ru.user_id, u.email, r.name AS role
FROM role_user ru
JOIN users u ON u.id = ru.user_id
JOIN roles r ON r.id = ru.role_id;