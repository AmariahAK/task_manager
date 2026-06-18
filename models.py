from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

TaskStatus = Literal["todo", "in_progress", "done"]
TaskPriority = Literal["low", "medium", "high"]


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, description="Task title")
    description: str = Field(default="", description="Optional description")
    status: TaskStatus = Field(default="todo", description="Task status")
    priority: TaskPriority = Field(default="medium", description="Task priority")


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, description="Task title")
    description: Optional[str] = Field(default=None, description="Optional description")
    status: Optional[TaskStatus] = Field(default=None, description="Task status")
    priority: Optional[TaskPriority] = Field(default=None, description="Task priority")


class Task(TaskCreate):
    id: int = Field(..., description="Auto-increment task ID")
    created_at: str = Field(..., description="ISO-format creation timestamp")
