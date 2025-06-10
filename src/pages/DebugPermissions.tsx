import React from 'react';
import { Box, Typography, Paper, Container, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function DebugPermissions() {
  const { isLoggedIn, currentEmail, permissions, can } = useAuth();
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 3,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Debug Permissions
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Development-only permissions viewer
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Authentication Status:
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Logged in: {isLoggedIn ? 'Yes' : 'No'}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Current email: {currentEmail || 'None'}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Permissions Array:
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: 'grey.50',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                overflow: 'auto',
              }}
            >
              <pre>{JSON.stringify(permissions, null, 2)}</pre>
            </Paper>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Permission Tests:
            </Typography>
            {[
              'see_dashboard',
              'see_users',
              'manage_users',
              'see_finance',
              'manage_finance',
              'see_classes'
            ].map((perm) => (
              <Typography key={perm} variant="body2" sx={{ mb: 1 }}>
                can('{perm}'): {can(perm) ? '✅ Yes' : '❌ No'}
              </Typography>
            ))}
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              sx={{ mr: 2 }}
            >
              Back to Home
            </Button>
            {!isLoggedIn && (
              <Button
                variant="outlined"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default DebugPermissions;