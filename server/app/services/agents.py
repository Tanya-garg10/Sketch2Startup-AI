"""
AI Agent Service
================
Dual-engine pipeline:
  1. Tavily Search  → gathers real-world context for each task
  2. Groq LLM       → generates rich structured JSON from that context
  3. Mock fallback  → used when either key is missing / quota exceeded
"""
from __future__ import annotations
import json
import re
from typing import Any
from app.core.config import settings

AGENTS = ["planner", "architect", "builder", "database", "api", "tester", "documentation", "deployment"]
GROQ_MODEL = "llama-3.3-70b-versatile"


# ──────────────────────────────────────────────
# Tavily helpers
# ──────────────────────────────────────────────
def _tavily():
    if not settings.tavily_api_key:
        return None
    try:
        from tavily import TavilyClient
        return TavilyClient(api_key=settings.tavily_api_key)
    except ImportError:
        return None

def _search(query: str, max_results: int = 4) -> list[dict]:
    client = _tavily()
    if client is None:
        raise RuntimeError("No Tavily key")
    resp = client.search(query=query, max_results=max_results, search_depth="advanced")
    return resp.get("results", [])

def _extract_text(results: list[dict], max_chars: int = 3000) -> str:
    parts, total = [], 0
    for r in results:
        c = (r.get("content") or r.get("snippet") or "").strip()
        if not c:
            continue
        remaining = max_chars - total
        if remaining <= 0:
            break
        c = c[:remaining]
        parts.append(c)
        total += len(c)
    return "\n\n".join(parts)


# ──────────────────────────────────────────────
# Groq helpers
# ──────────────────────────────────────────────
def _groq():
    if not settings.groq_api_key:
        return None
    try:
        from groq import Groq
        return Groq(api_key=settings.groq_api_key)
    except ImportError:
        return None

def _groq_json(system: str, user: str) -> dict:
    """Call Groq and parse JSON from the response."""
    client = _groq()
    if client is None:
        raise RuntimeError("No Groq key")
    resp = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        temperature=0.3,
        max_tokens=4096,
        response_format={"type": "json_object"},
    )
    raw = resp.choices[0].message.content or "{}"
    return json.loads(raw)

def _groq_text(system: str, user: str, max_tokens: int = 2048) -> str:
    """Call Groq and return plain text."""
    client = _groq()
    if client is None:
        raise RuntimeError("No Groq key")
    resp = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        temperature=0.4,
        max_tokens=max_tokens,
    )
    return resp.choices[0].message.content or ""


# ──────────────────────────────────────────────
# Combined: Tavily research → Groq generation
# ──────────────────────────────────────────────
def _research_then_generate(
    search_queries: list[str],
    system_prompt: str,
    user_prompt: str,
    logs: list[str],
) -> dict:
    """
    1. Search each query via Tavily.
    2. Concatenate results as context.
    3. Ask Groq to generate structured JSON using that context.
    """
    # Step 1 — Tavily research
    all_results = []
    try:
        for q in search_queries:
            all_results += _search(q, max_results=3)
        context = _extract_text(all_results, max_chars=2500)
        logs.append(f"Tavily: gathered {len(all_results)} research results")
    except Exception as e:
        context = ""
        logs.append(f"Tavily unavailable ({e}), skipping research")

    # Step 2 — Groq generation
    full_user = f"{user_prompt}\n\n--- Research Context ---\n{context}" if context else user_prompt
    result = _groq_json(system_prompt, full_user)
    logs.append(f"Groq ({GROQ_MODEL}): generation completed")
    return result


# ──────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────
def run_agent(name: str, prompt: str = "") -> dict[str, Any]:
    fns = {
        "planner":       run_planner_agent,
        "architect":     run_architect_agent,
        "builder":       run_builder_agent,
        "database":      run_database_agent,
        "api":           run_api_agent,
        "tester":        run_tester_agent,
        "documentation": run_documentation_agent,
        "deployment":    run_deployment_agent,
    }
    fn = fns.get(name)
    if fn:
        return fn(prompt)
    return {"agent": name, "status": "error", "error": f"Unknown agent: {name}", "logs": []}

def analyze_upload(filename: str, image_bytes: bytes | None = None, content_type: str | None = None) -> dict[str, Any]:
    try:
        results = _search("UI wireframe sketch elements detection best practices components", 3)
        ctx = _extract_text(results, 600)
        base = _mock_analysis(filename)
        base["research_context"] = ctx[:300] if ctx else "UI analysis best practices applied"
        return base
    except Exception:
        return _mock_analysis(filename)

def _mock_analysis(filename: str) -> dict[str, Any]:
    return {
        "elements": [
            {"type": "navbar",  "confidence": 0.93, "position": "top"},
            {"type": "button",  "label": "CTA",     "confidence": 0.88, "position": "center"},
            {"type": "form",    "fields": ["email", "password"], "confidence": 0.84, "position": "center"},
            {"type": "card",    "confidence": 0.82, "position": "center"},
            {"type": "footer",  "confidence": 0.79, "position": "bottom"},
        ],
        "layout": {"type": "single_column", "responsive": True, "sections": ["header", "hero", "features", "footer"]},
        "components": ["Navbar", "HeroSection", "FeatureCard", "CTAButton", "Footer"],
        "suggestions": ["Add authentication flow", "Implement responsive design", "Add dark mode", "Include form validation"],
        "source": filename,
    }


# ──────────────────────────────────────────────
# PLANNER AGENT — PRD Generator
# ──────────────────────────────────────────────
def run_planner_agent(prompt: str) -> dict[str, Any]:
    logs = ["Planner agent started"]
    app_desc = prompt or "AI-powered SaaS application"
    try:
        output = _research_then_generate(
            search_queries=[
                f"product requirements document PRD template SaaS startup {app_desc}",
                f"user stories acceptance criteria software product {app_desc}",
                "PRD best practices functional non-functional requirements 2024",
            ],
            system_prompt=(
                "You are a senior product manager. Using the research context provided, "
                "generate a comprehensive Product Requirements Document (PRD). "
                "Return ONLY valid JSON with these exact keys: "
                "project_name (string), problem_statement (string), solution (string), "
                "target_users (array of strings), user_stories (array of strings), "
                "functional_requirements (array of strings), non_functional_requirements (array of strings), "
                "tech_stack (array of strings), acceptance_criteria (array of strings), future_scope (array of strings). "
                "Make it specific and detailed based on the research context."
            ),
            user_prompt=f"Generate a complete PRD for: {app_desc}",
            logs=logs,
        )
        logs.append("PRD generation completed")
        return {"agent": "planner", "status": "completed", "progress": 100, "logs": logs, "output": output}
    except Exception as e:
        logs.append(f"AI unavailable ({e}), using structured mock")
        return {"agent": "planner", "status": "completed", "progress": 100, "logs": logs, "output": _mock_prd(app_desc)}

def _mock_prd(app_desc: str = "") -> dict:
    name = app_desc.strip().title() if app_desc else "AI-Powered SaaS"
    return {
        "project_name": name or "AI-Powered Application",
        "problem_statement": f"Users building {name} face fragmented tooling and lack AI-powered automation.",
        "solution": f"A full-stack {name} platform with 8 AI agents that automate the development lifecycle.",
        "target_users": ["Startup founders", "Product managers", "Full-stack developers", "Technical teams"],
        "user_stories": [
            "As a user, I want to upload sketches to auto-generate applications",
            "As a developer, I want to review and edit generated code",
            "As a PM, I want auto-generated PRDs to document requirements fast",
            "As a user, I want to export all artifacts for deployment",
        ],
        "functional_requirements": ["Sketch upload and AI analysis", "Automated PRD generation", "Database schema generation", "REST API generation", "Frontend + backend code generation", "Test suite generation", "Documentation generation", "Deployment config generation"],
        "non_functional_requirements": ["API response < 2 seconds", "99.9% uptime", "1000+ concurrent users", "HTTPS encryption", "GDPR compliant", "Mobile-responsive"],
        "tech_stack": ["React 19 + TypeScript + Tailwind CSS", "FastAPI + Python 3.12", "PostgreSQL / SQLite", "Firebase Auth + Storage", "Tavily Search API", "Groq LLM (llama-3.3-70b)", "Vercel + Render"],
        "acceptance_criteria": ["Users register/login successfully", "Sketch upload works for PNG/JPG/PDF", "All 8 agents produce output", "Artifacts downloadable", "Dashboard shows project status"],
        "future_scope": ["Real-time collaboration", "Custom agent marketplace", "GitHub integration", "One-click deployment", "Multi-language generation"],
    }


# ──────────────────────────────────────────────
# ARCHITECT AGENT
# ──────────────────────────────────────────────
def run_architect_agent(prompt: str) -> dict[str, Any]:
    logs = ["Architect agent started"]
    try:
        output = _research_then_generate(
            search_queries=[
                "microservices monolith SaaS architecture best practices scalability 2024",
                "React FastAPI PostgreSQL Firebase system design patterns",
                "software architecture security scalability cloud deployment",
            ],
            system_prompt=(
                "You are a solutions architect. Using the research context, design a production-ready system architecture. "
                "Return ONLY valid JSON with keys: "
                "architecture_type (string), "
                "components (array of {name, technology, responsibilities: string[]}), "
                "data_flow (array of strings describing each step), "
                "security_considerations (array of strings), "
                "scalability_plan (array of strings). "
                "Be specific with technologies and patterns."
            ),
            user_prompt=prompt or "Design architecture for a full-stack AI SaaS (React + FastAPI + Firebase + Tavily + Groq)",
            logs=logs,
        )
        logs.append("Architecture design completed")
        return {"agent": "architect", "status": "completed", "progress": 100, "logs": logs, "output": output}
    except Exception as e:
        logs.append(f"AI unavailable ({e}), using mock")
        return {"agent": "architect", "status": "completed", "progress": 100, "logs": logs, "output": _mock_arch()}

def _mock_arch() -> dict:
    return {
        "architecture_type": "Modular Monolith with Microservices-ready design",
        "components": [
            {"name": "React Frontend", "technology": "React 19 + TypeScript + Vite", "responsibilities": ["UI rendering", "State management", "API communication"]},
            {"name": "FastAPI Backend", "technology": "Python 3.12 + FastAPI", "responsibilities": ["REST API", "Business logic", "AI orchestration"]},
            {"name": "PostgreSQL DB", "technology": "PostgreSQL 15 / SQLite (dev)", "responsibilities": ["Data persistence", "Relational queries"]},
            {"name": "Firebase Auth", "technology": "Firebase Authentication", "responsibilities": ["User auth", "JWT tokens", "Session management"]},
            {"name": "Firebase Storage", "technology": "Firebase Cloud Storage", "responsibilities": ["Sketch files", "CDN delivery"]},
            {"name": "Tavily + Groq", "technology": "Tavily Search + Groq LLM", "responsibilities": ["Research gathering", "Text/JSON generation"]},
        ],
        "data_flow": ["User uploads sketch → Firebase Storage", "Frontend calls /analyze → Backend AI analysis", "User triggers agent → Tavily searches → Groq generates", "Output saved as Artifact → Frontend displays"],
        "security_considerations": ["Firebase JWT on all protected routes", "HTTPS/TLS encryption", "CORS whitelist", "Pydantic input validation", "SQLAlchemy ORM (no raw SQL)", "File type validation"],
        "scalability_plan": ["Horizontal FastAPI scaling", "DB read replicas", "Firebase CDN globally", "Redis caching for Tavily results", "Celery task queue for agents"],
    }


# ──────────────────────────────────────────────
# DATABASE AGENT
# ──────────────────────────────────────────────
def run_database_agent(prompt: str) -> dict[str, Any]:
    logs = ["Database agent started"]
    try:
        output = _research_then_generate(
            search_queries=[
                "PostgreSQL schema design SaaS best practices UUID normalization 2024",
                "database indexing strategies foreign keys relational design patterns",
                "SQLAlchemy Alembic migration best practices production",
            ],
            system_prompt=(
                "You are a database architect. Design a production-ready database schema. "
                "Return ONLY valid JSON with keys: "
                "database_type (string), "
                "tables (array of {name, columns: [{name, type, constraints: string[]}], indexes: string[]}), "
                "relationships (array of {from, to, type, cascade}), "
                "er_diagram (string with ASCII diagram), "
                "migration_command (string). "
                "Include proper indexes, foreign keys, and constraints."
            ),
            user_prompt=prompt or "Design PostgreSQL schema for: users, projects, artifacts, workflow_steps tables",
            logs=logs,
        )
        logs.append("Schema design completed")
        return {"agent": "database", "status": "completed", "progress": 100, "logs": logs, "output": output}
    except Exception as e:
        logs.append(f"AI unavailable ({e}), using mock")
        return {"agent": "database", "status": "completed", "progress": 100, "logs": logs, "output": _mock_db()}

def _mock_db() -> dict:
    return {
        "database_type": "PostgreSQL (prod) / SQLite (dev)",
        "tables": [
            {"name": "users",    "columns": [{"name": "id","type": "UUID","constraints": ["PK"]},{"name": "email","type": "VARCHAR(255)","constraints": ["UNIQUE","NOT NULL"]},{"name": "firebase_uid","type": "VARCHAR(255)","constraints": ["UNIQUE"]}], "indexes": ["idx_users_email"]},
            {"name": "projects", "columns": [{"name": "id","type": "UUID","constraints": ["PK"]},{"name": "user_id","type": "UUID","constraints": ["FK → users.id"]},{"name": "name","type": "VARCHAR(160)","constraints": ["NOT NULL"]},{"name": "status","type": "VARCHAR(40)","constraints": ["DEFAULT 'draft'"]}], "indexes": ["idx_projects_user_id","idx_projects_status"]},
            {"name": "artifacts","columns": [{"name": "id","type": "UUID","constraints": ["PK"]},{"name": "project_id","type": "UUID","constraints": ["FK → projects.id"]},{"name": "kind","type": "VARCHAR(80)","constraints": ["NOT NULL"]},{"name": "content","type": "JSONB","constraints": []}], "indexes": ["idx_artifacts_project_id"]},
            {"name": "workflow_steps","columns": [{"name": "id","type": "UUID","constraints": ["PK"]},{"name": "project_id","type": "UUID","constraints": ["FK → projects.id"]},{"name": "step_name","type": "VARCHAR(100)","constraints": ["NOT NULL"]},{"name": "status","type": "VARCHAR(40)","constraints": ["DEFAULT 'pending'"]},{"name": "progress","type": "INTEGER","constraints": ["DEFAULT 0"]}], "indexes": ["idx_workflow_project_id"]},
        ],
        "relationships": [{"from": "projects.user_id","to": "users.id","type": "many_to_one","cascade": "DELETE"},{"from": "artifacts.project_id","to": "projects.id","type": "many_to_one","cascade": "DELETE"},{"from": "workflow_steps.project_id","to": "projects.id","type": "many_to_one","cascade": "DELETE"}],
        "er_diagram": "users(1) ──< projects(N) ──< artifacts(N)\n               └──< workflow_steps(N)",
        "migration_command": "alembic upgrade head",
    }


# ──────────────────────────────────────────────
# API AGENT
# ──────────────────────────────────────────────
def run_api_agent(prompt: str) -> dict[str, Any]:
    logs = ["API agent started"]
    try:
        output = _research_then_generate(
            search_queries=[
                "REST API design best practices FastAPI authentication CRUD 2024",
                "OpenAPI Swagger documentation HTTP status codes error handling patterns",
                "API versioning pagination rate limiting security best practices",
            ],
            system_prompt=(
                "You are a senior API designer. Design a complete REST API specification. "
                "Return ONLY valid JSON with keys: "
                "base_url (string), authentication (string), "
                "endpoints (array of {path, method, description, auth: bool, request_body?, response}), "
                "swagger_docs (string), "
                "error_responses (object mapping status codes to descriptions). "
                "Include all CRUD operations, auth endpoints, and AI agent endpoints."
            ),
            user_prompt=prompt or "Design complete REST API for Sketch2Startup AI (projects, uploads, analyze, 8 AI agents)",
            logs=logs,
        )
        logs.append("API specification completed")
        return {"agent": "api", "status": "completed", "progress": 100, "logs": logs, "output": output}
    except Exception as e:
        logs.append(f"AI unavailable ({e}), using mock")
        return {"agent": "api", "status": "completed", "progress": 100, "logs": logs, "output": _mock_api()}

def _mock_api() -> dict:
    return {
        "base_url": "/api",
        "authentication": "Firebase JWT Bearer token",
        "endpoints": [
            {"path": "/health",         "method": "GET",    "description": "Health check",         "auth": False},
            {"path": "/projects",       "method": "POST",   "description": "Create project",       "auth": True},
            {"path": "/projects",       "method": "GET",    "description": "List projects",        "auth": True},
            {"path": "/projects/{id}",  "method": "GET",    "description": "Get project",          "auth": True},
            {"path": "/projects/{id}",  "method": "PUT",    "description": "Update project",       "auth": True},
            {"path": "/projects/{id}",  "method": "DELETE", "description": "Delete project",       "auth": True},
            {"path": "/uploads",        "method": "POST",   "description": "Upload file",          "auth": True},
            {"path": "/analyze",        "method": "POST",   "description": "Analyze sketch",       "auth": True},
            {"path": "/prd",            "method": "POST",   "description": "Run Planner agent",    "auth": True},
            {"path": "/architecture",   "method": "POST",   "description": "Run Architect agent",  "auth": True},
            {"path": "/database",       "method": "POST",   "description": "Run Database agent",   "auth": True},
            {"path": "/apis",           "method": "POST",   "description": "Run API agent",        "auth": True},
            {"path": "/frontend",       "method": "POST",   "description": "Run Frontend agent",   "auth": True},
            {"path": "/backend",        "method": "POST",   "description": "Run Backend agent",    "auth": True},
            {"path": "/tests",          "method": "POST",   "description": "Run Tester agent",     "auth": True},
            {"path": "/docs",           "method": "POST",   "description": "Run Docs agent",       "auth": True},
        ],
        "swagger_docs": "http://localhost:8000/docs",
        "error_responses": {"400": "Bad Request", "401": "Unauthorized", "404": "Not Found", "422": "Validation Error", "500": "Server Error"},
    }


# ──────────────────────────────────────────────
# BUILDER AGENT
# ──────────────────────────────────────────────
def run_builder_agent(prompt: str) -> dict[str, Any]:
    logs = ["Builder agent started"]
    try:
        output = _research_then_generate(
            search_queries=[
                "React 19 TypeScript project structure best practices components hooks 2024",
                "FastAPI Python project structure service layer repository pattern 2024",
                "Tailwind CSS shadcn UI component design system dark mode",
            ],
            system_prompt=(
                "You are a senior full-stack developer. Generate a complete code generation plan. "
                "Return ONLY valid JSON with keys: "
                "frontend (object: framework, components[], pages[], styling, state_management, routing, code_editor), "
                "backend (object: framework, endpoints[], models[], services[], validation, database), "
                "integration_points (array of strings), "
                "file_structure (array of strings showing folder tree). "
                "Include every file and folder needed."
            ),
            user_prompt=prompt or "Generate full code plan for React 19 + FastAPI + Firebase + Tavily + Groq SaaS app",
            logs=logs,
        )
        logs.append("Code generation plan completed")
        return {"agent": "builder", "status": "completed", "progress": 100, "logs": logs, "output": output}
    except Exception as e:
        logs.append(f"AI unavailable ({e}), using mock")
        return {"agent": "builder", "status": "completed", "progress": 100, "logs": logs, "output": _mock_builder()}

def _mock_builder() -> dict:
    return {
        "frontend": {"framework": "React 19 + TypeScript + Vite", "components": ["Navbar","Dashboard","Upload","ProjectCard","GeneratorPanel","AgentStatus","WorkflowTimeline"], "pages": ["Landing","Auth","Dashboard","Upload","PRD","Generator","Settings"], "styling": "Tailwind CSS + shadcn/ui + Framer Motion", "state_management": "React Hooks + TanStack Query", "routing": "React Router v6 with protected routes", "code_editor": "Monaco Editor"},
        "backend": {"framework": "FastAPI 0.116 + Python 3.12", "endpoints": ["POST /projects","GET /projects","POST /uploads","POST /analyze","POST /prd","POST /architecture","POST /database","POST /apis","POST /frontend","POST /backend","POST /tests","POST /docs"], "models": ["User","Project","Artifact","WorkflowStep"], "services": ["agents.py (Tavily+Groq)","firebase.py (auth+storage)"], "validation": "Pydantic v2", "database": "SQLAlchemy 2.0 + Alembic"},
        "integration_points": ["Firebase Auth → JWT validation", "Firebase Storage → file CDN", "Tavily → agent research", "Groq → JSON generation"],
        "file_structure": ["client/src/pages/", "client/src/components/", "client/src/hooks/", "client/src/lib/", "server/app/api/", "server/app/services/", "server/app/models.py"],
    }


# Tester Agent
def run_tester_agent(prompt):
    logs = ["Tester agent started"]
    try:
        output = _research_then_generate(
            [
                "pytest FastAPI testing best practices async fixtures 2024",
                "Vitest React Testing Library unit integration test patterns",
                "API test coverage CI/CD automation strategy",
            ],
            (
                "You are a QA engineer. Return ONLY valid JSON with these keys: "
                "test_framework (string), coverage_target (string), "
                "unit_tests (array of strings), integration_tests (array), "
                "api_tests (array), "
                "test_examples (object with example_test containing pytest code), "
                "testing_commands (array of CLI strings)."
            ),
            prompt or "Tests for FastAPI: auth, projects CRUD, file upload, 8 AI agents",
            logs,
        )
        logs.append("Test suite completed")
        return {"agent": "tester", "status": "completed", "progress": 100, "logs": logs, "output": output}
    except Exception as e:
        logs.append(f"AI unavailable ({e}), mock used")
        return {"agent": "tester", "status": "completed", "progress": 100, "logs": logs, "output": {
            "test_framework": "pytest + httpx + Vitest",
            "coverage_target": "80%+",
            "unit_tests": ["tests/test_models.py", "tests/test_schemas.py", "tests/test_agents.py"],
            "integration_tests": ["tests/test_auth_flow.py", "tests/test_project_flow.py"],
            "api_tests": ["tests/test_projects_api.py", "tests/test_agents_api.py"],
            "test_examples": {"example_test": "from fastapi.testclient import TestClient\nfrom app.main import app\nclient = TestClient(app)\n\ndef test_health():\n    r = client.get('/health')\n    assert r.status_code == 200\n    assert r.json()['status'] == 'ok'\n"},
            "testing_commands": ["pytest tests/ -v", "pytest tests/ --cov=app --cov-report=html"],
        }}


# Documentation Agent
def run_documentation_agent(prompt):
    logs = ["Documentation agent started"]
    try:
        output = _research_then_generate(
            [
                "README documentation best practices open source 2024",
                "API documentation OpenAPI developer guide structure",
                "software installation guide environment variables",
            ],
            (
                "You are a technical writer. Return ONLY valid JSON with keys: "
                "readme (object: title, description, badges[], sections[]), "
                "api_documentation (object: format, url, description), "
                "installation_guide (object: prerequisites[], backend_steps[], frontend_steps[]), "
                "environment_variables (object: backend[], frontend[]), "
                "deployment_guide (object: frontend_vercel, backend_render, docker)."
            ),
            prompt or "Docs for Sketch2Startup AI: React 19 + FastAPI + Groq + Tavily + Firebase",
            logs,
        )
        logs.append("Documentation completed")
        return {"agent": "documentation", "status": "completed", "progress": 100, "logs": logs, "output": output}
    except Exception as e:
        logs.append(f"AI unavailable ({e}), mock used")
        return {"agent": "documentation", "status": "completed", "progress": 100, "logs": logs, "output": {
            "readme": {"title": "Sketch2Startup AI", "description": "Transform sketches into production apps with Groq + Tavily AI agents", "badges": ["Python 3.12", "React 19", "FastAPI", "Groq", "Tavily", "Firebase"], "sections": ["Overview", "Features", "Architecture", "Installation", "Usage", "API Reference", "Deployment"]},
            "api_documentation": {"format": "OpenAPI 3.0 / Swagger", "url": "http://localhost:8000/docs", "description": "22 REST endpoints documented with schemas"},
            "installation_guide": {
                "prerequisites": ["Python 3.12+", "Node.js 18+", "Firebase project", "Groq API key (console.groq.com)", "Tavily API key (tavily.com)"],
                "backend_steps": ["python -m venv .venv", "pip install -r requirements.txt", "uvicorn app.main:app --reload --port 8000"],
                "frontend_steps": ["npm install", "npm run dev"],
            },
            "environment_variables": {
                "backend": ["DATABASE_URL", "TAVILY_API_KEY", "GROQ_API_KEY", "FIREBASE_PROJECT_ID", "FIREBASE_SERVICE_ACCOUNT_JSON", "CORS_ORIGINS"],
                "frontend": ["VITE_API_URL", "VITE_FIREBASE_API_KEY", "VITE_FIREBASE_AUTH_DOMAIN", "VITE_FIREBASE_PROJECT_ID"],
            },
            "deployment_guide": {
                "frontend_vercel": "Connect GitHub to Vercel, set VITE_* env vars, auto-deploy on push",
                "backend_render": "Connect GitHub to Render, set env vars, uvicorn start command",
                "docker": "docker compose up -d",
            },
        }}


# Deployment Agent
def run_deployment_agent(prompt):
    logs = ["Deployment agent started"]
    try:
        output = _research_then_generate(
            [
                "Vercel React SPA deployment configuration 2024",
                "Render Python FastAPI Docker deployment config",
                "Docker multi-stage build optimization production",
            ],
            (
                "You are a DevOps engineer. Return ONLY valid JSON with keys: "
                "docker (object: backend_dockerfile, frontend_dockerfile, optimization_tips[]), "
                "vercel (object: build_command, output_directory, env_vars[], deploy_command, notes), "
                "render (object: start_command, health_check_path, env_vars[], plan, notes), "
                "ci_cd (object: platform, workflow_file, stages[], triggers), "
                "monitoring (object: logging, uptime_check, error_tracking, metrics)."
            ),
            prompt or "Vercel + Render + Docker for React 19 frontend + FastAPI backend + PostgreSQL",
            logs,
        )
        logs.append("Deployment config completed")
        return {"agent": "deployment", "status": "completed", "progress": 100, "logs": logs, "output": output}
    except Exception as e:
        logs.append(f"AI unavailable ({e}), mock used")
        return {"agent": "deployment", "status": "completed", "progress": 100, "logs": logs, "output": {
            "docker": {
                "backend_dockerfile": "FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nEXPOSE 8000\nCMD [\"uvicorn\",\"app.main:app\",\"--host\",\"0.0.0.0\",\"--port\",\"8000\"]",
                "frontend_dockerfile": "FROM node:18-alpine AS build\nWORKDIR /app\nCOPY package*.json .\nRUN npm ci\nCOPY . .\nRUN npm run build\nFROM nginx:alpine\nCOPY --from=build /app/dist /usr/share/nginx/html\nEXPOSE 80",
                "optimization_tips": ["Multi-stage builds", "Pin dependency versions", "Use .dockerignore", "Non-root user"],
            },
            "vercel": {
                "build_command": "npm run build",
                "output_directory": "dist",
                "env_vars": ["VITE_API_URL", "VITE_FIREBASE_API_KEY", "VITE_FIREBASE_PROJECT_ID"],
                "deploy_command": "vercel --prod",
                "notes": "Add all VITE_* env vars in Vercel dashboard before first deploy",
            },
            "render": {
                "start_command": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
                "health_check_path": "/health",
                "env_vars": ["DATABASE_URL", "TAVILY_API_KEY", "GROQ_API_KEY", "FIREBASE_PROJECT_ID", "FIREBASE_SERVICE_ACCOUNT_JSON", "CORS_ORIGINS"],
                "plan": "Starter ($7/mo) or Standard ($25/mo)",
                "notes": "Set cwd to server/ in Render build settings",
            },
            "ci_cd": {
                "platform": "GitHub Actions",
                "workflow_file": ".github/workflows/deploy.yml",
                "stages": ["lint", "test", "build", "deploy-staging", "deploy-prod"],
                "triggers": "push to main triggers deploy; PR triggers test only",
            },
            "monitoring": {
                "logging": "Structured JSON logs via uvicorn --log-config",
                "uptime_check": "GET /health — use UptimeRobot free tier",
                "error_tracking": "Set SENTRY_DSN env var for Sentry integration",
                "metrics": "/metrics endpoint for Prometheus scraping",
            },
        }}
