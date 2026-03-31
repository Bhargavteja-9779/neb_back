"""
task_executor.py
────────────────
Orchestrates a single assigned task on this node:
  1. Download prerequisite artifact from the previous stage (if any)
  2. Route to the correct compute module (preprocessor / trainer / evaluator)
  3. Upload the output artifact back to the Orchestrator
  4. Clean up local workspace
"""

import os
import requests
import torch

from config import SERVER_URL
from preprocessor import run_preprocessing
from trainer import run_training
from evaluator import run_evaluation


def download_dependency(dependency_id: str, save_path: str):
    """Downloads the .pt output of the previous pipeline stage."""
    print(f"[XFER ] Downloading artifact '{dependency_id}.pt' from Orchestrator...")
    resp = requests.get(f"{SERVER_URL}/task_input/{dependency_id}", stream=True, timeout=60)
    resp.raise_for_status()
    with open(save_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)
    size_mb = os.path.getsize(save_path) / (1024 * 1024)
    print(f"[XFER ] Downloaded {size_mb:.2f} MB → {save_path}")


def upload_output(task_id: str, file_path: str):
    """Uploads the computed .pt artifact to the Orchestrator."""
    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    print(f"[XFER ] Uploading artifact '{task_id}.pt' ({size_mb:.2f} MB) to Orchestrator...")
    with open(file_path, "rb") as f:
        files = {"file": (f"{task_id}.pt", f, "application/octet-stream")}
        resp  = requests.post(f"{SERVER_URL}/task_output/{task_id}", files=files, timeout=60)
        resp.raise_for_status()
    print(f"[XFER ] Upload complete.")


def execute_task(task_id: str, job_id: str, task_type: str,
                 dependency: str, node_id: str, job_type: str = "mnist"):
    """
    Full task lifecycle:
      download dependency → execute stage → upload output → cleanup
    """
    local_workspace = "./workspace"
    os.makedirs(local_workspace, exist_ok=True)

    input_path = None
    if dependency:
        input_path = os.path.join(local_workspace, f"{dependency}.pt")
        download_dependency(dependency, input_path)

    output_path = os.path.join(local_workspace, f"{task_id}.pt")

    # ── Route to capability module ─────────────────────────────────────────────
    if task_type == "preprocessing":
        print(f"[NODE {node_id}] Executing preprocessing...")
        run_preprocessing(output_path, job_type=job_type)

    elif task_type == "training":
        print(f"[NODE {node_id}] Training model...")
        run_training(input_path, output_path,
                     node_id=node_id, job_id=job_id, task_id=task_id,
                     job_type=job_type)

    elif task_type == "evaluation":
        print(f"[NODE {node_id}] Running evaluation...")
        run_evaluation(input_path, output_path,
                       node_id=node_id, job_id=job_id, task_id=task_id,
                       job_type=job_type)

    else:
        raise ValueError(f"[EXEC ] Unknown task_type: '{task_type}'")

    # ── Push output to Orchestrator ────────────────────────────────────────────
    upload_output(task_id, output_path)

    # ── Cleanup local workspace ────────────────────────────────────────────────
    for path in [input_path, output_path]:
        if path and os.path.exists(path):
            os.remove(path)

    print(f"[EXEC ] Task {task_id} ({task_type}) complete. Local workspace cleared.\n")
