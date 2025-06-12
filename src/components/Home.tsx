import React, { useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { supabase } from '../lib/supabaseClient';

function Home() {
  useEffect(() => {
    // Test Supabase connectivity
    const testConnection = async () => {
      try {
        // Try to fetch from a non-existent table to test connectivity
        // This will return a 404 but proves we can reach Supabase
        const { data, error } = await supabase.from('unknown').select('*');
        console.log('Supabase connection test:', { data, error });
      } catch (err) {
        console.error('Supabase connection error:', err);
      }
    };

    testConnection();
  }, []);

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
          fontSize: { xs: '2.5rem', md: '3.75rem' },
        }}
      >
        It boots! 🚀
      </Typography>
    </Box>
  );
}

export default Home;
