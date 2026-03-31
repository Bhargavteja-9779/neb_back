import time
import uuid
from database import get_db_connection
from scheduler import Scheduler

# Supported job types and their display names for logging
JOB_TYPE_LABELS = {
    "mnist": "MNIST Handwritten Digits",
    "fashion": "FashionMNIST Clothing",
    "cifar10": "CIFAR-10 Object Recognition",
}

class PipelineManager:
    @staticmethod
    def create_pipeline_job(job_id: str, job_type: str = "mnist"):
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
            "INSERT INTO jobs (id, type, job_type, pipeline_state) VALUES (?, ?, ?, ?)",
            (job_id, "pipeline", job_type, "PENDING")
        )

        current_time = time.time()

        # Stage 1: Preprocessing — no dependency
        c.execute("""
            INSERT INTO job_tasks (id, job_id, task_type, dependency, queued_at, status)
            VALUES (?, ?, ?, ?, ?, 'waiting')
        """, (task1_id, job_id, "preprocessing", None, current_time))

        # Stage 2: Training — depends on preprocessing output
        c.execute("""
            INSERT INTO job_tasks (id, job_id, task_type, dependency, queued_at, status)
            VALUES (?, ?, ?, ?, ?, 'waiting')
        """, (task2_id, job_id, "training", task1_id, current_time))

        # Stage 3: Evaluation — depends on training output
        c.execute("""
            INSERT INTO job_tasks (id, job_id, task_type, dependency, queued_at, status)
            VALUES (?, ?, ?, ?, ?, 'waiting')
        """, (task3_id, job_id, "evaluation", task2_id, current_time))

        conn.commit()
        conn.close()

        # Trigger scheduler
        PipelineManager.schedule_ready_tasks()

    @staticmethod
    def schedule_ready_tasks():
        """Assigns tasks whose dependencies are met to the best capable node."""
        conn = get_db_connection()
        c = conn.cursor()

        # Tasks missing an assigned node, where dependency is null OR dependency is completed
        # Note: waiting -> assigned
        c.execute("""
            SELECT t1.id, t1.job_id, t1.task_type
            FROM job_tasks t1
            LEFT JOIN job_tasks t2 ON t1.dependency = t2.id
            WHERE (t1.status = 'waiting' OR t1.status = 'pending')
              AND t1.assigned_node IS NULL
              AND (t1.dependency IS NULL OR t2.status = 'completed')
        """)
        ready_tasks = c.fetchall()

        for task in ready_tasks:
            task_id   = task['id']
            job_id    = task['job_id']
            task_type = task['task_type']

            prefer_gpu = (task_type == "training")
            best_node  = Scheduler.get_best_pipeline_node(task_type, prefer_gpu, job_id)

            if best_node:
                c.execute(
                    "UPDATE job_tasks SET assigned_node = ?, status = 'assigned' WHERE id = ?",
                    (best_node, task_id)
                )
                gpu_label = " [GPU PREFERRED]" if prefer_gpu else ""
                print(f"  [ORCH] Assigning {task_type:>13} → node {best_node}{gpu_label}")

        conn.commit()
        conn.close()

    @staticmethod
    def complete_task(task_id: str, output_path: str):
        conn = get_db_connection()
        c = conn.cursor()

        c.execute("""
            UPDATE job_tasks
            SET status = 'completed', completed_at = ?, output_path = ?
            WHERE id = ?
        """, (time.time(), output_path, task_id))

        c.execute("SELECT job_id, assigned_node, task_type FROM job_tasks WHERE id = ?", (task_id,))
        row = c.fetchone()
        
        node_id = row['assigned_node'] if row else None
        job_id = row['job_id'] if row else None
        task_type = row['task_type'] if row else None

        if node_id:
            c.execute(
                "UPDATE nodes SET trust = trust + 5, credits = credits + 10, active_tasks = MAX(0, active_tasks - 1) WHERE id = ?",
                (node_id,)
            )
            
        # Update pipeline state
        if job_id and task_type:
            new_state = None
            if task_type == 'preprocessing':
                new_state = 'PREPROCESS_DONE'
            elif task_type == 'training':
                new_state = 'TRAIN_DONE'
            elif task_type == 'evaluation':
                new_state = 'FINISHED'
                
            if new_state:
                c.execute("UPDATE jobs SET pipeline_state = ? WHERE id = ?", (new_state, job_id))

        conn.commit()
        conn.close()

        print(f"  [DONE ] Task {task_id} completed by {node_id}. Unlocking next stage...")
        PipelineManager.schedule_ready_tasks()

    @staticmethod
    def reassign_job(task_id: str, task_type: str, job_id: str):
        prefer_gpu = (task_type == "training")
        new_node   = Scheduler.get_best_pipeline_node(task_type, prefer_gpu, job_id)

        conn = get_db_connection()
        c = conn.cursor()
        if new_node:
            c.execute(
                "UPDATE job_tasks SET assigned_node = ?, status = 'assigned' WHERE id = ?",
                (new_node, task_id)
            )
            print(f"  [REROUTE] Task {task_id} → node {new_node}")
        else:
            c.execute(
                "UPDATE job_tasks SET assigned_node = NULL, status = 'waiting' WHERE id = ?",
                (task_id,)
            )
            print(f"  [REROUTE] Task {task_id}: no capable node available — task returned to queue.")
        conn.commit()
        conn.close()

    @staticmethod
    def handle_failed_node_tasks(node_id: str):
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("""
            SELECT id, task_type, job_id FROM job_tasks
            WHERE assigned_node = ? AND status != 'completed'
        """, (node_id,))
        tasks = c.fetchall()
        
        # Reset node's active tasks on failure
        c.execute("UPDATE nodes SET active_tasks = 0 WHERE id = ?", (node_id,))
        
        conn.commit()
        conn.close()

        for t in tasks:
            PipelineManager.reassign_job(t['id'], t['task_type'], t['job_id'])
