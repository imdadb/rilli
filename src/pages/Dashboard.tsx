import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { currentEmail } = useAuth();

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
          sx={{ mt: 2 }}
        >
          Logged in as: {currentEmail}
        </Typography>
      </Paper>
    </Box>
  );
}

export default Dashboard;