/*
  # Add manage_roles permission

  1. New Permission
    - Add `manage_roles` permission to permissions table
  
  2. Permission Assignments
    - Assign manage_roles to super_admin, CEO, and campus_director roles
  
  3. Security
    - Uses existing RLS policies
*/

-- Add the manage_roles permission
INSERT INTO permissions (name) VALUES ('manage_roles')
ON CONFLICT (name) DO NOTHING;

-- Assign manage_roles permission to super_admin, CEO, and campus_director roles
INSERT INTO permission_role (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('super_admin', 'CEO', 'campus_director')
  AND p.name = 'manage_roles'
ON CONFLICT (role_id, permission_id) DO NOTHING;