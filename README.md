# Task Manager API

A lightweight CRUD REST API for managing tasks, built with **FastAPI** and **SQLite**.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [FastAPI](https://fastapi.tiangolo.com/) |
| Database | SQLite (via `sqlite3`) |
| Validation | [Pydantic](https://docs.pydantic.dev/) |
| Server | [Uvicorn](https://www.uvicorn.org/) |

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd <repo-name>

# 2. Create & activate a virtual environment
python -m venv .venv
source .venv/bin/activate      # Linux/macOS
# .venv\Scripts\activate       # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the server
uvicorn main:app --reload
```

The API is live at **http://127.0.0.1:8000**.  
Interactive docs: **http://127.0.0.1:8000/docs**

The SQLite database file (`tasks.db`) is created automatically on first startup.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/tasks` | Create a new task |
| `GET` | `/tasks` | List all tasks (optional `?status=` and `?priority=` filters) |
| `GET` | `/tasks/{task_id}` | Get a single task by ID |
| `PATCH` | `/tasks/{task_id}` | Partially update a task |
| `DELETE` | `/tasks/{task_id}` | Delete a task |

### Example: Create a task

```bash
curl -X POST http://127.0.0.1:8000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn FastAPI", "priority": "high"}'
```

```json
{
  "id": 1,
  "title": "Learn FastAPI",
  "description": "",
  "status": "todo",
  "priority": "high",
  "created_at": "2026-06-18 16:30:00"
}
```

## Data Model

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `int` | auto | Auto-increment primary key |
| `title` | `str` | required | Task title (min 1 char) |
| `description` | `str` | `""` | Optional details |
| `status` | `enum` | `"todo"` | One of: `todo`, `in_progress`, `done` |
| `priority` | `enum` | `"medium"` | One of: `low`, `medium`, `high` |
| `created_at` | `str` | auto | ISO-format creation timestamp |

## Project Structure

```
.
├── main.py          # FastAPI app & endpoints
├── models.py        # Pydantic schemas (Task, TaskCreate, TaskUpdate)
├── database.py      # SQLite connection & init
├── requirements.txt # Dependencies
└── tasks.db         # SQLite database (auto-generated)
```

## License

MIT
# task_manager
