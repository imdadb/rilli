import React from 'react';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AccountBalance as FinanceIcon,
  School as ClassesIcon,
} from '@mui/icons-material';

export interface MenuItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
  permission: string | '*';   // '*' = everyone who is logged in
}

export const menuConfig: MenuItem[] = [
  { 
    label: 'Dashboard', 
    path: '/dashboard', 
    icon: <DashboardIcon />, 
    permission: '*' 
  },
  { 
    label: 'Users', 
    path: '/users', 
    icon: <PeopleIcon />, 
    permission: 'see_users' 
  },
  { 
    label: 'Finance', 
    path: '/finance', 
    icon: <FinanceIcon />, 
    permission: 'see_finance' 
  },
  { 
    label: 'Classes', 
    path: '/classes', 
    icon: <ClassesIcon />, 
    permission: 'see_classes' 
  }
];