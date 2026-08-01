from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.db.session import get_db
from app.models import Project, User, Artifact, WorkflowStep
from app.schemas import (
    AgentRun, ProjectCreate, ProjectUpdate, ProjectOut,
    ArtifactCreate, ArtifactOut, WorkflowStepCreate, WorkflowStepOut
)
from app.services.agents import run_agent, analyze_upload
from app.services.firebase import get_current_user, optional_auth, storage_status, upload_to_firebase

router = APIRouter()


def _get_or_create_user(db: Session, current_user: dict) -> User:
    """Get or create a DB user from the Firebase auth dict."""
    user = db.query(User).filter(User.email == current_user.get("email")).first()
    if not user:
        user = User(
            email=current_user.get("email"),
            firebase_uid=current_user.get("uid"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.get("/health")
def health():
    return {"status": "ok", "storage": storage_status()}


@router.post("/projects", response_model=ProjectOut)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = _get_or_create_user(db, current_user)
    p = Project(name=payload.name, description=payload.description, user_id=user.id)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.get("/projects", response_model=list[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = db.query(User).filter(User.email == current_user.get("email")).first()
    if not user:
        return []
    return (
        db.query(Project)
        .filter(Project.user_id == user.id)
        .order_by(Project.created_at.desc())
        .limit(50)
        .all()
    )


@router.get("/projects/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = db.query(User).filter(User.email == current_user.get("email")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    project = db.query(Project).filter(
        Project.id == project_id, Project.user_id == user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/projects/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = db.query(User).filter(User.email == current_user.get("email")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    project = db.query(Project).filter(
        Project.id == project_id, Project.user_id == user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description
    if payload.status is not None:
        project.status = payload.status
    db.commit()
    db.refresh(project)
    return project


@router.delete("/projects/{project_id}")
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = db.query(User).filter(User.email == current_user.get("email")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    project = db.query(Project).filter(
        Project.id == project_id, Project.user_id == user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}


@router.post("/uploads")
async def upload(
    file: UploadFile = File(...),
    project_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        file_url = await upload_to_firebase(file, current_user.get("uid", "anon"))
        if project_id:
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                project.upload_url = file_url
                db.commit()
        return {
            "filename": file.filename,
            "url": file_url,
            "storage": "firebase",
            "progress": 100,
            "user": current_user.get("email"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")


@router.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    project_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        # Read bytes so vision analysis can use them
        image_bytes = await file.read()
        analysis_result = analyze_upload(
            file.filename or "upload",
            image_bytes=image_bytes,
            content_type=file.content_type,
        )
        if project_id:
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                project.analysis_result = analysis_result
                project.status = "analyzing"
                db.commit()
        return analysis_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")


@router.get("/projects/{project_id}/artifacts", response_model=list[ArtifactOut])
def get_project_artifacts(
    project_id: str,
    kind: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = db.query(User).filter(User.email == current_user.get("email")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    project = db.query(Project).filter(
        Project.id == project_id, Project.user_id == user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    q = db.query(Artifact).filter(Artifact.project_id == project_id)
    if kind:
        q = q.filter(Artifact.kind == kind)
    return q.order_by(Artifact.created_at.desc()).all()


@router.post("/projects/{project_id}/artifacts", response_model=ArtifactOut)
def create_artifact(
    project_id: str,
    payload: ArtifactCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = db.query(User).filter(User.email == current_user.get("email")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    project = db.query(Project).filter(
        Project.id == project_id, Project.user_id == user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    artifact = Artifact(
        project_id=project_id,
        kind=payload.kind,
        content=payload.content,
        markdown=payload.markdown,
        file_path=payload.file_path,
    )
    db.add(artifact)
    db.commit()
    db.refresh(artifact)
    return artifact


@router.get("/projects/{project_id}/workflow", response_model=list[WorkflowStepOut])
def get_workflow_steps(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = db.query(User).filter(User.email == current_user.get("email")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    project = db.query(Project).filter(
        Project.id == project_id, Project.user_id == user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return (
        db.query(WorkflowStep)
        .filter(WorkflowStep.project_id == project_id)
        .order_by(WorkflowStep.created_at.asc())
        .all()
    )


@router.post("/projects/{project_id}/workflow/{step_name}", response_model=WorkflowStepOut)
def update_workflow_step(
    project_id: str,
    step_name: str,
    payload: WorkflowStepCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    from datetime import datetime

    user = db.query(User).filter(User.email == current_user.get("email")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    project = db.query(Project).filter(
        Project.id == project_id, Project.user_id == user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    step = db.query(WorkflowStep).filter(
        WorkflowStep.project_id == project_id,
        WorkflowStep.step_name == step_name,
    ).first()

    if step:
        step.status = payload.status
        step.progress = payload.progress
        step.error_message = payload.error_message
        if payload.status == "in_progress" and not step.started_at:
            step.started_at = datetime.utcnow()
        if payload.status == "completed" and not step.completed_at:
            step.completed_at = datetime.utcnow()
    else:
        step = WorkflowStep(
            project_id=project_id,
            step_name=step_name,
            status=payload.status,
            progress=payload.progress,
            error_message=payload.error_message,
            started_at=datetime.utcnow() if payload.status == "in_progress" else None,
            completed_at=datetime.utcnow() if payload.status == "completed" else None,
        )
        db.add(step)

    db.commit()
    db.refresh(step)
    return step


# ---------------------------------------------------------------------------
# Agent endpoints — explicit (avoids closure bug in dynamic registration)
# ---------------------------------------------------------------------------

@router.post("/prd")
async def run_prd(payload: AgentRun, current_user: dict = Depends(get_current_user)):
    return run_agent("planner", payload.prompt or f"Generate PRD for project {payload.project_id}")


@router.post("/architecture")
async def run_architecture(payload: AgentRun, current_user: dict = Depends(get_current_user)):
    return run_agent("architect", payload.prompt or "Design system architecture")


@router.post("/database")
async def run_database(payload: AgentRun, current_user: dict = Depends(get_current_user)):
    return run_agent("database", payload.prompt or "Generate database schema")


@router.post("/apis")
async def run_apis(payload: AgentRun, current_user: dict = Depends(get_current_user)):
    return run_agent("api", payload.prompt or "Generate REST API endpoints")


@router.post("/frontend")
async def run_frontend(payload: AgentRun, current_user: dict = Depends(get_current_user)):
    return run_agent("builder", payload.prompt or "Generate React frontend code")


@router.post("/backend")
async def run_backend(payload: AgentRun, current_user: dict = Depends(get_current_user)):
    return run_agent("builder", payload.prompt or "Generate FastAPI backend code")


@router.post("/tests")
async def run_tests(payload: AgentRun, current_user: dict = Depends(get_current_user)):
    return run_agent("tester", payload.prompt or "Generate test suites")


@router.post("/docs")
async def run_docs(payload: AgentRun, current_user: dict = Depends(get_current_user)):
    return run_agent("documentation", payload.prompt or "Generate documentation")


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------

@router.post("/auth/verify")
async def verify_auth(current_user: dict = Depends(get_current_user)):
    return {"status": "authenticated", "user": current_user}


@router.get("/auth/status")
async def auth_status(current_user: Optional[dict] = Depends(optional_auth)):
    if current_user:
        return {"status": "authenticated", "user": current_user}
    return {"status": "unauthenticated"}
