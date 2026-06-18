import sqlite3
from contextlib import contextmanager

DB_PATH = "tasks.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db() -> None:
    conn = get_connection()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS tasks (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT    NOT NULL,
            description TEXT    DEFAULT '',
            status      TEXT    DEFAULT 'todo',
            priority    TEXT    DEFAULT 'medium',
            created_at  TEXT    DEFAULT (datetime('now'))
        )
        """
    )
    conn.commit()
    conn.close()


@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()