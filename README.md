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

## 4. Run the backend

In one terminal:

```bash
cd backend
npm run start:dev
```

The database connectivity endpoint is available at:

```text
http://localhost:3001/health/database
```

## 5. Run the frontend

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

Stop the database when it is no longer needed:

```bash
docker stop event-management-db
```
