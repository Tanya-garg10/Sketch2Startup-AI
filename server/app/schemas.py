from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any, List


class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=160)
    description: Optional[str] = None
    status: Optional[str] = None


class ProjectOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: str
    upload_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ArtifactCreate(BaseModel):
    kind: str
    content: Dict[str, Any]
    markdown: Optional[str] = None
    file_path: Optional[str] = None


class ArtifactOut(BaseModel):
    id: str
    project_id: str
    kind: str
    content: Dict[str, Any]
    markdown: Optional[str]
    file_path: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class WorkflowStepCreate(BaseModel):
    step_name: str
    status: str = "pending"
    progress: int = 0
    error_message: Optional[str] = None


class WorkflowStepOut(BaseModel):
    id: str
    project_id: str
    step_name: str
    status: str
    progress: int
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class AgentRun(BaseModel):
    project_id: Optional[str] = None
    prompt: str = ""


class AnalysisResult(BaseModel):
    elements: List[Dict[str, Any]]
    layout: Dict[str, Any]
    components: List[str]
    suggestions: List[str]


class PRDOut(BaseModel):
    project_name: str
    problem_statement: str
    solution: str
    target_users: List[str]
    user_stories: List[str]
    functional_requirements: List[str]
    non_functional_requirements: List[str]
    tech_stack: List[str]
    acceptance_criteria: List[str]
    future_scope: List[str]


class DatabaseSchemaOut(BaseModel):
    tables: List[Dict[str, Any]]
    relationships: List[Dict[str, Any]]
    er_diagram: Optional[str] = None


class APIEndpointOut(BaseModel):
    endpoints: List[Dict[str, Any]]
    base_url: str
    authentication: str


class GeneratedCodeOut(BaseModel):
    files: Dict[str, str]
    structure: List[str]
    dependencies: Dict[str, str]
