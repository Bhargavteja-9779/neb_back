import json
import time
from database import get_db_connection

class NodeRegistry:
    @staticmethod
    def register_node(node_id: str, cpu: int, ram: float, gpu: bool, hostname: str, capabilities: list) -> bool:
        caps_json = json.dumps(capabilities)
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT id FROM nodes WHERE id = ?", (node_id,))
        if c.fetchone():
            c.execute("""
                UPDATE nodes 
                SET cpu=?, ram=?, gpu=?, capabilities=?, status='online', last_seen=?
                WHERE id=?
            """, (cpu, ram, gpu, caps_json, time.time(), node_id))
        else:
            c.execute("""
                INSERT INTO nodes (id, cpu, ram, gpu, capabilities, trust, status, credits, last_seen)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (node_id, cpu, ram, gpu, caps_json, 50, 'online', 0, time.time()))
        conn.commit()
        conn.close()
        return True

    @staticmethod
    def update_heartbeat(node_id: str, cpu_usage: float, ram_usage: float, active_tasks: int):
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("""
            UPDATE nodes 
            SET last_seen=?, status='online', cpu_usage=?, ram_usage=?, active_tasks=? 
            WHERE id=?
        """, (time.time(), cpu_usage, ram_usage, active_tasks, node_id))
        conn.commit()
        conn.close()

    @staticmethod
    def get_all_nodes():
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM nodes")
        nodes = [dict(row) for row in c.fetchall()]
        conn.close()
        for n in nodes:
            if n['capabilities']:
                try:
                    n['capabilities'] = json.loads(n['capabilities'])
                except:
                    n['capabilities'] = []
        return nodes

    @staticmethod
    def check_node_failures(timeout_seconds=30) -> list:
        """Returns list of node_ids that failed."""
        conn = get_db_connection()
        c = conn.cursor()
        limit = time.time() - timeout_seconds

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
        conn.close()
        return failed_nodes
        
    @staticmethod
    def simulate_failure(node_id: str):
        print(f"\n  [SIM  ] Manually failing node: {node_id}")
        conn = get_db_connection()
        c = conn.cursor()
        c.execute(
            "UPDATE nodes SET status = 'offline', trust = trust - 10 WHERE id = ?",
            (node_id,)
        )
        conn.commit()
        conn.close()
