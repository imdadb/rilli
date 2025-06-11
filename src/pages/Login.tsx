import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Container,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserWithPermissions, validatePassword, createVerificationToken } from '../lib/userService';
import { sendVerificationEmail } from '../lib/sendEmail';

interface EmailCheckResult {
  registered: boolean;
  firstTime: boolean;
}

// Check if email is registered in Supabase
const checkEmailRegistered = async (email: string): Promise<EmailCheckResult> => {
  try {
    const user = await fetchUserWithPermissions(email);
    
    if (!user) {
      return { registered: false, firstTime: false };
    }
    
    if (!user.email_verified) {
      return { registered: true, firstTime: true };
    }
    
    return { registered: true, firstTime: false };
  } catch (error) {
    console.error('Error checking email registration:', error);
    throw error;
  }
};

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState<{
    type: 'error' | 'info' | 'success';
    message: string;
  } | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setAlert({
        type: 'error',
        message: 'Please enter your email address.'
      });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      const result = await checkEmailRegistered(email);
      
      if (!result.registered) {
        setAlert({
          type: 'error',
          message: 'This email is not registered. Only existing staff, students, or guardians can access the system. Please contact school administration.'
        });
        setShowPassword(false);
      } else if (result.firstTime) {
        // Send verification email for first-time users
        try {
          const token = await createVerificationToken(email);
          await sendVerificationEmail(email, token);
          setAlert({
            type: 'success',
            message: "We've sent a verification link to your email. Please open it to set your password."
          });
        } catch (emailError) {
          console.error('Error sending verification email:', emailError);
          setAlert({
            type: 'error',
            message: 'Failed to send verification email. Please try again or contact support.'
          });
        }
        setShowPassword(false);
      } else {
        // Registered user, not first time - show password field
        setShowPassword(true);
        setAlert(null);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'An error occurred while checking your email. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setAlert({
        type: 'error',
        message: 'Please enter your password.'
      });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      const isValid = await validatePassword(email, password);
      
      if (isValid) {
        // Fetch user with permissions and roles
        const userWithPermissions = await fetchUserWithPermissions(email);
        if (userWithPermissions) {
          login(email, userWithPermissions.permissions, userWithPermissions.roles);
          navigate('/dashboard');
        } else {
          setAlert({
            type: 'error',
            message: 'Failed to load user data. Please try again.'
          });
        }
      } else {
        setAlert({
          type: 'error',
          message: 'Incorrect password, please try again.'
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'An error occurred while validating your password. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

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
              School ERP
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to your account
            </Typography>
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

          <Box component="form" onSubmit={showPassword ? handlePasswordSubmit : handleEmailSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              disabled={loading || showPassword}
              autoFocus={!showPassword}
              sx={{ mb: 2 }}
            />

            {showPassword && (
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                disabled={loading}
                autoFocus
                sx={{ mb: 2 }}
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 2, py: 1.5 }}
            >
              {loading ? 'Please wait...' : showPassword ? 'Login' : 'Next'}
            </Button>
          </Box>

          {showPassword && (
            <Button
              fullWidth
              variant="text"
              onClick={() => {
                setShowPassword(false);
                setPassword('');
                setAlert(null);
              }}
              sx={{ mt: 1 }}
            >
              Back to Email
            </Button>
          )}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Test: imdadb@gmail.com / tfssteam@gmail.com (password: administan)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              First-time: tfss.manage@gmail.com (will send verification)
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;