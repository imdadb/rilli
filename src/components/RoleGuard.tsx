import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RoleGuardProps {
  perm: string;
  children: ReactNode;
}

export function RoleGuard({ perm, children }: RoleGuardProps) {
  const { can } = useAuth();
  
  return can(perm) ? <>{children}</> : <Navigate to="/dashboard" replace />;
}