# Sketch2Startup AI - Development Guide

This document contains project-specific information for developers working on Sketch2Startup AI.

## Project Overview

Sketch2Startup AI is an AI-powered platform that transforms sketches into production-ready full-stack applications using specialized AI agents.

## Quick Start Commands

### Backend Development
```bash
cd server
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd client
npm install
npm run dev
```

### Docker Development
```bash
docker-compose up -d
```

### Testing
```bash
# Backend tests
cd server
pytest tests/ -v

# Frontend tests
cd client
npm test
```

## Build & Verification

### Backend
```bash
cd server
pip install -r requirements.txt
pytest tests/ -v
```

### Frontend
```bash
cd client
npm install
npm run build
npm run lint
```

## Architecture

### Frontend Structure
- `src/components/ui/` - shadcn/ui components
- `src/components/layout/` - Layout components (Sidebar, Header, AppLayout)
- `src/components/dashboard/` - Dashboard-specific components
- `src/pages/` - Page components (Landing, Auth, Dashboard, Upload, etc.)
- `src/lib/` - Utilities (api.ts, firebase.ts, utils.ts)
- `src/hooks/` - Custom React hooks
- `src/types/` - TypeScript type definitions

### Backend Structure
- `app/api/routes.py` - API endpoints
- `app/core/config.py` - Configuration management
- `app/db/session.py` - Database session management
- `app/models.py` - SQLAlchemy models
- `app/schemas.py` - Pydantic schemas
- `app/services/` - Business logic (agents.py, firebase.py)

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query
- Framer Motion
- Monaco Editor

### Backend
- FastAPI
- Python 3.12
- SQLAlchemy
- PostgreSQL (production) / SQLite (development)
- Firebase Admin SDK
- Groq LLM (llama-3.3-70b)
- Tavily Search API

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=sqlite:///./dev.db
CORS_ORIGINS=http://localhost:5173
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
TAVILY_API_KEY=your-tavily-api-key
GROQ_API_KEY=your-groq-api-key
DEMO_MODE=false
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
```

## Deployment

### Frontend (Vercel)
- Connect GitHub repository to Vercel
- Configure environment variables in Vercel dashboard
- Automatic deployment on push to main branch

### Backend (Render)
- Connect GitHub repository to Render
- Configure environment variables in Render dashboard
- Set up PostgreSQL database
- Automatic deployment on push to main branch

### Docker
```bash
docker-compose up -d
```

## AI Agents

The platform uses specialized AI agents:
1. **Planner Agent** - Generates PRDs
2. **Architect Agent** - Designs system architecture
3. **Database Agent** - Creates database schemas
4. **API Agent** - Generates REST APIs
5. **Builder Agent** - Produces frontend/backend code
6. **Tester Agent** - Creates test suites
7. **Documentation Agent** - Generates documentation
8. **Deployment Agent** - Creates deployment configs

## Database Models

- **User** - User accounts with Firebase integration
- **Project** - Project management
- **Artifact** - Generated artifacts (PRD, code, docs, etc.)
- **WorkflowStep** - Workflow progress tracking

## API Endpoints

### Authentication
- `POST /auth/verify` - Verify Firebase token
- `GET /auth/status` - Check authentication status

### Projects
- `POST /projects` - Create project
- `GET /projects` - Get user projects
- `GET /projects/{id}` - Get specific project
- `PUT /projects/{id}` - Update project
- `DELETE /projects/{id}` - Delete project

### Upload & Analysis
- `POST /uploads` - Upload file to Firebase Storage
- `POST /analyze` - Analyze uploaded sketch

### Artifacts
- `GET /projects/{id}/artifacts` - Get project artifacts
- `POST /projects/{id}/artifacts` - Create artifact

### Workflow
- `GET /projects/{id}/workflow` - Get workflow steps
- `POST /projects/{id}/workflow/{step_name}` - Update workflow step

### AI Agents
- `POST /prd` - Generate PRD
- `POST /architecture` - Generate architecture
- `POST /database` - Generate database schema
- `POST /apis` - Generate APIs
- `POST /frontend` - Generate frontend code
- `POST /backend` - Generate backend code
- `POST /tests` - Generate tests
- `POST /docs` - Generate documentation

## Code Style

### Frontend
- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Keep components small and focused
- Use Tailwind CSS for styling

### Backend
- Follow FastAPI best practices
- Use type hints throughout
- Keep functions focused and small
- Use async/await for I/O operations
- Follow PEP 8 style guide

## Troubleshooting

### Common Issues

**CORS Errors:**
- Ensure `CORS_ORIGINS` includes your frontend URL
- Check that Firebase credentials are correct

**Firebase Authentication:**
- Verify Firebase project configuration
- Check that Auth is enabled in Firebase console
- Ensure service account JSON is valid

**Database Connection:**
- Verify DATABASE_URL is correct
- Check that database server is running
- Ensure database credentials are valid

**Build Failures:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Python cache: `find . -type d -name __pycache__ -exec rm -rf {} +`
- Check for missing dependencies

## User Preferences

The project uses:
- Dark mode as default theme
- Glassmorphism UI design
- Violet (#7C3AED) and Cyan (#06B6D4) as primary colors
- Modern, minimal SaaS aesthetic
- Smooth animations and transitions

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)