from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.api.routes import router
from app.core.config import settings
from app.db.session import Base, engine

# Create database tables
Base.metadata.create_all(bind=engine)

# Ensure local uploads directory exists
UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

app = FastAPI(
    title="Sketch2Startup AI API",
    version="1.0.0",
    description="AI-powered app generation from sketches"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)

# Serve locally uploaded files
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

@app.on_event("startup")
async def startup_event():
    if settings.demo_mode:
        print("WARNING: Running in DEMO MODE - some features may be limited")
    else:
        print("Running in production mode with full credentials")
