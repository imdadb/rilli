import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Container,
  FormControlLabel,
  Checkbox,
  Link,
  Stack,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRowsProp,
  GridToolbar,
  GridActionsCellItem,
  GridRowId,
  GridRowModel,
} from '@mui/x-data-grid';
import { Save as SaveIcon, Search as SearchIcon } from '@mui/icons-material';
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
  user_type: 'staff' | 'guardian' | 'student';
  status: 'active' | 'suspended' | 'terminated';
  role_user: { role_id: string }[];
  roles?: string[]; // Computed field for DataGrid
  originalRoles?: string[]; // Track original state for dirty detection
  isDirty?: boolean;
}

interface RoleAssignment {
  [userId: string]: {
    [roleId: string]: boolean;
  };
}

type UserType = 'staff' | 'guardian' | 'student';
type StatusFilter = 'all' | 'active' | 'suspended';

function UsersPage() {
  // State management
  const [activeTab, setActiveTab] = useState<number>(() => {
    const saved = localStorage.getItem('usersActiveTab');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  const [roles, setRoles] = useState<Role[]>([]);
  const [grantableRoles, setGrantableRoles] = useState<string[]>([]);
  const [users, setUsers] = useState<{
    staff: User[];
    guardian: User[];
    student: User[];
  }>({
    staff: [],
    guardian: [],
    student: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Set<string>>(new Set());
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

  const { roles: myRoles, can } = useAuth();
  const canManageRoles = can('manage_roles');

  // Tab configuration
  const tabs = [
    { label: 'Staff', type: 'staff' as UserType },
    { label: 'Guardians', type: 'guardian' as UserType },
    { label: 'Students', type: 'student' as UserType },
  ];

  // Persist active tab
  useEffect(() => {
    localStorage.setItem('usersActiveTab', activeTab.toString());
  }, [activeTab]);

  // Fetch data on mount
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
      const primaryRole = myRoles[0];
      const { data: grantableData, error: grantableError } = await supabase
        .from('role_grant_matrix')
        .select('grantable_role')
        .eq('granting_role', primaryRole);

      if (grantableError) throw grantableError;

      const grantableRoleNames =
        grantableData?.map((g) => g.grantable_role) || [];

      // Fetch users by type with their current roles
      const userTypes: UserType[] = ['staff', 'guardian', 'student'];
      const usersByType: { [key in UserType]: User[] } = {
        staff: [],
        guardian: [],
        student: [],
      };

      for (const userType of userTypes) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(
            `
            id,
            email,
            name,
            school_id,
            user_type,
            status,
            role_user (
              role_id
            )
          `,
          )
          .eq('user_type', userType)
          .order('email');

        if (userError) throw userError;

        // Process users and add computed fields
        const processedUsers = (userData || []).map((user: any) => {
          const userRoles = user.role_user?.map((ru: any) => ru.role_id) || [];
          const roleNames = userRoles
            .map(
              (roleId: string) => rolesData?.find((r) => r.id === roleId)?.name,
            )
            .filter(Boolean);

          return {
            ...user,
            roles: roleNames,
            originalRoles: [...roleNames],
            isDirty: false,
          };
        });

        usersByType[userType] = processedUsers;
      }

      setRoles(rolesData || []);
      setGrantableRoles(grantableRoleNames);
      setUsers(usersByType);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search and status
  const filteredUsers = useMemo(() => {
    const currentUsers = users[tabs[activeTab].type];

    return currentUsers.filter((user) => {
      // Status filter
      if (statusFilter === 'active' && user.status !== 'active') return false;
      if (statusFilter === 'suspended' && user.status !== 'suspended')
        return false;
      // Hide terminated users by default unless "all" is selected
      if (statusFilter !== 'all' && user.status === 'terminated') return false;

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          user.school_id?.toLowerCase().includes(searchLower) ||
          user.name?.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [users, activeTab, searchTerm, statusFilter, tabs]);

  // Handle role toggle for staff users
  const handleRoleToggle = (userId: string, roleName: string) => {
    if (!canManageRoles || tabs[activeTab].type !== 'staff') return;

    setUsers((prev) => ({
      ...prev,
      staff: prev.staff.map((user) => {
        if (user.id !== userId) return user;

        const currentRoles = user.roles || [];
        const newRoles = currentRoles.includes(roleName)
          ? currentRoles.filter((r) => r !== roleName)
          : [...currentRoles, roleName];

        const isDirty =
          JSON.stringify(newRoles.sort()) !==
          JSON.stringify((user.originalRoles || []).sort());

        return {
          ...user,
          roles: newRoles,
          isDirty,
        };
      }),
    }));
  };

  // Save role changes for a user
  const handleSaveRoles = async (userId: string) => {
    const user = users.staff.find((u) => u.id === userId);
    if (!user || !user.isDirty) return;

    setSaving((prev) => new Set([...prev, userId]));
    setError(null);

    try {
      const currentRoles = user.roles || [];
      const originalRoles = user.originalRoles || [];

      // Calculate roles to add and remove
      const rolesToAdd = currentRoles.filter((r) => !originalRoles.includes(r));
      const rolesToRemove = originalRoles.filter(
        (r) => !currentRoles.includes(r),
      );

      const operations: Promise<any>[] = [];

      // Add new roles
      for (const roleName of rolesToAdd) {
        const role = roles.find((r) => r.name === roleName);
        if (role) {
          operations.push(
            supabase.from('role_user').insert({
              user_id: userId,
              role_id: role.id,
            }),
          );
        }
      }

      // Remove old roles
      for (const roleName of rolesToRemove) {
        const role = roles.find((r) => r.name === roleName);
        if (role) {
          operations.push(
            supabase
              .from('role_user')
              .delete()
              .eq('user_id', userId)
              .eq('role_id', role.id),
          );
        }
      }

      if (operations.length > 0) {
        const results = await Promise.all(operations);

        // Check for errors
        const errors = results.filter((result) => result.error);
        if (errors.length > 0) {
          throw new Error(
            `Failed to update roles: ${errors.map((e) => e.error.message).join(', ')}`,
          );
        }

        // Update user state to reflect saved changes
        setUsers((prev) => ({
          ...prev,
          staff: prev.staff.map((u) => {
            if (u.id !== userId) return u;
            return {
              ...u,
              originalRoles: [...(u.roles || [])],
              isDirty: false,
            };
          }),
        }));

        setSnackbar({
          open: true,
          message: 'Roles updated successfully!',
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
      setSaving((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Status chip color mapping
  const getStatusChipProps = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'success' as const, label: 'Active' };
      case 'suspended':
        return { color: 'warning' as const, label: 'Suspended' };
      case 'terminated':
        return { color: 'error' as const, label: 'Terminated' };
      default:
        return { color: 'default' as const, label: status };
    }
  };

  // DataGrid columns configuration
  const getColumns = (): GridColDef[] => {
    const baseColumns: GridColDef[] = [
      {
        field: 'school_id',
        headerName: 'School ID',
        width: 120,
        sortable: true,
      },
      {
        field: 'name',
        headerName: 'Name',
        width: 200,
        sortable: true,
        renderCell: (params) => params.value || '-',
      },
      {
        field: 'email',
        headerName: 'Email',
        width: 250,
        sortable: true,
        renderCell: (params) => (
          <Link href={`mailto:${params.value}`} color="primary">
            {params.value}
          </Link>
        ),
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        sortable: true,
        renderCell: (params) => {
          const chipProps = getStatusChipProps(params.value);
          return <Chip {...chipProps} size="small" />;
        },
      },
    ];

    // Add roles column for staff tab
    if (tabs[activeTab].type === 'staff') {
      baseColumns.push({
        field: 'roles',
        headerName: 'Roles',
        width: 300,
        sortable: false,
        renderCell: (params) => {
          const user = params.row as User;
          const userRoles = user.roles || [];

          if (!canManageRoles) {
            return (
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {userRoles.map((roleName) => (
                  <Chip
                    key={roleName}
                    label={roleName.replace('_', ' ').toUpperCase()}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            );
          }

          return (
            <Stack direction="row" spacing={0.5} flexWrap="wrap">
              {grantableRoles.map((roleName) => (
                <FormControlLabel
                  key={roleName}
                  control={
                    <Checkbox
                      checked={userRoles.includes(roleName)}
                      onChange={() => handleRoleToggle(user.id, roleName)}
                      size="small"
                    />
                  }
                  label={
                    <Chip
                      label={roleName.replace('_', ' ').toUpperCase()}
                      size="small"
                      color={
                        userRoles.includes(roleName) ? 'primary' : 'default'
                      }
                      variant={
                        userRoles.includes(roleName) ? 'filled' : 'outlined'
                      }
                    />
                  }
                  sx={{ margin: 0 }}
                />
              ))}
            </Stack>
          );
        },
      });

      // Add actions column for staff tab
      baseColumns.push({
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 100,
        getActions: (params) => {
          const user = params.row as User;
          const isSaving = saving.has(user.id);

          if (!user.isDirty || !canManageRoles) return [];

          return [
            <GridActionsCellItem
              key="save"
              icon={isSaving ? <CircularProgress size={16} /> : <SaveIcon />}
              label="Save"
              onClick={() => handleSaveRoles(user.id)}
              disabled={isSaving}
              color="primary"
            />,
          ];
        },
      });
    }

    return baseColumns;
  };

  // Row styling for dirty rows
  const getRowClassName = (params: any) => {
    const user = params.row as User;
    return user.isDirty ? 'dirty-row' : '';
  };

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
          Manage users across different categories. Staff roles can be modified
          based on your permissions.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Paper elevation={1} sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
          >
            {tabs.map((tab, index) => (
              <Tab
                key={tab.type}
                label={`${tab.label} (${users[tab.type].length})`}
              />
            ))}
          </Tabs>
        </Paper>

        {/* Search and Filter Controls */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="center"
          >
            <TextField
              label="Search"
              placeholder="Search by School ID, Name, or Email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Search is already real-time, but this satisfies the keyboard requirement
                  e.currentTarget.blur();
                }
              }}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 300 }}
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="all">All</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {/* DataGrid */}
        <Paper elevation={2} sx={{ height: 600 }}>
          <DataGrid
            rows={filteredUsers}
            columns={getColumns()}
            pagination
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 },
              },
            }}
            slots={{
              toolbar: GridToolbar,
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: false, // We have our own search
              },
            }}
            getRowClassName={getRowClassName}
            disableRowSelectionOnClick
            sx={{
              '& .dirty-row': {
                backgroundColor: 'primary.50',
                '&:hover': {
                  backgroundColor: 'primary.100',
                },
              },
              '& .MuiDataGrid-cell': {
                display: 'flex',
                alignItems: 'center',
              },
            }}
          />
        </Paper>

        {/* Empty State */}
        {filteredUsers.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No users found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm || statusFilter !== 'active'
                ? 'Try adjusting your search or filter criteria.'
                : `No users in the ${tabs[activeTab].label.toLowerCase()} category.`}
            </Typography>
          </Box>
        )}

        {/* Snackbar */}
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
