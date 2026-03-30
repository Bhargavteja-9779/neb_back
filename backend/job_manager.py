import time
import uuid
from database import get_db_connection
from scheduler import get_best_pipeline_node

# Supported job types and their display names for logging
JOB_TYPE_LABELS = {
    "mnist": "MNIST Handwritten Digits",
    "fashion": "FashionMNIST Clothing",
    "cifar10": "CIFAR-10 Object Recognition",
}

def create_pipeline_job(job_id: str, job_type: str = "mnist"):
    """
    Creates a 3-stage pipeline job:
      Task 1 — preprocessing (loads and normalizes dataset)
      Task 2 — training     (trains CNN on preprocessed tensors)
      Task 3 — evaluation   (evaluates model, streams final metrics)
    """
    label = JOB_TYPE_LABELS.get(job_type, job_type)
    print(f"\n{'='*55}")
    print(f"  [PIPELINE] Launching: {label}")
    print(f"  Job ID : {job_id}")
    print(f"  Dataset: {job_type.upper()}")
    print(f"{'='*55}\n")

    task1_id = f"task_{uuid.uuid4().hex[:8]}"
    task2_id = f"task_{uuid.uuid4().hex[:8]}"
    task3_id = f"task_{uuid.uuid4().hex[:8]}"

    conn = get_db_connection()
    c = conn.cursor()

    # Register job with job_type so nodes know which dataset to load
    c.execute(
        "INSERT INTO jobs (id, type, job_type) VALUES (?, ?, ?)",
        (job_id, "pipeline", job_type)
    )

    current_time = time.time()

    # Stage 1: Preprocessing — no dependency, any capable node
    c.execute("""
        INSERT INTO job_tasks (id, job_id, task_type, dependency, queued_at)
        VALUES (?, ?, ?, ?, ?)
    """, (task1_id, job_id, "preprocessing", None, current_time))

    # Stage 2: Training — depends on preprocessing output
    c.execute("""
        INSERT INTO job_tasks (id, job_id, task_type, dependency, queued_at)
        VALUES (?, ?, ?, ?, ?)
    """, (task2_id, job_id, "training", task1_id, current_time))

    # Stage 3: Evaluation — depends on training output
    c.execute("""
        INSERT INTO job_tasks (id, job_id, task_type, dependency, queued_at)
        VALUES (?, ?, ?, ?, ?)
    """, (task3_id, job_id, "evaluation", task2_id, current_time))

    conn.commit()
    conn.close()

    # Trigger scheduler: find capable nodes and assign ready tasks
    schedule_ready_tasks()


def schedule_ready_tasks():
    """
    Finds tasks whose dependencies are met and assigns them to
    the best capable node. A dependency is met when its upstream
    task has status='completed'.
    """
    conn = get_db_connection()
    c = conn.cursor()

    # Select tasks that are pending, not yet assigned, and whose
    # dependency (if any) is already completed.
    c.execute("""
        SELECT t1.id, t1.task_type
        FROM job_tasks t1
        LEFT JOIN job_tasks t2 ON t1.dependency = t2.id
        WHERE t1.status = 'pending'
          AND t1.assigned_node IS NULL
          AND (t1.dependency IS NULL OR t2.status = 'completed')
    """)
    ready_tasks = c.fetchall()

    for task in ready_tasks:
        task_id   = task['id']
        task_type = task['task_type']

        # Training tasks strongly prefer GPU nodes
        prefer_gpu = (task_type == "training")
        best_node  = get_best_pipeline_node(task_type, prefer_gpu)

        if best_node:
            c.execute(
                "UPDATE job_tasks SET assigned_node = ? WHERE id = ?",
                (best_node, task_id)
            )
            gpu_label = " [GPU PREFERRED]" if prefer_gpu else ""
            print(f"  [SCHED] {task_type:>15} → node {best_node}{gpu_label}")

    conn.commit()
    conn.close()


def complete_task(task_id: str, output_path: str):
    """
    Marks a pipeline task as completed, rewards the contributing node
    with trust and credits, then triggers the scheduler to unblock
    the next stage in the DAG.
    """
    conn = get_db_connection()
    c = conn.cursor()

    c.execute("""
        UPDATE job_tasks
        SET status = 'completed', completed_at = ?, output_path = ?
        WHERE id = ?
    """, (time.time(), output_path, task_id))

    # Retrieve the contributing node ID before closing
    c.execute("SELECT assigned_node FROM job_tasks WHERE id = ?", (task_id,))
    row = c.fetchone()
    node_id = row['assigned_node'] if row else None

    if node_id:
        c.execute(
            "UPDATE nodes SET trust = trust + 5, credits = credits + 10 WHERE id = ?",
            (node_id,)
        )

    conn.commit()
    conn.close()

    print(f"  [DONE ] Task {task_id} completed by {node_id}. Unlocking next stage...")
    schedule_ready_tasks()


def reassign_job(task_id: str, task_type: str):
    """Finds a replacement node for a failed task."""
    prefer_gpu = (task_type == "training")
    new_node   = get_best_pipeline_node(task_type, prefer_gpu)

    conn = get_db_connection()
    c = conn.cursor()
    if new_node:
        c.execute(
            "UPDATE job_tasks SET assigned_node = ?, status = 'pending' WHERE id = ?",
            (new_node, task_id)
        )
        print(f"  [REROUTE] Task {task_id} → node {new_node}")
    else:
        c.execute(
            "UPDATE job_tasks SET assigned_node = NULL, status = 'pending' WHERE id = ?",
            (task_id,)
        )
        print(f"  [REROUTE] Task {task_id}: no capable node available — task re-queued.")
    conn.commit()
    conn.close()


def check_node_failures():
    """
    Background check: if a node hasn't sent a heartbeat in >15 seconds,
    mark it offline and reroute any tasks it was running.
    """
    conn = get_db_connection()
    c = conn.cursor()
    limit = time.time() - 15

    c.execute(
        "SELECT id FROM nodes WHERE status = 'online' AND last_seen < ?",
        (limit,)
    )
    failed_nodes = [row['id'] for row in c.fetchall()]

    for node_id in failed_nodes:
        print(f"\n  [FAIL ] Heartbeat lost: {node_id} — marking offline")
        c.execute(
            "UPDATE nodes SET status = 'offline', trust = trust - 10 WHERE id = ?",
            (node_id,)
        )
        conn.commit()

        # Reroute all running/pending tasks on the dead node
        c.execute("""
            SELECT id, task_type FROM job_tasks
            WHERE assigned_node = ? AND status != 'completed'
        """, (node_id,))
        for task_row in c.fetchall():
            reassign_job(task_row['id'], task_row['task_type'])

    conn.close()


def simulate_node_failure(node_id: str):
    """Manual failure injection — used by the demo /simulate_failure endpoint."""
    print(f"\n  [SIM  ] Manually failing node: {node_id}")
    conn = get_db_connection()
    c = conn.cursor()
    c.execute(
        "UPDATE nodes SET status = 'offline', trust = trust - 10 WHERE id = ?",
        (node_id,)
    )
    c.execute("""
        SELECT id, task_type FROM job_tasks
        WHERE assigned_node = ? AND status != 'completed'
    """, (node_id,))
    tasks = c.fetchall()
    conn.commit()
    conn.close()

    for t in tasks:
        reassign_job(t['id'], t['task_type'])
