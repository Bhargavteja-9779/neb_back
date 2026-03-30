import json
from database import get_db_connection

def get_best_pipeline_node(required_capability: str, prefer_gpu: bool = False):
    """
    Selects best node that has the `required_capability`.
    If prefer_gpu is True, it will heavily weight nodes with gpu=True.
    Returns the node_id string, or None if no nodes are available.
    """
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT id, cpu, ram, gpu, trust, capabilities FROM nodes WHERE status = 'online'")
    nodes = c.fetchall()
    conn.close()
    
    best_node = None
    best_score = -1.0
    
    for node in nodes:
        # Check if node has the required capability
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
        
        # Calculate score (Capability-based and Pipeline Optimized)
        score = (cpu * 2) + (ram * 1.5) + (trust * 3)
        
        # Huge boost if GPU is preferred and this node has a GPU
        if prefer_gpu and gpu:
            score += 1000
            
        if score > best_score:
            best_score = score
            best_node = node_id
            
    return best_node
