# Sketch2Startup AI

Sketch2Startup AI transforms sketches, wireframes, whiteboard photos, and screenshots into deployment-ready full-stack applications. It combines a React 19 SaaS dashboard, FastAPI backend, PostgreSQL/Supabase persistence, storage, and an agentic generation pipeline.

## Features
- Supabase authentication and protected app routes.
- Drag-and-drop sketch uploads with preview/progress.
- Vision analysis JSON for UI elements.
- Planner, architect, builder, database, API, testing, documentation, and deployment agents.
- Generators for PRDs, SQL schemas, REST APIs, frontend/backend code, tests, and documentation.
- Dark glassmorphism UI with workflow timelines and agent logs.

## Architecture
```text
client/   React + Vite + TypeScript + Tailwind SaaS UI
server/   FastAPI + SQLAlchemy + Alembic API
agents/   Reusable Python generation agents
shared/   Cross-cutting schemas/contracts
docs/     Product and deployment documentation
```

## Installation
```bash
cp .env.example .env
cd client && npm install && npm run dev
cd ../server && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload
```

## Tech Stack
React 19, Vite, TypeScript, Tailwind CSS, shadcn-style components, TanStack Query, Framer Motion, Monaco Editor, FastAPI, SQLAlchemy, Alembic, PostgreSQL, Supabase Auth/Storage, Vercel, Render, Docker.

## Environment Variables
See `.env.example` for `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, and CORS settings.

## Deployment
- Frontend: Vercel using `client/vercel.json`.
- Backend: Render using `render.yaml` or Dockerfile.
- Database/Storage/Auth: Supabase project with SQL from `server/app/db/schema.sql`.

## Screenshots
- `docs/screenshots/landing.png` placeholder
- `docs/screenshots/dashboard.png` placeholder

## License
MIT
