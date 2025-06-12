# School-ERP

A modern school management system built with React, TypeScript, and Supabase.

## Quick start (dev)

```bash
pnpm install           # install deps
cp .env.example .env   # add your Supabase creds
supabase start         # runs local Postgres & Studio
pnpm dev               # Vite + React at http://localhost:5173
```

## Lint / Format / Type-check

```bash
pnpm lint        # ESLint
pnpm lint:fix    # ESLint --fix
pnpm format      # Prettier
pnpm typecheck   # strict TS
```

## Features

- **Authentication**: Email-based login with verification tokens
- **Role-based Access Control**: Granular permissions system
- **User Management**: Staff, students, and guardians
- **Responsive Design**: Material-UI components with mobile support
- **TypeScript**: Full type safety with strict mode enabled

## Database Schema

The system uses a flexible role-based permission system with the following key tables:
- `users` - User accounts with basic information
- `roles` - Available roles in the system
- `permissions` - Granular permissions
- `role_user` - User-role assignments
- `permission_role` - Role-permission assignments
- `role_grant_matrix` - Controls which roles can grant other roles

## Environment Variables

Copy `.env.example` to `.env` and configure:
- Supabase URL and anonymous key
- EmailJS credentials for verification emails
- Session timeout settings
- Frontend URL for email links