# Sketch2Startup AI

Sketch2Startup AI transforms sketches, wireframes, whiteboard photos, and screenshots into deployment-ready full-stack applications. It combines a React 19 SaaS dashboard, FastAPI backend, PostgreSQL persistence plus Firebase Auth/Storage, and an agentic generation pipeline.

## Features
- Firebase authentication and protected app routes.
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
React 19, Vite, TypeScript, Tailwind CSS, shadcn-style components, TanStack Query, Framer Motion, Monaco Editor, FastAPI, SQLAlchemy, Alembic, PostgreSQL, Firebase Auth/Storage, Vercel, Render, Docker.

## Environment Variables
See `.env.example` for `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `DATABASE_URL`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `OPENAI_API_KEY`, and CORS settings.

## Deployment
- Frontend: Vercel using `client/vercel.json`.
- Backend: Render using `render.yaml` or Dockerfile.
- Database/Storage/Auth: Firebase project for Auth/Storage and PostgreSQL using SQL from `server/app/db/schema.sql`.

## Screenshots
- `docs/screenshots/landing.png` placeholder
- `docs/screenshots/dashboard.png` placeholder

## License
MIT
