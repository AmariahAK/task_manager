from __future__ import annotations

from contextlib import closing
from typing import Optional

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.responses import JSONResponse

from database import get_db, init_db
from models import Task, TaskCreate, TaskPriority, TaskStatus, TaskUpdate

app = FastAPI(title="Task Manager API")


@app.on_event("startup")
def startup() -> None:
    init_db()


# ── helpers ──────────────────────────────────────────────────────────────────

def _row_to_task(row: dict) -> Task:
    return Task(
        id=row["id"],
        title=row["title"],
        description=row["description"],
        status=row["status"],
        priority=row["priority"],
        created_at=row["created_at"],
    )


# ── CREATE ───────────────────────────────────────────────────────────────────

@app.post("/tasks", response_model=Task, status_code=status.HTTP_201_CREATED)
def create_task(body: TaskCreate) -> JSONResponse:
    with get_db() as db, closing(db.cursor()) as cur:
        cur.execute(
            "INSERT INTO tasks (title, description, status, priority) VALUES (?, ?, ?, ?)",
            (body.title, body.description, body.status, body.priority),
        )
        db.commit()
        row = cur.execute("SELECT * FROM tasks WHERE id = ?", (cur.lastrowid,)).fetchone()
    return JSONResponse(
        status_code=201,
        content=_row_to_task(dict(row)).model_dump(),
    )


# ── LIST ALL ─────────────────────────────────────────────────────────────────

@app.get("/tasks", response_model=list[Task])
def list_tasks(
    status_filter: Optional[TaskStatus] = Query(default=None, alias="status"),
    priority_filter: Optional[TaskPriority] = Query(default=None, alias="priority"),
) -> JSONResponse:
    clauses: list[str] = []
    params: list[str] = []

    if status_filter is not None:
        clauses.append("status = ?")
        params.append(status_filter)
    if priority_filter is not None:
        clauses.append("priority = ?")
        params.append(priority_filter)

    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    query = f"SELECT * FROM tasks {where} ORDER BY created_at DESC"

    with get_db() as db, closing(db.cursor()) as cur:
        rows = cur.execute(query, params).fetchall()

    return JSONResponse(
        content=[_row_to_task(dict(r)).model_dump() for r in rows],
    )


# ── GET BY ID ────────────────────────────────────────────────────────────────

@app.get("/tasks/{task_id}", response_model=Task)
def get_task(task_id: int) -> JSONResponse:
    with get_db() as db, closing(db.cursor()) as cur:
        row = cur.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return JSONResponse(content=_row_to_task(dict(row)).model_dump())


# ── UPDATE ───────────────────────────────────────────────────────────────────

@app.patch("/tasks/{task_id}", response_model=Task)
def update_task(task_id: int, body: TaskUpdate) -> JSONResponse:
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clauses: list[str] = []
    params: list[str] = []
    for col, val in updates.items():
        set_clauses.append(f"{col} = ?")
        params.append(val)

    params.append(str(task_id))
    query = f"UPDATE tasks SET {', '.join(set_clauses)} WHERE id = ?"

    with get_db() as db, closing(db.cursor()) as cur:
        cur.execute(query, params)
        db.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Task not found")
        row = cur.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()

    return JSONResponse(content=_row_to_task(dict(row)).model_dump())


# ── DELETE ───────────────────────────────────────────────────────────────────

@app.delete("/tasks/{task_id}", response_model=Task)
def delete_task(task_id: int) -> JSONResponse:
    with get_db() as db, closing(db.cursor()) as cur:
        row = cur.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Task not found")
        cur.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        db.commit()
    return JSONResponse(content=_row_to_task(dict(row)).model_dump())