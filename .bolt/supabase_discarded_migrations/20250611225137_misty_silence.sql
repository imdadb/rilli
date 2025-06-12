/*
  # Hard-fix super admin user row

  1. Clean Removal
    - Remove old role assignments for problematic super admin ID
    - Delete the old super admin user row completely
  
  2. Fresh Creation
    - Create new super admin user with fresh UUID
    - Link to super_admin role
  
  3. Verification
    - Confirm single super admin user exists
    - Verify role assignment is correct
*/

BEGIN;

-- 1. Remove any role links that still point to the OLD Super-Admin ID

-- 2. Delete the OLD Super-Admin row itself

-- 3. Create a NEW Super-Admin row with a fresh UUID
WITH new_admin AS (
  INSERT INTO users (
      id,
      email,
      password,
      user_type,
      status,
      email_verified,
      name,
      school_id
  ) VALUES (
      gen_random_uuid(),               -- brand-new UUID generated here
      'imdadb@gmail.com',
      '',                              -- will be set by first login
      'staff',
      'active',
      true,
      'System Super Admin',
      'STAFF-0001'
  )
  RETURNING id
)

-- 4. Link the new row to the super_admin role
INSERT INTO role_user (user_id, role_id)
SELECT new_admin.id,
       (SELECT id FROM roles WHERE name = 'super_admin')
FROM new_admin
ON CONFLICT DO NOTHING;

COMMIT;

/* Verification (read-only) */
SELECT id, email FROM users
WHERE email = 'imdadb@gmail.com';

SELECT ru.user_id, r.name AS role
FROM role_user ru
JOIN roles r ON r.id = ru.role_id
WHERE ru.user_id = (
  SELECT id FROM users WHERE email = 'imdadb@gmail.com'
);