import React from 'react';

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
    permission: '*' 
  },
  { 
    label: 'Users', 
    path: '/users', 
    permission: 'see_users' 
  },
  { 
    label: 'Finance', 
    path: '/finance', 
    permission: 'see_finance' 
  },
  { 
    label: 'Classes', 
    path: '/classes', 
    permission: 'see_classes' 
  }
];