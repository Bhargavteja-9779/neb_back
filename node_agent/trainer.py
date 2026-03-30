"""
trainer.py
──────────
Stage 2 of the NebulaAI pipeline.

Automatically selects the correct CNN architecture based on job_type:
  - SimpleCNN  for MNIST / FashionMNIST  (1-channel grayscale)
  - ColorCNN   for CIFAR-10              (3-channel RGB)

GPU/CPU device is resolved via device_detector.py — printed visibly
so judges can see which hardware is running training.
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader

from device_detector import get_device, print_device_banner


# ─────────────────── Model Architectures ─────────────────────────────────────

class SimpleCNN(nn.Module):
    """CNN for 28×28 grayscale images (MNIST / FashionMNIST)."""

    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1),   # 28×28 → 28×28
            nn.ReLU(),
            nn.MaxPool2d(2),                   # 14×14
            nn.Conv2d(32, 64, 3, padding=1),   # 14×14
            nn.ReLU(),
            nn.MaxPool2d(2),                   # 7×7
            nn.Flatten(),
            nn.Linear(64 * 7 * 7, 128),
            nn.ReLU(),
            nn.Linear(128, 10),
        )

    def forward(self, x):
        return self.net(x)


class ColorCNN(nn.Module):
    """CNN for 32×32 RGB images (CIFAR-10)."""

    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1),   # 32×32
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2),                   # 16×16
            nn.Conv2d(32, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2),                   # 8×8
            nn.Conv2d(64, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.MaxPool2d(2),                   # 4×4
            nn.Flatten(),
            nn.Linear(128 * 4 * 4, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 10),
        )

    def forward(self, x):
        return self.net(x)


# ─────────────────── Training Function ───────────────────────────────────────

def run_training(input_path: str, output_path: str,
                 node_id: str, job_id: str, task_id: str,
                 job_type: str = "mnist"):
    """
    Loads preprocessed tensors, trains the appropriate CNN,
    then serialises the model state dict + test data for the Evaluator node.
    """
    device, device_label, is_gpu = get_device()
    print_device_banner(device_label, is_gpu)

    dataset_labels = {
        "mnist"  : "MNIST Handwritten Digits",
        "fashion": "FashionMNIST Clothing",
        "cifar10": "CIFAR-10 Object Recognition",
    }
    print(f"[TRAIN] ── Training Stage ──────────────────────────")
    print(f"[TRAIN] Dataset  : {dataset_labels.get(job_type, job_type)}")
    print(f"[TRAIN] Device   : {device_label}")

    # ── Load tensors ───────────────────────────────────────────────────────────
    payload     = torch.load(input_path, map_location="cpu", weights_only=False)
    job_type    = payload.get("job_type", job_type)
    channels    = payload.get("channels", 1)

    train_data    = payload['train_data']
    train_targets = payload['train_targets']

    print(f"[TRAIN] Samples  : {len(train_data)}")
    print(f"[TRAIN] Channels : {channels}")

    # ── Select architecture ────────────────────────────────────────────────────
    if channels == 3:
        model = ColorCNN().to(device)
        print(f"[TRAIN] Model    : ColorCNN (3-ch, for CIFAR-10)")
    else:
        model = SimpleCNN().to(device)
        print(f"[TRAIN] Model    : SimpleCNN (1-ch, for MNIST/Fashion)")

    # ── Dataloader ─────────────────────────────────────────────────────────────
    dataset  = TensorDataset(train_data, train_targets)
    loader   = DataLoader(dataset, batch_size=32, shuffle=True)
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.CrossEntropyLoss()

    epochs = 3
    print(f"[TRAIN] Epochs   : {epochs}\n")

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss, correct, total = 0.0, 0, 0

        for data, target in loader:
            data, target = data.to(device), target.to(device)
            optimizer.zero_grad()
            output = model(data)
            loss   = criterion(output, target)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()
            pred        = output.argmax(dim=1)
            correct    += pred.eq(target).sum().item()
            total      += target.size(0)

        acc = 100. * correct / total
        avg_loss = total_loss / len(loader)
        print(f"  Epoch {epoch}/{epochs}  |  Acc: {acc:6.2f}%  |  Loss: {avg_loss:.4f}  |  [{device_label}]")

    print(f"\n[TRAIN] Training complete.")

    # ── Pack payload for Evaluator ─────────────────────────────────────────────
    output_payload = {
        "job_type"     : job_type,
        "channels"     : channels,
        "state_dict"   : model.state_dict(),
        "test_data"    : payload['test_data'],
        "test_targets" : payload['test_targets'],
        "class_names"  : payload.get("class_names", []),
        "device_label" : device_label,
    }
    torch.save(output_payload, output_path)
    print(f"[TRAIN] Model + test data serialised → {output_path}\n")
