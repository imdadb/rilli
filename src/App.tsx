import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { RoleGuard } from './components/RoleGuard';
import Home from './components/Home';
import About from './components/About';
import Login from './pages/Login';
import Verify from './pages/Verify';
import Dashboard from './pages/Dashboard';
import DebugPermissions from './pages/DebugPermissions';
import UsersPage from './pages/UsersPage';
import FinancePage from './pages/FinancePage';
import ClassesPage from './pages/ClassesPage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 300,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/debug-perms" element={<DebugPermissions />} />
          <Route path="/*" element={
            <MainLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/users" element={
                  <ProtectedRoute>
                    <RoleGuard perm="see_users">
                      <UsersPage />
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/finance" element={
                  <ProtectedRoute>
                    <RoleGuard perm="see_finance">
                      <FinancePage />
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/classes" element={
                  <ProtectedRoute>
                    <RoleGuard perm="see_classes">
                      <ClassesPage />
                    </RoleGuard>
                  </ProtectedRoute>
                } />
              </Routes>
            </MainLayout>
          } />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;