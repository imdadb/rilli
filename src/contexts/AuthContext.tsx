import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  currentEmail: string | null;
  expiresAt: number | null;
  permissions: string[];
  login: (email: string, permissions: string[]) => void;
  logout: () => void;
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const savedAuth = localStorage.getItem('auth');
      const savedExpiresAt = localStorage.getItem('expiresAt');
      
      if (savedAuth && savedExpiresAt) {
        const { isLoggedIn: savedIsLoggedIn } = JSON.parse(savedAuth);
        const expiryTime = Number(savedExpiresAt);
        
        // Check if session is still valid
        return savedIsLoggedIn && Date.now() < expiryTime;
      }
      return false;
    } catch (error) {
      console.error('Error loading auth state:', error);
      return false;
    }
  });

  const [currentEmail, setCurrentEmail] = useState<string | null>(() => {
    try {
      const savedAuth = localStorage.getItem('auth');
      const savedExpiresAt = localStorage.getItem('expiresAt');
      
      if (savedAuth && savedExpiresAt) {
        const { currentEmail: savedEmail } = JSON.parse(savedAuth);
        const expiryTime = Number(savedExpiresAt);
        
        // Check if session is still valid
        if (Date.now() < expiryTime) {
          return savedEmail;
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading current email:', error);
      return null;
    }
  });

  const [expiresAt, setExpiresAt] = useState<number | null>(() => {
    try {
      const savedExpiresAt = localStorage.getItem('expiresAt');
      if (savedExpiresAt) {
        const expiryTime = Number(savedExpiresAt);
        // Check if session is still valid
        if (Date.now() < expiryTime) {
          return expiryTime;
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading expiry time:', error);
      return null;
    }
  });

  const [permissions, setPermissions] = useState<string[]>(() => {
    try {
      const savedPermissions = localStorage.getItem('permissions');
      const savedExpiresAt = localStorage.getItem('expiresAt');
      
      if (savedPermissions && savedExpiresAt) {
        const expiryTime = Number(savedExpiresAt);
        // Check if session is still valid
        if (Date.now() < expiryTime) {
          return JSON.parse(savedPermissions);
        }
      }
      return [];
    } catch (error) {
      console.error('Error loading permissions:', error);
      return [];
    }
  });

  // Helper function to check permissions
  const can = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  // Session timeout and activity monitoring
  useEffect(() => {
    const timeoutMin = Number(import.meta.env.VITE_SESSION_TIMEOUT_MIN) || 30;

    function resetTimer() {
      if (isLoggedIn) {
        const newExpiry = Date.now() + timeoutMin * 60_000;
        setExpiresAt(newExpiry);
        localStorage.setItem('expiresAt', String(newExpiry));
      }
    }

    // Reset timer on user activity
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Check for session expiry every 10 seconds
    const checkInterval = setInterval(() => {
      const storedExpiresAt = Number(localStorage.getItem('expiresAt') || 0);
      if (isLoggedIn && storedExpiresAt && Date.now() > storedExpiresAt) {
        alert('Session expired. Please sign in again.');
        logout();
      }
    }, 10_000);

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      clearInterval(checkInterval);
    };
  }, [isLoggedIn]);

  const login = (email: string, userPermissions: string[] = []) => {
    const timeoutMin = Number(import.meta.env.VITE_SESSION_TIMEOUT_MIN) || 30;
    const newExpiry = Date.now() + timeoutMin * 60_000;
    
    setIsLoggedIn(true);
    setCurrentEmail(email);
    setExpiresAt(newExpiry);
    setPermissions(userPermissions);
    
    localStorage.setItem('auth', JSON.stringify({ isLoggedIn: true, currentEmail: email }));
    localStorage.setItem('expiresAt', String(newExpiry));
    localStorage.setItem('permissions', JSON.stringify(userPermissions));
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentEmail(null);
    setExpiresAt(null);
    setPermissions([]);
    
    localStorage.removeItem('auth');
    localStorage.removeItem('expiresAt');
    localStorage.removeItem('permissions');
  };

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      currentEmail, 
      expiresAt, 
      permissions, 
      login, 
      logout, 
      can 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}