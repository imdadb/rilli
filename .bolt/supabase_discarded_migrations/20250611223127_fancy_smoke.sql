/*
  # Safe Auth UUID Swap Migration

  This migration safely swaps old user IDs for new Supabase Auth UUIDs by:
  1. Creating new user rows with Auth UUIDs
  2. Re-pointing role_user relationships
  3. Cleaning up old user rows
  
  Uses a transaction to ensure data integrity.
*/

BEGIN;

-- ---------- CEO ----------
INSERT INTO users (id, email, password, email_verified, user_type, status, name, school_id)
SELECT '67377243-f151-4822-b31f-2445c65247b0',
       'tfssadmin@gmail.com',
       password,
       email_verified,
       user_type,
       status,
       name,
       school_id
FROM users
WHERE email IN ('tfssteam@gmail.com','tfssadmin@gmail.com')
LIMIT 1
ON CONFLICT (id) DO NOTHING;

UPDATE role_user
SET user_id = '67377243-f151-4822-b31f-2445c65247b0'
WHERE user_id IN (
  SELECT id FROM users WHERE email IN ('tfssteam@gmail.com','tfssadmin@gmail.com')
)
AND user_id <> '67377243-f151-4822-b31f-2445c65247b0';

DELETE FROM users
WHERE email IN ('tfssteam@gmail.com','tfssadmin@gmail.com')
  AND id <> '67377243-f151-4822-b31f-2445c65247b0';

-- ---------- CAMPUS DIRECTOR ----------
INSERT INTO users (id, email, password, email_verified, user_type, status, name, school_id)
SELECT 'c5e766c3-5f97-4bea-821d-cc45c0ee8a62',
       'tfss.manage@gmail.com',
       password,
       email_verified,
       user_type,
       status,
       name,
       school_id
FROM users
WHERE email = 'tfss.manage@gmail.com'
LIMIT 1
ON CONFLICT (id) DO NOTHING;

UPDATE role_user
SET user_id = 'c5e766c3-5f97-4bea-821d-cc45c0ee8a62'
WHERE user_id <> 'c5e766c3-5f97-4bea-821d-cc45c0ee8a62'
  AND user_id IN (
    SELECT id FROM users WHERE email = 'tfss.manage@gmail.com'
  );

DELETE FROM users
WHERE email = 'tfss.manage@gmail.com'
  AND id <> 'c5e766c3-5f97-4bea-821d-cc45c0ee8a62';

COMMIT;

-- Verify (read-only)
SELECT id, email FROM users
WHERE email IN ('tfssadmin@gmail.com','tfss.manage@gmail.com');

SELECT user_id, role_id FROM role_user
WHERE user_id IN (
  '67377243-f151-4822-b31f-2445c65247b0',
  'c5e766c3-5f97-4bea-821d-cc45c0ee8a62'
);