import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  currentEmail: string | null;
  expiresAt: number | null;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('auth');
    const savedExpiresAt = localStorage.getItem('expiresAt');
    
    if (savedAuth && savedExpiresAt) {
      try {
        const { isLoggedIn: savedIsLoggedIn, currentEmail: savedEmail } = JSON.parse(savedAuth);
        const expiryTime = Number(savedExpiresAt);
        
        // Check if session is still valid
        if (savedIsLoggedIn && savedEmail && Date.now() < expiryTime) {
          setIsLoggedIn(true);
          setCurrentEmail(savedEmail);
          setExpiresAt(expiryTime);
        } else {
          // Session expired, clean up
          logout();
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        logout();
      }
    }
  }, []);

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

  const login = (email: string) => {
    const timeoutMin = Number(import.meta.env.VITE_SESSION_TIMEOUT_MIN) || 30;
    const newExpiry = Date.now() + timeoutMin * 60_000;
    
    setIsLoggedIn(true);
    setCurrentEmail(email);
    setExpiresAt(newExpiry);
    
    localStorage.setItem('auth', JSON.stringify({ isLoggedIn: true, currentEmail: email }));
    localStorage.setItem('expiresAt', String(newExpiry));
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentEmail(null);
    setExpiresAt(null);
    
    localStorage.removeItem('auth');
    localStorage.removeItem('expiresAt');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, currentEmail, expiresAt, login, logout }}>
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