from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Project
from app.schemas import AgentRun, ProjectCreate, ProjectOut
from app.services.agents import run_agent, analyze_upload
router=APIRouter()
@router.get("/health")
def health(): return {"status":"ok"}
@router.post("/projects", response_model=ProjectOut)
def create_project(payload:ProjectCreate, db:Session=Depends(get_db)):
    p=Project(name=payload.name); db.add(p); db.commit(); db.refresh(p); return p
@router.get("/projects", response_model=list[ProjectOut])
def projects(db:Session=Depends(get_db)):
    return db.query(Project).order_by(Project.created_at.desc()).limit(20).all()
@router.post("/uploads")
async def upload(file:UploadFile=File(...)): return {"filename":file.filename,"storage":"supabase-ready","progress":100}
@router.post("/analyze")
async def analyze(file:UploadFile=File(...)): return analyze_upload(file.filename or "upload")
for path,agent in [("/prd","planner"),("/architecture","architect"),("/database","database"),("/apis","api"),("/frontend","builder"),("/backend","builder"),("/tests","tester"),("/docs","documentation")]:
    async def endpoint(payload:AgentRun, agent=agent): return run_agent(agent,payload.prompt)
    router.add_api_route(path, endpoint, methods=["POST"])
@router.post("/auth")
def auth_placeholder(): return {"provider":"supabase","status":"configured-by-client"}
