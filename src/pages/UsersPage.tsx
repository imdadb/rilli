import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Container,
  FormControlLabel,
} from '@mui/material';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Role {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  school_id: string | null;
  user_type: string;
  status: string;
  role_user: { role_id: string }[];
}

interface RoleAssignment {
  [userId: string]: {
    [roleId: string]: boolean;
  };
}

function UsersPage() {
  const [tabValue, setTabValue] = useState(0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [grantableRoles, setGrantableRoles] = useState<string[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [guardians, setGuardians] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment>({});
  const [originalAssignments, setOriginalAssignments] = useState<RoleAssignment>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { roles: myRoles } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('id, name')
        .order('name');

      if (rolesError) throw rolesError;

      // Fetch grantable roles based on current user's primary role
      const primaryRole = myRoles[0]; // Use first role as primary
      const { data: grantableData, error: grantableError } = await supabase
        .from('role_grant_matrix')
        .select('grantable_role')
        .eq('granting_role', primaryRole);

      if (grantableError) throw grantableError;

      const grantableRoleNames = grantableData?.map(g => g.grantable_role) || [];

      // Fetch users by type with their current roles
      const { data: staffData, error: staffError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          school_id,
          user_type,
          status,
          role_user (
            role_id
          )
        `)
        .eq('user_type', 'staff')
        .order('email');

      if (staffError) throw staffError;

      const { data: guardiansData, error: guardiansError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          school_id,
          user_type,
          status,
          role_user (
            role_id
          )
        `)
        .eq('user_type', 'guardian')
        .order('email');

      if (guardiansError) throw guardiansError;

      const { data: studentsData, error: studentsError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          school_id,
          user_type,
          status,
          role_user (
            role_id
          )
        `)
        .eq('user_type', 'student')
        .order('email');

      if (studentsError) throw studentsError;

      setRoles(rolesData || []);
      setGrantableRoles(grantableRoleNames);
      setStaff(staffData || []);
      setGuardians(guardiansData || []);
      setStudents(studentsData || []);

      // Build role assignments object for staff only
      const assignments: RoleAssignment = {};
      (staffData || []).forEach((user) => {
        assignments[user.id] = {};
        (rolesData || []).forEach((role) => {
          assignments[user.id][role.id] = user.role_user.some(
            (ru) => ru.role_id === role.id
          );
        });
      });

      setRoleAssignments(assignments);
      setOriginalAssignments(JSON.parse(JSON.stringify(assignments)));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (userId: string, roleId: string) => {
    setRoleAssignments((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [roleId]: !prev[userId][roleId],
      },
    }));
  };

  const hasChanges = () => {
    return JSON.stringify(roleAssignments) !== JSON.stringify(originalAssignments);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const operations: Promise<any>[] = [];

      // Compare current assignments with original to determine what to add/remove
      Object.keys(roleAssignments).forEach((userId) => {
        Object.keys(roleAssignments[userId]).forEach((roleId) => {
          const currentlyAssigned = roleAssignments[userId][roleId];
          const originallyAssigned = originalAssignments[userId][roleId];

          if (currentlyAssigned && !originallyAssigned) {
            // Add role
            operations.push(
              supabase.from('role_user').insert({
                user_id: userId,
                role_id: roleId,
              })
            );
          } else if (!currentlyAssigned && originallyAssigned) {
            // Remove role
            operations.push(
              supabase
                .from('role_user')
                .delete()
                .eq('user_id', userId)
                .eq('role_id', roleId)
            );
          }
        });
      });

      if (operations.length > 0) {
        const results = await Promise.all(operations);
        
        // Check for errors
        const errors = results.filter((result) => result.error);
        if (errors.length > 0) {
          throw new Error(`Failed to update some role assignments: ${errors.map(e => e.error.message).join(', ')}`);
        }

        // Update original assignments to match current
        setOriginalAssignments(JSON.parse(JSON.stringify(roleAssignments)));

        setSnackbar({
          open: true,
          message: 'Roles updated successfully!',
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: 'No changes to save.',
          severity: 'success',
        });
      }
    } catch (err) {
      console.error('Error saving roles:', err);
      setError('Failed to save role changes. Please try again.');
      setSnackbar({
        open: true,
        message: 'Failed to save role changes.',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setRoleAssignments(JSON.parse(JSON.stringify(originalAssignments)));
  };

  const renderUserTable = (users: User[], showRoleCheckboxes: boolean = false) => (
    <TableContainer component={Paper} elevation={2}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Email</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Name</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">School ID</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">Status</Typography></TableCell>
            {showRoleCheckboxes && roles.filter(role => grantableRoles.includes(role.name)).map((role) => (
              <TableCell key={role.id} align="center">
                <Typography variant="subtitle2" fontWeight="bold">
                  {role.name.replace('_', ' ').toUpperCase()}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} hover>
              <TableCell><Typography variant="body2">{user.email}</Typography></TableCell>
              <TableCell><Typography variant="body2">{user.name || '-'}</Typography></TableCell>
              <TableCell><Typography variant="body2">{user.school_id || '-'}</Typography></TableCell>
              <TableCell><Typography variant="body2">{user.status}</Typography></TableCell>
              {showRoleCheckboxes && roles.filter(role => grantableRoles.includes(role.name)).map((role) => (
                <TableCell key={role.id} align="center">
                  <Checkbox
                    checked={roleAssignments[user.id]?.[role.id] || false}
                    onChange={() => handleRoleToggle(user.id, role.id)}
                    disabled={saving}
                    color="primary"
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {users.length === 0 && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No users found in this category.
          </Typography>
        </Box>
      )}
    </TableContainer>
  );

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Users Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage users across different categories. Staff roles can be modified based on your permissions.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper elevation={1} sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="fullWidth"
          >
            <Tab label={`Staff (${staff.length})`} />
            <Tab label={`Guardians (${guardians.length})`} />
            <Tab label={`Students (${students.length})`} />
          </Tabs>
        </Paper>

        {tabValue === 0 && (
          <>
            {renderUserTable(staff, true)}
            {hasChanges() && (
              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  disabled={saving}
                >
                  Reset Changes
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} /> : null}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            )}
          </>
        )}

        {tabValue === 1 && renderUserTable(guardians)}
        {tabValue === 2 && renderUserTable(students)}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}

export default UsersPage;