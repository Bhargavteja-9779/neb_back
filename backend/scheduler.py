import json
from database import get_db_connection

class Scheduler:
    @staticmethod
    def get_best_pipeline_node(required_capability: str, prefer_gpu: bool, job_id: str) -> str:
        """
        Selects best node that has the required_capability.
        Prioritizes least-loaded nodes and strict stage distribution.
        """
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("""
            SELECT id, cpu, ram, gpu, trust, capabilities, active_tasks, cpu_usage 
            FROM nodes WHERE status = 'online'
        """)
        nodes = c.fetchall()
        
        # Find nodes already assigned to this job to force distributed execution
        c.execute("SELECT assigned_node FROM job_tasks WHERE job_id = ? AND assigned_node IS NOT NULL", (job_id,))
        used_nodes = set(row['assigned_node'] for row in c.fetchall() if row['assigned_node'])
        conn.close()
        
        best_node = None
        best_score = -float('inf')
        
        for node in nodes:
            try:
                caps = json.loads(node['capabilities'])
            except:
                caps = []
                
            if required_capability not in caps:
                continue
                
            node_id = node['id']
            cpu = node['cpu']
            ram = node['ram']
            trust = node['trust']
            gpu = node['gpu']
            active_tasks = node['active_tasks']
            cpu_usage = node['cpu_usage']
            
            # 1. Base potential score
            score = (cpu * 2) + (ram * 1.5) + (trust * 3)
            
            # 2. Penalty for node load (strongly penalize busy nodes to distribute load)
            score -= (active_tasks * 3000)
            score -= cpu_usage
            
            # 3. Penalty to force distributive pipeline across different nodes
            if node_id in used_nodes:
                score -= 5000  # huge penalty so it only picks same node if no others are online
                
            # 4. Reward for GPU if requested
            if prefer_gpu and gpu:
                score += 4000
                
            if score > best_score:
                best_score = score
                best_node = node_id
                
        return best_node
