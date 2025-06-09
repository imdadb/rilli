import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Container,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { 
  validateVerificationToken, 
  setUserPassword, 
  deleteVerificationToken 
} from '../lib/userService';

function Verify() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [alert, setAlert] = useState<{
    type: 'error' | 'info' | 'success';
    message: string;
  } | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const email = searchParams.get('e');
  const token = searchParams.get('t');

  useEffect(() => {
    const validateToken = async () => {
      if (!email || !token) {
        setAlert({
          type: 'error',
          message: 'Invalid verification link. Please check your email and try again.'
        });
        setValidating(false);
        return;
      }

      try {
        const isValid = await validateVerificationToken(email, token);
        setIsValidToken(isValid);
        
        if (!isValid) {
          setAlert({
            type: 'error',
            message: 'This verification link is invalid or has expired. Please request a new one.'
          });
        }
      } catch (error) {
        console.error('Error validating token:', error);
        setAlert({
          type: 'error',
          message: 'An error occurred while validating your link. Please try again.'
        });
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [email, token]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setAlert({
        type: 'error',
        message: 'Please enter a password.'
      });
      return;
    }

    if (password.length < 6) {
      setAlert({
        type: 'error',
        message: 'Password must be at least 6 characters long.'
      });
      return;
    }

    if (password !== confirmPassword) {
      setAlert({
        type: 'error',
        message: 'Passwords do not match.'
      });
      return;
    }

    if (!email || !token) {
      setAlert({
        type: 'error',
        message: 'Invalid verification data.'
      });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      // Set the user's password and mark as verified
      await setUserPassword(email, password);
      
      // Delete the verification token so it can't be reused
      await deleteVerificationToken(email, token);
      
      // Auto-login the user
      login(email);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error setting password:', error);
      setAlert({
        type: 'error',
        message: 'An error occurred while setting your password. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestNewLink = () => {
    navigate('/login');
  };

  if (validating) {
    return (
      <Container maxWidth="sm">
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
              maxWidth: 400,
              textAlign: 'center',
            }}
          >
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Validating verification link...
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
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
            maxWidth: 400,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {isValidToken ? 'Set Your Password' : 'Verification Failed'}
            </Typography>
            {isValidToken && (
              <Typography variant="body1" color="text.secondary">
                Create a password for {email}
              </Typography>
            )}
          </Box>

          {alert && (
            <Alert 
              severity={alert.type} 
              sx={{ mb: 2 }}
              onClose={() => setAlert(null)}
            >
              {alert.message}
            </Alert>
          )}

          {isValidToken ? (
            <Box component="form" onSubmit={handlePasswordSubmit}>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                disabled={loading}
                autoFocus
                helperText="Password must be at least 6 characters long"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                required
                disabled={loading}
                sx={{ mb: 2 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 2, py: 1.5 }}
              >
                {loading ? 'Setting Password...' : 'Save Password'}
              </Button>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleRequestNewLink}
                sx={{ mt: 2, py: 1.5 }}
              >
                Request New Verification Link
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default Verify;