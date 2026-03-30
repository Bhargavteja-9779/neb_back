from database import get_db_connection

def add_trust(node_id: str, amount: int = 5):
    """Adds trust to a node. Triggered on successful job completion."""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("UPDATE nodes SET trust = trust + ? WHERE id = ?", (amount, node_id))
    conn.commit()
    conn.close()

def deduct_trust(node_id: str, amount: int = 10):
    """Deducts trust from a node. Triggered on job failure or disconnection."""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("UPDATE nodes SET trust = trust - ? WHERE id = ?", (amount, node_id))
    conn.commit()
    conn.close()

def add_credits(node_id: str, amount: int = 20):
    """Adds credits to a node. Triggered on job attempt completion."""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("UPDATE nodes SET credits = credits + ? WHERE id = ?", (amount, node_id))
    conn.commit()
    conn.close()
