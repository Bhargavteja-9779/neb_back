import sqlite3
from sqlite3 import Connection
from config import DATABASE_URL

def get_db_connection() -> Connection:
    """Returns a connection to the SQLite database."""
    db_path = DATABASE_URL.replace("sqlite:///", "")
    conn = sqlite3.connect(db_path, check_same_thread=False, timeout=30.0)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database tables."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Drop existing for clean schema on restart
    cursor.executescript('''
        DROP TABLE IF EXISTS nodes;
        DROP TABLE IF EXISTS jobs;
        DROP TABLE IF EXISTS metrics;
        DROP TABLE IF EXISTS job_tasks;
    ''')
    
    # nodes table — includes capabilities list (JSON) and GPU flag
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS nodes (
            id TEXT PRIMARY KEY,
            cpu INTEGER,
            ram REAL,
            gpu BOOLEAN,
            capabilities TEXT,
            trust INTEGER DEFAULT 50,
            status TEXT DEFAULT 'online',
            credits INTEGER DEFAULT 0,
            last_seen REAL,
            cpu_usage REAL DEFAULT 0.0,
            ram_usage REAL DEFAULT 0.0,
            active_tasks INTEGER DEFAULT 0
        )
    ''')
    
    # jobs table — job_type tells preprocessor which dataset to load
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            type TEXT,
            job_type TEXT DEFAULT 'mnist',
            status TEXT DEFAULT 'pending',
            pipeline_state TEXT DEFAULT 'PENDING',
            accuracy REAL DEFAULT 0.0,
            loss REAL DEFAULT 0.0
        )
    ''')
    
    # job_tasks table — the DAG ledger for each pipeline stage
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS job_tasks (
            id TEXT PRIMARY KEY,
            job_id TEXT,
            task_type TEXT,
            status TEXT DEFAULT 'pending',
            assigned_node TEXT,
            dependency TEXT,
            output_path TEXT,
            queued_at REAL,
            completed_at REAL
        )
    ''')
    
    # metrics table — time-series accuracy/loss per epoch per task
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id TEXT,
            task_id TEXT,
            epoch INTEGER,
            accuracy REAL,
            loss REAL,
            node_id TEXT,
            timestamp REAL
        )
    ''')
    
    conn.commit()
    conn.close()
