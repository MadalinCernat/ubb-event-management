# UBB Event Management

Full-stack event management application built with Next.js, NestJS, and PostgreSQL.

## Prerequisites

- Node.js 24 or newer
- npm
- Docker

## 1. Start PostgreSQL

Create and start the local PostgreSQL container:

```bash
docker run --name event-management-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```

The `-p 5432:5432` option exposes PostgreSQL to the backend. On later runs, start the existing container instead of creating it again:

```bash
docker start event-management-db
```

## 2. Install dependencies

From the repository root:

```bash
cd backend
npm install
cd ../frontend
npm install
cd ..
```

## 3. Configuration

No configuration is required when using the Docker command above. The applications have matching local defaults. The available variables are documented in `backend/.env.example` and `frontend/.env.example`.

To override the frontend backend URL, copy `frontend/.env.example` to `frontend/.env` and edit it. To override backend variables, set `DATABASE_URL` or `PORT` in the terminal before starting NestJS.

Default configuration:

- PostgreSQL: `postgresql://postgres:password@localhost:5432/postgres`
- Backend: `http://localhost:3001`
- Frontend: `http://localhost:3000`

## 4. Initialize the database

Run the committed migrations and load fictional development data:

```bash
cd backend
npm run db:migrate:deploy
npm run db:seed
```

The seed creates `manager@example.com` and `student@example.com` with the development password `password`. The authentication API will be implemented in a later task; these credentials prepare repeatable local data for it.

During schema development, create a migration with:

```bash
cd backend
npm run db:migrate -- --name describe_your_change
```

To recreate the local schema from migrations and run the seed again:

```bash
cd backend
npm run db:reset
```

`db:reset` deletes local database data and must not be used against a shared or production database.

## 5. Run the backend

In one terminal:

```bash
cd backend
npm run start:dev
```

The database connectivity endpoint is available at:

```text
http://localhost:3001/health/database
```

## 6. Run the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The page calls the NestJS backend, which queries PostgreSQL and displays the connection status and database time.

## Useful commands

Run commands from the relevant `frontend` or `backend` directory.

| Task | Frontend | Backend |
| --- | --- | --- |
| Development | `npm run dev` | `npm run start:dev` |
| Lint | `npm run lint` | `npm run lint` |
| Build | `npm run build` | `npm run build` |
| Unit tests | — | `npm test` |
| End-to-end tests | — | `npm run test:e2e` |

Backend database commands:

| Task | Command |
| --- | --- |
| Generate Prisma client | `npm run db:generate` |
| Create a development migration | `npm run db:migrate -- --name migration_name` |
| Apply committed migrations | `npm run db:migrate:deploy` |
| Load development data | `npm run db:seed` |
| Reset the local database | `npm run db:reset` |

Stop the database when it is no longer needed:

```bash
docker stop event-management-db
```
