from pydantic import BaseModel, Field
from uuid import UUID
class ProjectCreate(BaseModel): name: str = Field(min_length=2, max_length=160)
class ProjectOut(BaseModel): id: UUID; name: str; status: str
class AgentRun(BaseModel): project_id: UUID | None = None; prompt: str = ""
class ArtifactOut(BaseModel): kind: str; content: dict; markdown: str | None = None
