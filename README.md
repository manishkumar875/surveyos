# SurveyOS

SurveyOS is a commercial SaaS foundation for a market research survey operations platform.

This repository contains **Phase 1: Project Foundation** only. It does not include business features such as projects, quotas, redirects, suppliers, dashboards, or reporting logic yet.

## Tech Stack

### Frontend

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- shadcn/ui-ready structure

### Backend

- Node.js
- Express
- TypeScript
- Pino logging
- Zod environment validation
- Centralized error handling

### Database

- PostgreSQL
- Prisma

### Tooling

- pnpm workspaces
- Turborepo
- ESLint
- Prettier
- Husky
- lint-staged
- Docker
- Docker Compose

## Monorepo Structure

```txt
apps/
  api/   Express API foundation
  web/   Next.js frontend foundation
packages/
  db/        Prisma setup and database client
  shared/    Shared constants, types, and utilities
```

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create environment file

```bash
cp .env.example .env
```

### 3. Start infrastructure

```bash
docker compose up -d postgres redis
```

### 4. Generate Prisma client

```bash
pnpm db:generate
```

### 5. Run development servers

```bash
pnpm dev
```

Web app: `http://localhost:3000`  
API health: `http://localhost:4000/health`  
API base: `http://localhost:4000/api/v1`

## Docker Development

To run the full stack with Docker Compose:

```bash
docker compose up --build
```

## Quality Commands

```bash
pnpm lint
pnpm typecheck
pnpm format:check
pnpm build
```

## Database Commands

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

## Phase 1 Scope

Included:

- Monorepo structure
- Frontend app shell
- Backend API shell
- Shared types/constants package
- Prisma package
- Environment validation
- Logging setup
- Error handling setup
- Docker and Docker Compose
- ESLint and Prettier
- Husky and lint-staged

Not included:

- Authentication business logic
- Project management
- Redirect handling
- Quota engine
- Supplier management
- Reporting dashboards
- Survey business database models

Business modules will be added one module at a time after this foundation is approved.
