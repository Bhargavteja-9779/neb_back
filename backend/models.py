from pydantic import BaseModel
from typing import Optional, List

class NodeRegistration(BaseModel):
    id: str
    cpu: int
    ram: float
    gpu: bool
    hostname: str
    capabilities: List[str]

class NodeHeartbeat(BaseModel):
    node_id: str
    cpu_usage: float
    ram_usage: float
    active_tasks: int

class JobSubmission(BaseModel):
    id: str
    type: str

class JobMetrics(BaseModel):
    job_id: str
    task_id: str
    epoch: int
    accuracy: float
    loss: float
    node_id: str
