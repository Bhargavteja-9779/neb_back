"""
evaluator.py
────────────
Stage 3 of the NebulaAI pipeline.

Loads the trained model state from the Trainer node, evaluates it on the
held-out test set, and streams the final metrics to the Orchestrator
(/task_metrics endpoint) which broadcasts them via WebSocket.
"""

import torch
import requests

from config import SERVER_URL
from trainer import SimpleCNN, ColorCNN
from device_detector import get_device, print_device_banner


def run_evaluation(input_path: str, output_path: str,
                   node_id: str, job_id: str, task_id: str,
                   job_type: str = "mnist"):
    """Evaluates the trained model and pushes final metrics to the Orchestrator."""
    device, device_label, is_gpu = get_device()
    print_device_banner(device_label, is_gpu)

    print(f"[EVAL ] ── Evaluation Stage ────────────────────────")
    print(f"[EVAL ] Loading model artifact from Trainer node...")

    payload    = torch.load(input_path, map_location="cpu", weights_only=False)
    job_type   = payload.get("job_type", job_type)
    channels   = payload.get("channels", 1)
    class_names = payload.get("class_names", [])

    dataset_labels = {
        "mnist"  : "MNIST Handwritten Digits",
        "fashion": "FashionMNIST Clothing",
        "cifar10": "CIFAR-10 Object Recognition",
    }
    print(f"[EVAL ] Dataset  : {dataset_labels.get(job_type, job_type)}")
    print(f"[EVAL ] Device   : {device_label}")

    # ── Reconstruct model ──────────────────────────────────────────────────────
    if channels == 3:
        model = ColorCNN().to(device)
    else:
        model = SimpleCNN().to(device)

    model.load_state_dict(payload['state_dict'])
    model.eval()

    # ── Evaluate ───────────────────────────────────────────────────────────────
    test_data    = payload['test_data'].to(device)
    test_targets = payload['test_targets'].to(device)

    with torch.no_grad():
        output = model(test_data)
        loss   = torch.nn.functional.cross_entropy(output, test_targets).item()
        pred   = output.argmax(dim=1)
        correct = pred.eq(test_targets).sum().item()

    total    = len(test_targets)
    accuracy = 100. * correct / total

    # ── Per-class accuracy ─────────────────────────────────────────────────────
    print(f"\n{'─'*50}")
    print(f"  FINAL EVALUATION RESULTS")
    print(f"{'─'*50}")
    print(f"  Dataset  : {dataset_labels.get(job_type, job_type)}")
    print(f"  Accuracy : {accuracy:.2f}%   ({correct}/{total} correct)")
    print(f"  Loss     : {loss:.4f}")
    print(f"  Device   : {device_label}")

    if class_names:
        print(f"\n  Per-Class Breakdown:")
        for cls_idx, cls_name in enumerate(class_names):
            mask        = test_targets.cpu() == cls_idx
            cls_correct = pred.cpu()[mask].eq(test_targets.cpu()[mask]).sum().item()
            cls_total   = torch.sum(mask).item()
            if cls_total > 0:
                cls_acc = 100. * cls_correct / cls_total
                bar     = "█" * int(cls_acc / 10) + "░" * (10 - int(cls_acc / 10))
                print(f"  {cls_name:>12}: [{bar}] {cls_acc:5.1f}%")
    print(f"{'─'*50}\n")

    # ── Broadcast metrics to Orchestrator ─────────────────────────────────────
    metrics_payload = {
        "job_id"   : job_id,
        "task_id"  : task_id,
        "epoch"    : 999,
        "accuracy" : round(accuracy, 2),
        "loss"     : round(loss, 4),
        "node_id"  : node_id,
    }
    try:
        resp = requests.post(f"{SERVER_URL}/task_metrics", json=metrics_payload, timeout=5)
        resp.raise_for_status()
        print(f"[EVAL ] Metrics streamed to Orchestrator.")
    except Exception as e:
        print(f"[EVAL ] Warning: could not push metrics: {e}")

    # ── Signal pipeline completion ─────────────────────────────────────────────
    torch.save({"status": "pipeline_success", "accuracy": accuracy, "loss": loss}, output_path)
    print(f"[EVAL ] Pipeline complete. Artifact saved.\n")
