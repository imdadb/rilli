import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

function About() {
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
      <Typography 
        variant="h1" 
        component="h1" 
        sx={{ 
          textAlign: 'center',
          color: 'primary.main',
          fontSize: { xs: '2.5rem', md: '3.75rem' }
        }}
      >
        About Works!
      </Typography>
    </Box>
  );
}

export default About;