import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  currentEmail: string | null;
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

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      try {
        const { isLoggedIn: savedIsLoggedIn, currentEmail: savedEmail } = JSON.parse(savedAuth);
        if (savedIsLoggedIn && savedEmail) {
          setIsLoggedIn(true);
          setCurrentEmail(savedEmail);
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        localStorage.removeItem('auth');
      }
    }
  }, []);

  const login = (email: string) => {
    setIsLoggedIn(true);
    setCurrentEmail(email);
    localStorage.setItem('auth', JSON.stringify({ isLoggedIn: true, currentEmail: email }));
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentEmail(null);
    localStorage.removeItem('auth');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, currentEmail, login, logout }}>
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