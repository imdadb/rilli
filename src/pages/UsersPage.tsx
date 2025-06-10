import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

function UsersPage() {
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
          Users Management
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ mt: 2 }}
        >
          Users page works! 👥
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ mt: 2 }}
        >
          This page requires the 'see_users' permission to access.
        </Typography>
      </Paper>
    </Box>
  );
}

export default UsersPage;