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

def _gemini_vision(image_bytes: bytes, content_type: str, filename: str) -> dict | None:
    """Use Gemini Vision for image analysis."""
    if not settings.gemini_api_key:
        return None
    try:
        import google.generativeai as genai
        from PIL import Image
        import io
        
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Prompt for UI/sketch analysis
        prompt = """
        Analyze this UI sketch/wireframe/mockup and provide a detailed breakdown.
        
        Return a JSON object with this exact structure:
        {
            "app_type": "e.g., e-commerce, dashboard, social media, etc.",
            "app_name": "suggested name for this app",
            "elements": [
                {
                    "type": "navbar/sidebar/header/footer/card/form/button/input/table/etc",
                    "label": "text content if visible",
                    "position": "top/bottom/left/right/center",
                    "confidence": 0.0-1.0,
                    "attributes": {"additional details": "value"}
                }
            ],
            "layout": {
                "type": "single_column/two_column/grid/dashboard/landing_page",
                "sections": ["header", "hero", "features", "content", "footer"],
                "responsive": true/false
            },
            "components": ["ComponentName1", "ComponentName2"],
            "features": ["feature1 detected from sketch", "feature2 detected"],
            "user_flows": ["flow1: user action -> result", "flow2"],
            "data_requirements": ["data type1 needed", "data type2"],
            "color_scheme": {"primary": "hex or description", "secondary": "hex or description"},
            "suggestions": ["improvement1", "improvement2"]
        }
        
        Be specific and detailed. Focus on detecting actual UI elements, user interactions, and data needs.
        """
        
        response = model.generate_content([prompt, image])
        text = response.text
        
        # Extract JSON from response
        import re
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            return json.loads(json_match.group())
        else:
            # Fallback: try to parse entire response as JSON
            return json.loads(text)
            
    except Exception as e:
        print(f"Gemini vision error: {e}")
        return None


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
def run_agent(name: str, prompt: str = "", analysis: dict | None = None) -> dict[str, Any]:
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
        return fn(prompt, analysis)
    return {"agent": name, "status": "error", "error": f"Unknown agent: {name}", "logs": []}


def analyze_upload(filename: str, image_bytes: bytes | None = None, content_type: str | None = None) -> dict[str, Any]:
    """Analyze uploaded sketch using Gemini Vision with fallback to text analysis."""

    # Try Gemini Vision first for actual image analysis
    if image_bytes and content_type and content_type.startswith("image/"):
        gemini_result = _gemini_vision(image_bytes, content_type, filename)
        if gemini_result:
            # Transform Gemini result to match expected structure
            return {
                "elements": gemini_result.get("elements", []),
                "layout": gemini_result.get("layout", {}),
                "components": gemini_result.get("components", []),
                "features": gemini_result.get("features", []),
                "user_flows": gemini_result.get("user_flows", []),
                "data_requirements": gemini_result.get("data_requirements", []),
                "app_type": gemini_result.get("app_type", "web application"),
                "app_name": gemini_result.get("app_name", filename.rsplit(".", 1)[0]),
                "app_description": f"A {gemini_result.get('app_type', 'web')} application: {gemini_result.get('app_name', filename.rsplit('.', 1)[0])}",
                "color_scheme": gemini_result.get("color_scheme", {}),
                "suggestions": gemini_result.get("suggestions", []),
                "source": filename,
                "analyzed_by": "gemini-vision",
            }

    # Fallback: use Groq text to generate a description based on filename + Tavily context
    try:
        app_name = filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ")
        results = _search(f"UI wireframe {app_name} web app design components", 3)
        ctx = _extract_text(results, 600)

        # Ask Groq to guess what app this is based on filename + context
        if _groq():
            desc = _groq_text(
                "You analyze UI sketches. Given a filename and optional research context, describe the app in one sentence.",
                f"Filename: {filename}\nContext: {ctx[:400]}",
                max_tokens=100,
            ).strip()
        else:
            desc = f"A {app_name} web application"

        base = _mock_analysis(filename)
        base["app_description"] = desc
        base["analyzed_by"] = "text-analysis"
        return base
    except Exception:
        base = _mock_analysis(filename)
        base["app_description"] = f"A web application: {filename.rsplit('.', 1)[0]}"
        base["analyzed_by"] = "mock"
        return base


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
        "app_description": f"A web application based on the uploaded sketch: {filename}",
        "analyzed_by": "mock",
    }


# ──────────────────────────────────────────────
# PLANNER AGENT — PRD Generator
# ──────────────────────────────────────────────
def run_planner_agent(prompt: str, analysis: dict | None = None) -> dict[str, Any]:
    logs = ["Planner agent started"]
    
    # Extract information from sketch analysis if available
    if analysis:
        app_type = analysis.get("app_type", "web application")
        app_name = analysis.get("app_name", "AI-powered SaaS application")
        features = analysis.get("features", [])
        user_flows = analysis.get("user_flows", [])
        data_requirements = analysis.get("data_requirements", [])
        
        app_desc = f"{app_type} application: {app_name}"
        if features:
            app_desc += f" with features: {', '.join(features[:5])}"
    else:
        app_desc = prompt or "AI-powered SaaS application"
        app_type = "web application"
        app_name = "AI-Powered Application"
        features = []
        user_flows = []
        data_requirements = []
    
    try:
        # Build context from sketch analysis
        analysis_context = ""
        if analysis:
            analysis_context = f"""
            Sketch Analysis Results:
            - App Type: {app_type}
            - App Name: {app_name}
            - Detected Features: {', '.join(features) if features else 'None'}
            - User Flows: {', '.join(user_flows) if user_flows else 'None'}
            - Data Requirements: {', '.join(data_requirements) if data_requirements else 'None'}
            - UI Elements: {len(analysis.get('elements', []))} detected
            - Layout: {analysis.get('layout', {}).get('type', 'unknown')}
            """
        
        output = _research_then_generate(
            search_queries=[
                f"product requirements document PRD template {app_type} startup",
                f"user stories acceptance criteria {app_type} software product",
                "PRD best practices functional non-functional requirements 2024",
            ],
            system_prompt=(
                "You are a senior product manager. Using the research context and sketch analysis provided, "
                "generate a comprehensive Product Requirements Document (PRD). "
                "Return ONLY valid JSON with these exact keys: "
                "project_name (string), problem_statement (string), solution (string), "
                "target_users (array of strings), user_stories (array of strings), "
                "functional_requirements (array of strings), non_functional_requirements (array of strings), "
                "tech_stack (array of strings), acceptance_criteria (array of strings), future_scope (array of strings). "
                "Make it specific and detailed based on the sketch analysis and research context. "
                "The user stories and functional requirements should reflect the detected features and user flows."
            ),
            user_prompt=f"Generate a complete PRD for: {app_desc}\n\n{analysis_context}",
            logs=logs,
        )
        logs.append("PRD generation completed")
        return {"agent": "planner", "status": "completed", "progress": 100, "logs": logs, "output": output}
    except Exception as e:
        logs.append(f"AI unavailable ({e}), using structured mock with analysis")
        return {"agent": "planner", "status": "completed", "progress": 100, "logs": logs, "output": _mock_prd(app_desc, analysis)}

def _mock_prd(app_desc: str = "", analysis: dict | None = None) -> dict:
    # Extract information from analysis if available
    if analysis:
        app_type = analysis.get("app_type", "web application")
        app_name = analysis.get("app_name", "AI-Powered SaaS")
        features = analysis.get("features", [])
        user_flows = analysis.get("user_flows", [])
        data_requirements = analysis.get("data_requirements", [])
        
        name = app_name
        problem = f"Users need a {app_type} application with features like {', '.join(features[:3]) if features else 'modern functionality'}"
        solution = f"A {app_type} platform called {app_name} that provides {', '.join(features[:5]) if features else 'core functionality'}"
        
        # Generate user stories from detected flows
        if user_flows:
            user_stories = [f"As a user, I want to {flow}" for flow in user_flows[:5]]
        else:
            user_stories = [
                "As a user, I want to access the main dashboard",
                "As a user, I want to manage my account settings",
                "As a user, I want to view and interact with content",
                "As a user, I want to perform key actions efficiently",
            ]
        
        # Generate functional requirements from features
        if features:
            functional_reqs = features[:8]
        else:
            functional_reqs = ["User authentication", "Dashboard interface", "Content management", "User profile", "Search functionality"]
        
        # Add data requirements if available
        if data_requirements:
            functional_reqs.extend([f"Data management for {req}" for req in data_requirements[:3]])
    else:
        name = app_desc.strip().title() if app_desc else "AI-Powered SaaS"
        problem = f"Users building {name} face fragmented tooling and lack AI-powered automation."
        solution = f"A full-stack {name} platform with modern features."
        user_stories = [
            "As a user, I want to access the application easily",
            "As a user, I want to manage my data",
            "As a user, I want to perform key actions",
            "As a user, I want to export my data",
        ]
        functional_reqs = ["User authentication", "Dashboard interface", "Content management", "User profile", "Search functionality"]
    
    return {
        "project_name": name or "AI-Powered Application",
        "problem_statement": problem,
        "solution": solution,
        "target_users": ["End users", "Administrators", "Business users", "Technical teams"],
        "user_stories": user_stories,
        "functional_requirements": functional_reqs,
        "non_functional_requirements": ["API response < 2 seconds", "99.9% uptime", "1000+ concurrent users", "HTTPS encryption", "GDPR compliant", "Mobile-responsive"],
        "tech_stack": ["React 19 + TypeScript + Tailwind CSS", "FastAPI + Python 3.12", "PostgreSQL / SQLite", "Firebase Auth + Storage", "Modern AI APIs", "Vercel + Render"],
        "acceptance_criteria": ["Users can access the application", "Core features work as expected", "Data is properly managed", "UI is responsive", "Performance meets requirements"],
        "future_scope": ["Advanced features", "Real-time updates", "Mobile applications", "Integration capabilities", "Analytics dashboard"],
    }


# ──────────────────────────────────────────────
# ARCHITECT AGENT
# ──────────────────────────────────────────────
def run_architect_agent(prompt: str, analysis: dict | None = None) -> dict[str, Any]:
    logs = ["Architect agent started"]
    
    # Extract information from sketch analysis if available
    app_type = analysis.get("app_type", "web application") if analysis else "web application"
    app_name = analysis.get("app_name", "Application") if analysis else "Application"
    features = analysis.get("features", []) if analysis else []
    data_requirements = analysis.get("data_requirements", []) if analysis else []
    layout = analysis.get("layout", {}).get("type", "responsive") if analysis else "responsive"
    
    try:
        # Build context from sketch analysis
        analysis_context = ""
        if analysis:
            analysis_context = f"""
            Sketch Analysis Results:
            - App Type: {app_type}
            - App Name: {app_name}
            - Features: {', '.join(features) if features else 'Standard features'}
            - Data Requirements: {', '.join(data_requirements) if data_requirements else 'Standard data models'}
            - Layout Type: {layout}
            - UI Components: {len(analysis.get('components', []))} detected
            """
        
        output = _research_then_generate(
            search_queries=[
                f"{app_type} architecture best practices scalability 2024",
                "React FastAPI PostgreSQL Firebase system design patterns",
                "software architecture security scalability cloud deployment",
            ],
            system_prompt=(
                "You are a solutions architect. Using the research context and sketch analysis, design a production-ready system architecture. "
                "Return ONLY valid JSON with keys: "
                "architecture_type (string), "
                "components (array of {name, technology, responsibilities: string[]}), "
                "data_flow (array of strings describing each step), "
                "security_considerations (array of strings), "
                "scalability_plan (array of strings). "
                "Be specific with technologies and patterns. The architecture should support the detected features and data requirements."
            ),
            user_prompt=f"Design architecture for a {app_type} application called {app_name}\n\n{analysis_context}",
            logs=logs,
        )
        logs.append("Architecture design completed")
        return {"agent": "architect", "status": "completed", "progress": 100, "logs": logs, "output": output}
    except Exception as e:
        logs.append(f"AI unavailable ({e}), using mock with analysis")
        return {"agent": "architect", "status": "completed", "progress": 100, "logs": logs, "output": _mock_arch(analysis)}

def _mock_arch(analysis: dict | None = None) -> dict:
    # Extract information from analysis if available
    if analysis:
        app_type = analysis.get("app_type", "web application")
        app_name = analysis.get("app_name", "Application")
        features = analysis.get("features", [])
        data_requirements = analysis.get("data_requirements", [])
        
        # Customize components based on app type
        if "e-commerce" in app_type.lower():
            components = [
                {"name": "React Frontend", "technology": "React 19 + TypeScript + Vite", "responsibilities": ["Product catalog UI", "Shopping cart", "Checkout flow", "User dashboard"]},
                {"name": "FastAPI Backend", "technology": "Python 3.12 + FastAPI", "responsibilities": ["Product management", "Order processing", "Payment integration", "Inventory management"]},
                {"name": "PostgreSQL DB", "technology": "PostgreSQL 15", "responsibilities": ["Product catalog", "User orders", "Payment transactions", "Inventory data"]},
                {"name": "Firebase Auth", "technology": "Firebase Authentication", "responsibilities": ["User authentication", "Profile management", "Session handling"]},
                {"name": "Payment Gateway", "technology": "Stripe/PayPal API", "responsibilities": ["Payment processing", "Refund handling", "Transaction logging"]},
            ]
            data_flow = ["User browses products → Frontend catalog", "User adds to cart → Frontend state", "User checkout → Payment processing", "Order confirmation → Database storage", "Inventory update → Backend logic"]
        elif "dashboard" in app_type.lower():
            components = [
                {"name": "React Frontend", "technology": "React 19 + TypeScript + Vite", "responsibilities": ["Dashboard widgets", "Data visualization", "Real-time updates", "User settings"]},
                {"name": "FastAPI Backend", "technology": "Python 3.12 + FastAPI", "responsibilities": ["Data aggregation", "Analytics processing", "API endpoints", "Real-time events"]},
                {"name": "PostgreSQL DB", "technology": "PostgreSQL 15", "responsibilities": ["Metrics storage", "User data", "Analytics data", "Configuration"]},
                {"name": "Firebase Auth", "technology": "Firebase Authentication", "responsibilities": ["User authentication", "Role-based access", "Session management"]},
                {"name": "Cache Layer", "technology": "Redis", "responsibilities": ["Dashboard caching", "Real-time data", "Session storage"]},
            ]
            data_flow = ["User requests dashboard → Backend data fetch", "Data aggregation from multiple sources", "Cached data served when available", "Real-time updates via WebSocket", "Frontend renders visualizations"]
        else:
            components = [
                {"name": "React Frontend", "technology": "React 19 + TypeScript + Vite", "responsibilities": ["UI rendering", "State management", "API communication", f"{app_name} features"]},
                {"name": "FastAPI Backend", "technology": "Python 3.12 + FastAPI", "responsibilities": ["REST API", "Business logic", "Data processing", f"{app_name} core logic"]},
                {"name": "PostgreSQL DB", "technology": "PostgreSQL 15 / SQLite (dev)", "responsibilities": ["Data persistence", "Relational queries"] + ([f"{req} storage" for req in data_requirements[:3]] if data_requirements else [])},
                {"name": "Firebase Auth", "technology": "Firebase Authentication", "responsibilities": ["User auth", "JWT tokens", "Session management"]},
                {"name": "Firebase Storage", "technology": "Firebase Cloud Storage", "responsibilities": ["File uploads", "CDN delivery", "Asset management"]},
            ]
            data_flow = ["User interacts with UI → Frontend state update", "API calls to backend → Business logic", "Database operations → Data persistence", "Authentication checks → Firebase", "File uploads → Firebase Storage"]
    else:
        components = [
            {"name": "React Frontend", "technology": "React 19 + TypeScript + Vite", "responsibilities": ["UI rendering", "State management", "API communication"]},
            {"name": "FastAPI Backend", "technology": "Python 3.12 + FastAPI", "responsibilities": ["REST API", "Business logic", "AI orchestration"]},
            {"name": "PostgreSQL DB", "technology": "PostgreSQL 15 / SQLite (dev)", "responsibilities": ["Data persistence", "Relational queries"]},
            {"name": "Firebase Auth", "technology": "Firebase Authentication", "responsibilities": ["User auth", "JWT tokens", "Session management"]},
            {"name": "Firebase Storage", "technology": "Firebase Cloud Storage", "responsibilities": ["File uploads", "CDN delivery"]},
        ]
        data_flow = ["User interacts with UI → API calls", "Backend processes requests → Database operations", "Authentication via Firebase", "File storage via Firebase", "Response returned to frontend"]
    
    return {
        "architecture_type": "Modular Monolith with Microservices-ready design",
        "components": components,
        "data_flow": data_flow,
        "security_considerations": ["Firebase JWT on all protected routes", "HTTPS/TLS encryption", "CORS whitelist", "Pydantic input validation", "SQLAlchemy ORM (no raw SQL)", "File type validation", "Rate limiting", "Input sanitization"],
        "scalability_plan": ["Horizontal FastAPI scaling", "DB read replicas", "Firebase CDN globally", "Redis caching layer", "Celery task queue for background jobs", "Database connection pooling"],
    }


# ──────────────────────────────────────────────
# DATABASE AGENT
# ──────────────────────────────────────────────
def run_database_agent(prompt: str, analysis: dict | None = None) -> dict[str, Any]:
    logs = ["Database agent started"]
    
    # Extract information from sketch analysis if available
    app_type = analysis.get("app_type", "web application") if analysis else "web application"
    app_name = analysis.get("app_name", "Application") if analysis else "Application"
    features = analysis.get("features", []) if analysis else []
    data_requirements = analysis.get("data_requirements", []) if analysis else []
    elements = analysis.get("elements", []) if analysis else []
    
    try:
        # Build context from sketch analysis
        analysis_context = ""
        if analysis:
            # Detect potential data models from UI elements
            detected_models = []
            for element in elements:
                el_type = element.get("type", "").lower()
                if "form" in el_type:
                    detected_models.append("user_submissions")
                if "table" in el_type:
                    detected_models.append("data_records")
                if "card" in el_type:
                    detected_models.append("content_items")
            
            analysis_context = f"""
            Sketch Analysis Results:
            - App Type: {app_type}
            - App Name: {app_name}
            - Features: {', '.join(features) if features else 'Standard features'}
            - Data Requirements: {', '.join(data_requirements) if data_requirements else 'Standard data models'}
            - Detected UI Elements: {', '.join([e.get('type', 'unknown') for e in elements])}
            - Potential Data Models: {', '.join(detected_models) if detected_models else 'users, content, settings'}
            """
        
        output = _research_then_generate(
            search_queries=[
                f"{app_type} database schema design best practices 2024",
                "PostgreSQL schema design indexing strategies foreign keys",
                "SQLAlchemy Alembic migration best practices production",
            ],
            system_prompt=(
                "You are a database architect. Design a production-ready database schema based on the sketch analysis. "
                "Return ONLY valid JSON with keys: "
                "database_type (string), "
                "tables (array of {name, columns: [{name, type, constraints: string[]}], indexes: string[]}), "
                "relationships (array of {from, to, type, cascade}), "
                "er_diagram (string with ASCII diagram), "
                "migration_command (string). "
                "Include proper indexes, foreign keys, and constraints. The schema should support the detected features and data requirements."
            ),
            user_prompt=f"Design PostgreSQL schema for {app_name} ({app_type})\n\n{analysis_context}",
            logs=logs,
        )
        logs.append("Schema design completed")
        return {"agent": "database", "status": "completed", "progress": 100, "logs": logs, "output": output}
    except Exception as e:
        logs.append(f"AI unavailable ({e}), using mock with analysis")
        return {"agent": "database", "status": "completed", "progress": 100, "logs": logs, "output": _mock_db(analysis)}

def _mock_db(analysis: dict | None = None) -> dict:
    # Base tables for any application
    base_tables = [
        {"name": "users", "columns": [{"name": "id","type": "UUID","constraints": ["PK"]},{"name": "email","type": "VARCHAR(255)","constraints": ["UNIQUE","NOT NULL"]},{"name": "firebase_uid","type": "VARCHAR(255)","constraints": ["UNIQUE"]},{"name": "created_at","type": "TIMESTAMP","constraints": ["DEFAULT NOW()"]}], "indexes": ["idx_users_email"]},
    ]
    
    # Generate additional tables based on analysis
    if analysis:
        app_type = analysis.get("app_type", "web application")
        features = analysis.get("features", [])
        data_requirements = analysis.get("data_requirements", [])
        elements = analysis.get("elements", [])
        
        # Add app-specific tables based on type
        if "e-commerce" in app_type.lower():
            additional_tables = [
                {"name": "products", "columns": [{"name": "id","type": "UUID","constraints": ["PK"]},{"name": "name","type": "VARCHAR(255)","constraints": ["NOT NULL"]},{"name": "description","type": "TEXT"},{"name": "price","type": "DECIMAL(10,2)","constraints": ["NOT NULL"]},{"name": "stock","type": "INTEGER","constraints": ["DEFAULT 0"]},{"name": "category_id","type": "UUID","constraints": ["FK → categories.id"]}], "indexes": ["idx_products_category"]},
                {"name": "categories", "columns": [{"name": "id","type": "UUID","constraints": ["PK"]},{"name": "name","type": "VARCHAR(100)","constraints": ["NOT NULL"]},{"name": "parent_id","type": "UUID","constraints": ["FK → categories.id"]}], "indexes": ["idx_categories_parent"]},
                {"name": "orders", "columns": [{"name": "id","type": "UUID","constraints": ["PK"]},{"name": "user_id","type": "UUID","constraints": ["FK → users.id"]},{"name": "status","type": "VARCHAR(50)","constraints": ["DEFAULT 'pending'"]},{"name": "total","type": "DECIMAL(10,2)","constraints": ["NOT NULL"]},{"name": "created_at","type": "TIMESTAMP","constraints": ["DEFAULT NOW()"]}], "indexes": ["idx_orders_user","idx_orders_status"]},
                {"name": "order_items", "columns": [{"name": "id","type": "UUID","constraints": ["PK"]},{"name": "order_id","type": "UUID","constraints": ["FK → orders.id"]},{"name": "product_id","type": "UUID","constraints": ["FK → products.id"]},{"name": "quantity","type": "INTEGER","constraints": ["NOT NULL"]},{"name": "price","type": "DECIMAL(10,2)","constraints": ["NOT NULL"]}], "indexes": ["idx_order_items_order","idx_order_items_product"]},
            ]
            relationships = [
                {"from": "orders.user_id","to": "users.id","type": "many_to_one","cascade": "DELETE"},
                {"from": "order_items.order_id","to": "orders.id","type": "many_to_one","cascade": "DELETE"},
                {"from": "order_items.product_id","to": "products.id","type": "many_to_one","cascade": "RESTRICT"},
                {"from": "products.category_id","to": "categories.id","type": "many_to_one","cascade": "SET NULL"},
            ]
            er_diagram = "users(1) ──< orders(N) ──< order_items(N)\ncategories(1) ──< products(N) ──< order_items(N)"
        elif "dashboard" in app_type.lower():
            additional_tables = [
                {"name": "metrics", "columns": [{"name": "id","type": "UUID","constraints": ["PK"]},{"name": "user_id","type": "UUID","constraints": ["FK → users.id"]},{"name": "metric_name","type": "VARCHAR(100)","constraints": ["NOT NULL"]},{"name": "metric_value","type": "DECIMAL(15,2)"},{"name": "timestamp","type": "TIMESTAMP","constraints": ["DEFAULT NOW()"]}], "indexes": ["idx_metrics_user","idx_metrics_timestamp"]},
                {"name": "reports", "columns": [{"name": "id","type": "UUID","constraints": ["PK"]},{"name": "user_id","type": "UUID","constraints": ["FK → users.id"]},{"name": "name","type": "VARCHAR(255)","constraints": ["NOT NULL"]},{"name": "config","type": "JSONB"},{"name": "created_at","type": "TIMESTAMP","constraints": ["DEFAULT NOW()"]}], "indexes": ["idx_reports_user"]},
                {"name": "widgets", "columns": [{"name": "id","type": "UUID","constraints": ["PK"]},{"name": "report_id","type": "UUID","constraints": ["FK → reports.id"]},{"name": "widget_type","type": "VARCHAR(50)"},{"name": "position","type": "JSONB"},{"name": "config","type": "JSONB"}], "indexes": ["idx_widgets_report"]},
            ]
            relationships = [
                {"from": "metrics.user_id","to": "users.id","type": "many_to_one","cascade": "DELETE"},
                {"from": "reports.user_id","to": "users.id","type": "many_to_one","cascade": "DELETE"},
                {"from": "widgets.report_id","to": "reports.id","type": "many_to_one","cascade": "DELETE"},
            ]
            er_diagram = "users(1) ──< metrics(N)\nusers(1) ──< reports(N) ──< widgets(N)"
        else:
            # Generic tables based on detected elements
            additional_tables = [
                {"name": "content", "columns": [{"name": "id","type": "UUID","constraints": ["PK"]},{"name": "user_id","type": "UUID","constraints": ["FK → users.id"]},{"name": "title","type": "VARCHAR(255)","constraints": ["NOT NULL"]},{"name": "body","type": "TEXT"},{"name": "status","type": "VARCHAR(50)","constraints": ["DEFAULT 'draft'"]},{"name": "created_at","type": "TIMESTAMP","constraints": ["DEFAULT NOW()"]}], "indexes": ["idx_content_user","idx_content_status"]},
                {"name": "settings", "columns": [{"name": "id","type": "UUID","constraints": ["PK"]},{"name": "user_id","type": "UUID","constraints": ["FK → users.id"]},{"name": "key","type": "VARCHAR(100)","constraints": ["NOT NULL"]},{"name": "value","type": "JSONB"}], "indexes": ["idx_settings_user_key"]},
            ]
            relationships = [
                {"from": "content.user_id","to": "users.id","type": "many_to_one","cascade": "DELETE"},
                {"from": "settings.user_id","to": "users.id","type": "many_to_one","cascade": "DELETE"},
            ]
            er_diagram = "users(1) ──< content(N)\nusers(1) ──< settings(N)"
        
        tables = base_tables + additional_tables
    else:
        # Default generic schema
        tables = base_tables + [
            {"name": "projects", "columns": [{"name": "id","type": "UUID","constraints": ["PK"]},{"name": "user_id","type": "UUID","constraints": ["FK → users.id"]},{"name": "name","type": "VARCHAR(160)","constraints": ["NOT NULL"]},{"name": "status","type": "VARCHAR(40)","constraints": ["DEFAULT 'draft'"]}], "indexes": ["idx_projects_user","idx_projects_status"]},
            {"name": "content", "columns": [{"name": "id","type": "UUID","constraints": ["PK"]},{"name": "user_id","type": "UUID","constraints": ["FK → users.id"]},{"name": "title","type": "VARCHAR(255)","constraints": ["NOT NULL"]},{"name": "body","type": "TEXT"}], "indexes": ["idx_content_user"]},
        ]
        relationships = [
            {"from": "projects.user_id","to": "users.id","type": "many_to_one","cascade": "DELETE"},
            {"from": "content.user_id","to": "users.id","type": "many_to_one","cascade": "DELETE"},
        ]
        er_diagram = "users(1) ──< projects(N)\nusers(1) ──< content(N)"
    
    return {
        "database_type": "PostgreSQL (prod) / SQLite (dev)",
        "tables": tables,
        "relationships": relationships,
        "er_diagram": er_diagram,
        "migration_command": "alembic upgrade head",
    }


# ──────────────────────────────────────────────
# API AGENT
# ──────────────────────────────────────────────
def run_api_agent(prompt: str, analysis: dict | None = None) -> dict[str, Any]:
    logs = ["API agent started"]
    
    # Extract information from sketch analysis if available
    app_type = analysis.get("app_type", "web application") if analysis else "web application"
    app_name = analysis.get("app_name", "Application") if analysis else "Application"
    features = analysis.get("features", []) if analysis else []
    data_requirements = analysis.get("data_requirements", []) if analysis else []
    
    try:
        # Build context from sketch analysis
        analysis_context = ""
        if analysis:
            analysis_context = f"""
            Sketch Analysis Results:
            - App Type: {app_type}
            - App Name: {app_name}
            - Features: {', '.join(features) if features else 'Standard features'}
            - Data Requirements: {', '.join(data_requirements) if data_requirements else 'Standard data'}
            
            Design REST API endpoints to support these features and data models.
            """
        
        output = _research_then_generate(
            search_queries=[
                f"{app_type} REST API design best practices FastAPI 2024",
                "OpenAPI Swagger documentation HTTP status codes error handling",
                "API versioning pagination rate limiting security best practices",
            ],
            system_prompt=(
                "You are a senior API designer. Design a complete REST API specification based on the sketch analysis. "
                "Return ONLY valid JSON with keys: "
                "base_url (string), authentication (string), "
                "endpoints (array of {path, method, description, auth: bool, request_body?, response}), "
                "swagger_docs (string), "
                "error_responses (object mapping status codes to descriptions). "
                "Include all CRUD operations, auth endpoints, and app-specific endpoints for the detected features."
            ),
            user_prompt=f"Design complete REST API for {app_name} ({app_type})\n\n{analysis_context}",
            logs=logs,
        )
        logs.append("API specification completed")
        return {"agent": "api", "status": "completed", "progress": 100, "logs": logs, "output": output}
    except Exception as e:
        logs.append(f"AI unavailable ({e}), using mock with analysis")
        return {"agent": "api", "status": "completed", "progress": 100, "logs": logs, "output": _mock_api(analysis)}

def _mock_api(analysis: dict | None = None) -> dict:
    # Base endpoints for any application
    base_endpoints = [
        {"path": "/health",         "method": "GET",    "description": "Health check",         "auth": False},
        {"path": "/auth/login",     "method": "POST",   "description": "User login",          "auth": False},
        {"path": "/auth/register",  "method": "POST",   "description": "User registration",    "auth": False},
        {"path": "/auth/logout",    "method": "POST",   "description": "User logout",         "auth": True},
        {"path": "/users/profile",  "method": "GET",    "description": "Get user profile",    "auth": True},
        {"path": "/users/profile",  "method": "PUT",    "description": "Update profile",      "auth": True},
    ]
    
    # Generate app-specific endpoints based on analysis
    if analysis:
        app_type = analysis.get("app_type", "web application")
        app_name = analysis.get("app_name", "Application")
        features = analysis.get("features", [])
        
        if "e-commerce" in app_type.lower():
            additional_endpoints = [
                {"path": "/products",          "method": "GET",    "description": "List products",        "auth": False},
                {"path": "/products",          "method": "POST",   "description": "Create product",       "auth": True},
                {"path": "/products/{id}",     "method": "GET",    "description": "Get product",          "auth": False},
                {"path": "/products/{id}",     "method": "PUT",    "description": "Update product",       "auth": True},
                {"path": "/products/{id}",     "method": "DELETE", "description": "Delete product",       "auth": True},
                {"path": "/categories",        "method": "GET",    "description": "List categories",      "auth": False},
                {"path": "/orders",            "method": "GET",    "description": "List user orders",     "auth": True},
                {"path": "/orders",            "method": "POST",   "description": "Create order",         "auth": True},
                {"path": "/orders/{id}",       "method": "GET",    "description": "Get order details",    "auth": True},
                {"path": "/cart",              "method": "GET",    "description": "Get shopping cart",    "auth": True},
                {"path": "/cart/items",        "method": "POST",   "description": "Add to cart",          "auth": True},
                {"path": "/cart/items/{id}",   "method": "DELETE", "description": "Remove from cart",     "auth": True},
                {"path": "/checkout",          "method": "POST",   "description": "Process checkout",     "auth": True},
            ]
        elif "dashboard" in app_type.lower():
            additional_endpoints = [
                {"path": "/metrics",           "method": "GET",    "description": "Get metrics",          "auth": True},
                {"path": "/metrics",           "method": "POST",   "description": "Record metric",        "auth": True},
                {"path": "/reports",           "method": "GET",    "description": "List reports",         "auth": True},
                {"path": "/reports",           "method": "POST",   "description": "Create report",        "auth": True},
                {"path": "/reports/{id}",      "method": "GET",    "description": "Get report",           "auth": True},
                {"path": "/reports/{id}",      "method": "PUT",    "description": "Update report",        "auth": True},
                {"path": "/widgets",           "method": "GET",    "description": "Get widgets",          "auth": True},
                {"path": "/widgets",           "method": "POST",   "description": "Create widget",        "auth": True},
                {"path": "/widgets/{id}",      "method": "PUT",    "description": "Update widget",        "auth": True},
                {"path": "/widgets/{id}",      "method": "DELETE", "description": "Delete widget",        "auth": True},
                {"path": "/dashboard/config",  "method": "GET",    "description": "Get dashboard config", "auth": True},
                {"path": "/dashboard/config",  "method": "PUT",    "description": "Update dashboard config", "auth": True},
            ]
        else:
            # Generic endpoints based on features
            additional_endpoints = [
                {"path": "/content",           "method": "GET",    "description": "List content",         "auth": False},
                {"path": "/content",           "method": "POST",   "description": "Create content",       "auth": True},
                {"path": "/content/{id}",      "method": "GET",    "description": "Get content",          "auth": False},
                {"path": "/content/{id}",      "method": "PUT",    "description": "Update content",       "auth": True},
                {"path": "/content/{id}",      "method": "DELETE", "description": "Delete content",       "auth": True},
                {"path": "/search",            "method": "GET",    "description": "Search content",       "auth": False},
                {"path": "/settings",          "method": "GET",    "description": "Get user settings",    "auth": True},
                {"path": "/settings",          "method": "PUT",    "description": "Update settings",      "auth": True},
            ]
        
        endpoints = base_endpoints + additional_endpoints
    else:
        # Default generic endpoints
        endpoints = base_endpoints + [
            {"path": "/content",           "method": "GET",    "description": "List content",         "auth": False},
            {"path": "/content",           "method": "POST",   "description": "Create content",       "auth": True},
            {"path": "/content/{id}",      "method": "GET",    "description": "Get content",          "auth": False},
            {"path": "/content/{id}",      "method": "PUT",    "description": "Update content",       "auth": True},
            {"path": "/content/{id}",      "method": "DELETE", "description": "Delete content",       "auth": True},
        ]
    
    return {
        "base_url": "/api",
        "authentication": "Firebase JWT Bearer token",
        "endpoints": endpoints,
        "swagger_docs": "http://localhost:8000/docs",
        "error_responses": {"400": "Bad Request", "401": "Unauthorized", "404": "Not Found", "422": "Validation Error", "500": "Server Error"},
    }


# ──────────────────────────────────────────────
# BUILDER AGENT
# ──────────────────────────────────────────────
def run_builder_agent(prompt: str, analysis: dict | None = None) -> dict[str, Any]:
    logs = ["Builder agent started"]
    
    # Extract information from sketch analysis if available
    app_type = analysis.get("app_type", "web application") if analysis else "web application"
    app_name = analysis.get("app_name", "Application") if analysis else "Application"
    components = analysis.get("components", []) if analysis else []
    layout = analysis.get("layout", {}).get("type", "responsive") if analysis else "responsive"
    
    try:
        # Build context from sketch analysis
        analysis_context = ""
        if analysis:
            analysis_context = f"""
            Sketch Analysis Results:
            - App Type: {app_type}
            - App Name: {app_name}
            - Detected Components: {', '.join(components) if components else 'Standard components'}
            - Layout Type: {layout}
            - UI Elements: {len(analysis.get('elements', []))} detected
            
            Generate code structure that matches these detected components and layout.
            """
        
        output = _research_then_generate(
            search_queries=[
                f"{app_type} React 19 TypeScript project structure best practices 2024",
                "FastAPI Python project structure service layer repository pattern",
                "Tailwind CSS shadcn UI component design system dark mode",
            ],
            system_prompt=(
                "You are a senior full-stack developer. Generate a complete code generation plan based on the sketch analysis. "
                "Return ONLY valid JSON with keys: "
                "frontend (object: framework, components[], pages[], styling, state_management, routing, code_editor), "
                "backend (object: framework, endpoints[], models[], services[], validation, database), "
                "integration_points (array of strings), "
                "file_structure (array of strings showing folder tree). "
                "Include every file and folder needed. The components should match the detected UI elements from the sketch."
            ),
            user_prompt=f"Generate full code plan for {app_name} ({app_type})\n\n{analysis_context}",
            logs=logs,
        )
        logs.append("Code generation plan completed")
        return {"agent": "builder", "status": "completed", "progress": 100, "logs": logs, "output": output}
    except Exception as e:
        logs.append(f"AI unavailable ({e}), using mock with analysis")
        return {"agent": "builder", "status": "completed", "progress": 100, "logs": logs, "output": _mock_builder(analysis)}

def _mock_builder(analysis: dict | None = None) -> dict:
    # Extract information from analysis if available
    if analysis:
        app_type = analysis.get("app_type", "web application")
        app_name = analysis.get("app_name", "Application")
        components = analysis.get("components", [])
        features = analysis.get("features", [])
        
        # Customize components based on detected ones
        if components:
            frontend_components = components + ["Navbar", "Footer", "Layout"]
        else:
            frontend_components = ["Navbar", "Dashboard", "Hero", "FeatureCard", "Footer", "Layout"]
        
        # Customize pages based on app type
        if "e-commerce" in app_type.lower():
            pages = ["Landing", "Auth", "ProductList", "ProductDetail", "Cart", "Checkout", "OrderHistory", "Profile", "Settings"]
        elif "dashboard" in app_type.lower():
            pages = ["Landing", "Auth", "Dashboard", "Analytics", "Reports", "Settings", "Profile"]
        else:
            pages = ["Landing", "Auth", "Dashboard", "Content", "Settings", "Profile"]
        
        # Customize backend endpoints based on features
        if features:
            endpoints = [f"POST /{feature.lower().replace(' ', '_')}" for feature in features[:5]]
            endpoints.extend(["GET /content", "POST /content", "PUT /content", "DELETE /content"])
        else:
            endpoints = ["GET /content", "POST /content", "PUT /content", "DELETE /content", "GET /search"]
    else:
        frontend_components = ["Navbar", "Dashboard", "Upload", "ProjectCard", "GeneratorPanel", "AgentStatus", "WorkflowTimeline"]
        pages = ["Landing", "Auth", "Dashboard", "Upload", "PRD", "Generator", "Settings"]
        endpoints = ["GET /content", "POST /content", "PUT /content", "DELETE /content"]
    
    return {
        "frontend": {
            "framework": "React 19 + TypeScript + Vite", 
            "components": frontend_components, 
            "pages": pages, 
            "styling": "Tailwind CSS + shadcn/ui + Framer Motion", 
            "state_management": "React Hooks + TanStack Query", 
            "routing": "React Router v6 with protected routes", 
            "code_editor": "Monaco Editor"
        },
        "backend": {
            "framework": "FastAPI 0.116 + Python 3.12", 
            "endpoints": endpoints, 
            "models": ["User", "Content", "Settings"], 
            "services": ["database.py", "auth.py", "content.py"], 
            "validation": "Pydantic v2", 
            "database": "SQLAlchemy 2.0 + Alembic"
        },
        "integration_points": ["Firebase Auth → JWT validation", "Database → data persistence", "API → backend communication"],
        "file_structure": ["client/src/pages/", "client/src/components/", "client/src/hooks/", "client/src/lib/", "server/app/api/", "server/app/services/", "server/app/models.py"],
    }


# Tester Agent
def run_tester_agent(prompt: str, analysis: dict | None = None) -> dict[str, Any]:
    logs = ["Tester agent started"]
    
    # Extract information from sketch analysis if available
    app_type = analysis.get("app_type", "web application") if analysis else "web application"
    app_name = analysis.get("app_name", "Application") if analysis else "Application"
    features = analysis.get("features", []) if analysis else []
    
    try:
        # Build context from sketch analysis
        analysis_context = ""
        if analysis:
            analysis_context = f"""
            Sketch Analysis Results:
            - App Type: {app_type}
            - App Name: {app_name}
            - Features: {', '.join(features) if features else 'Standard features'}
            
            Generate tests that cover these specific features and user flows.
            """
        
        output = _research_then_generate(
            [
                f"{app_type} pytest FastAPI testing best practices async fixtures 2024",
                "Vitest React Testing Library unit integration test patterns",
                "API test coverage CI/CD automation strategy",
            ],
            (
                "You are a QA engineer. Return ONLY valid JSON with these keys: "
                "test_framework (string), coverage_target (string), "
                "unit_tests (array of strings), integration_tests (array), "
                "api_tests (array), "
                "test_examples (object with example_test containing pytest code), "
                "testing_commands (array of CLI strings). "
                "Focus tests on the detected features from the sketch analysis."
            ),
            f"Tests for {app_name} ({app_type}) covering: {', '.join(features) if features else 'core functionality'}\n\n{analysis_context}",
            logs,
        )
        logs.append("Test suite completed")
        return {"agent": "tester", "status": "completed", "progress": 100, "logs": logs, "output": output}
    except Exception as e:
        logs.append(f"AI unavailable ({e}), mock used with analysis")
        return {"agent": "tester", "status": "completed", "progress": 100, "logs": logs, "output": _mock_tester(analysis)}


def _mock_tester(analysis: dict | None = None) -> dict:
    # Extract information from analysis if available
    if analysis:
        app_type = analysis.get("app_type", "web application")
        app_name = analysis.get("app_name", "Application")
        features = analysis.get("features", [])
        
        # Customize tests based on features
        if features:
            unit_tests = [f"tests/test_{feature.lower().replace(' ', '_')}.py" for feature in features[:5]]
            api_tests = [f"tests/test_{feature.lower().replace(' ', '_')}_api.py" for feature in features[:3]]
        else:
            unit_tests = ["tests/test_models.py", "tests/test_schemas.py", "tests/test_content.py"]
            api_tests = ["tests/test_content_api.py", "tests/test_auth_api.py"]
    else:
        unit_tests = ["tests/test_models.py", "tests/test_schemas.py", "tests/test_agents.py"]
        api_tests = ["tests/test_projects_api.py", "tests/test_agents_api.py"]
    
    return {
        "test_framework": "pytest + httpx + Vitest",
        "coverage_target": "80%+",
        "unit_tests": unit_tests,
        "integration_tests": ["tests/test_auth_flow.py", "tests/test_project_flow.py"],
        "api_tests": api_tests,
        "test_examples": {"example_test": "from fastapi.testclient import TestClient\nfrom app.main import app\nclient = TestClient(app)\n\ndef test_health():\n    r = client.get('/health')\n    assert r.status_code == 200\n    assert r.json()['status'] == 'ok'\n"},
        "testing_commands": ["pytest tests/ -v", "pytest tests/ --cov=app --cov-report=html"],
    }


# Documentation Agent
def run_documentation_agent(prompt: str, analysis: dict | None = None) -> dict[str, Any]:
    logs = ["Documentation agent started"]
    
    # Extract information from sketch analysis if available
    app_type = analysis.get("app_type", "web application") if analysis else "web application"
    app_name = analysis.get("app_name", "Application") if analysis else "Application"
    features = analysis.get("features", []) if analysis else []
    
    try:
        # Build context from sketch analysis
        analysis_context = ""
        if analysis:
            analysis_context = f"""
            Sketch Analysis Results:
            - App Type: {app_type}
            - App Name: {app_name}
            - Features: {', '.join(features) if features else 'Standard features'}
            
            Generate documentation that describes this specific application and its features.
            """
        
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
                "deployment_guide (object: frontend_vercel, backend_render, docker). "
                "The documentation should be specific to the detected app type and features."
            ),
            f"Documentation for {app_name} ({app_type})\n\n{analysis_context}",
            logs,
        )
        logs.append("Documentation completed")
        return {"agent": "documentation", "status": "completed", "progress": 100, "logs": logs, "output": output}
    except Exception as e:
        logs.append(f"AI unavailable ({e}), mock used with analysis")
        return {"agent": "documentation", "status": "completed", "progress": 100, "logs": logs, "output": _mock_documentation(analysis)}


def _mock_documentation(analysis: dict | None = None) -> dict:
    # Extract information from analysis if available
    if analysis:
        app_type = analysis.get("app_type", "web application")
        app_name = analysis.get("app_name", "Application")
        features = analysis.get("features", [])
        
        description = f"A {app_type} application called {app_name}"
        if features:
            description += f" featuring: {', '.join(features[:5])}"
        
        sections = ["Overview", "Features", "Architecture", "Installation", "Usage", "API Reference", "Deployment"]
        if features:
            sections.extend(["Feature Guide", "Troubleshooting"])
    else:
        app_name = "Sketch2Startup AI"
        description = "Transform sketches into production apps with AI agents"
        sections = ["Overview", "Features", "Architecture", "Installation", "Usage", "API Reference", "Deployment"]
    
    return {
        "readme": {
            "title": app_name,
            "description": description,
            "badges": ["Python 3.12", "React 19", "FastAPI", "TypeScript", "PostgreSQL"],
            "sections": sections
        },
        "api_documentation": {
            "format": "OpenAPI 3.0 / Swagger",
            "url": "http://localhost:8000/docs",
            "description": f"REST endpoints for {app_name}"
        },
        "installation_guide": {
            "prerequisites": ["Python 3.12+", "Node.js 18+", "PostgreSQL 15+", "Git"],
            "backend_steps": ["python -m venv .venv", "pip install -r requirements.txt", "uvicorn app.main:app --reload --port 8000"],
            "frontend_steps": ["npm install", "npm run dev"],
        },
        "environment_variables": {
            "backend": ["DATABASE_URL", "API_KEYS", "CORS_ORIGINS"],
            "frontend": ["VITE_API_URL", "VITE_APP_CONFIG"],
        },
        "deployment_guide": {
            "frontend_vercel": "Connect GitHub to Vercel, set environment variables, auto-deploy on push",
            "backend_render": "Connect GitHub to Render, set environment variables, configure start command",
            "docker": "docker compose up -d",
        },
    }


# Deployment Agent
def run_deployment_agent(prompt: str, analysis: dict | None = None) -> dict[str, Any]:
    logs = ["Deployment agent started"]
    
    # Extract information from sketch analysis if available
    app_type = analysis.get("app_type", "web application") if analysis else "web application"
    app_name = analysis.get("app_name", "Application") if analysis else "Application"
    
    try:
        # Build context from sketch analysis
        analysis_context = ""
        if analysis:
            analysis_context = f"""
            Sketch Analysis Results:
            - App Type: {app_type}
            - App Name: {app_name}
            
            Generate deployment configuration optimized for this type of application.
            """
        
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
                "monitoring (object: logging, uptime_check, error_tracking, metrics). "
                "The deployment should be optimized for the detected app type."
            ),
            f"Deployment config for {app_name} ({app_type})\n\n{analysis_context}",
            logs,
        )
        logs.append("Deployment config completed")
        return {"agent": "deployment", "status": "completed", "progress": 100, "logs": logs, "output": output}
    except Exception as e:
        logs.append(f"AI unavailable ({e}), mock used with analysis")
        return {"agent": "deployment", "status": "completed", "progress": 100, "logs": logs, "output": _mock_deployment(analysis)}


def _mock_deployment(analysis: dict | None = None) -> dict:
    # Extract information from analysis if available
    if analysis:
        app_type = analysis.get("app_type", "web application")
        app_name = analysis.get("app_name", "Application")
    else:
        app_type = "web application"
        app_name = "Application"
    
    return {
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
            "notes": f"Configure environment variables for {app_name} in Vercel dashboard",
        },
        "render": {
            "start_command": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
            "health_check_path": "/health",
            "env_vars": ["DATABASE_URL", "API_KEYS", "CORS_ORIGINS"],
            "plan": "Starter ($7/mo) or Standard ($25/mo)",
            "notes": f"Set cwd to server/ in Render build settings for {app_name}",
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
    }
