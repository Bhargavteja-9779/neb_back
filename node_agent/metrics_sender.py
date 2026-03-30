import requests
from config import SERVER_URL

def send_metrics(job_id: str, epoch: int, accuracy: float, loss: float, node_id: str):
    """Sends training metrics to the central Server via REST."""
    payload = {
        "job_id": job_id,
        "epoch": epoch,
        "accuracy": accuracy,
        "loss": loss,
        "node_id": node_id
    }
    try:
        requests.post(f"{SERVER_URL}/job_metrics", json=payload, timeout=5)
    except Exception as e:
        print(f"[!] Failed to send metrics for epoch {epoch}: {e}")
