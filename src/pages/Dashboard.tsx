import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { currentEmail, permissions, roles, can, hasRole } = useAuth();

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        p: 3,
      }}
    >
      <Paper
        elevation={2}
        sx={{
          p: 4,
          textAlign: 'center',
          maxWidth: 600,
          width: '100%',
        }}
      >
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            color: 'primary.main',
            mb: 2,
            fontWeight: 300,
          }}
        >
          Welcome to the Dashboard
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ mt: 2, mb: 3 }}
        >
          Logged in as: {currentEmail}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Your Roles:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 2 }}>
            {roles.length > 0 ? (
              roles.map((role) => (
                <Chip
                  key={role}
                  label={role.replace('_', ' ').toUpperCase()}
                  color="secondary"
                  variant="filled"
                  size="small"
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No roles assigned
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Your Permissions:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
            {permissions.length > 0 ? (
              permissions.map((permission) => (
                <Chip
                  key={permission}
                  label={permission}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No permissions assigned
              </Typography>
            )}
          </Box>
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary">
            Quick Permission Tests:
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Can see users: {can('see_users') ? '✅' : '❌'}
          </Typography>
          <Typography variant="body2">
            Can manage roles: {can('manage_roles') ? '✅' : '❌'}
          </Typography>
          <Typography variant="body2">
            Can see finance: {can('see_finance') ? '✅' : '❌'}
          </Typography>
          <Typography variant="body2">
            Can see classes: {can('see_classes') ? '✅' : '❌'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Has Super Admin role: {hasRole('super_admin') ? '✅' : '❌'}
          </Typography>
          <Typography variant="body2">
            Has CEO role: {hasRole('CEO') ? '✅' : '❌'}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default Dashboard;