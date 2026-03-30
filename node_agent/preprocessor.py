"""
preprocessor.py
───────────────
Stage 1 of the NebulaAI pipeline.

Supports three datasets selected by `job_type`:
  "mnist"   — MNIST Handwritten Digits        (28×28 grayscale, 10 classes)
  "fashion" — FashionMNIST Clothing           (28×28 grayscale, 10 classes)
  "cifar10" — CIFAR-10 Object Recognition     (32×32 RGB,       10 classes)

Outputs a single .pt file containing normalised tensors:
  { train_data, train_targets, test_data, test_targets }
which the Trainer node downloads and consumes.
"""

import torch
from torchvision import datasets, transforms
from torch.utils.data import Subset

# ──── Dataset Configurations ─────────────────────────────────────────────────
DATASET_CONFIGS = {
    "mnist": {
        "label"      : "MNIST Handwritten Digits",
        "mean"       : (0.1307,),
        "std"        : (0.3081,),
        "channels"   : 1,
        "train_size" : 1000,
        "test_size"  : 200,
        "loader"     : datasets.MNIST,
    },
    "fashion": {
        "label"      : "FashionMNIST Clothing",
        "mean"       : (0.2860,),
        "std"        : (0.3530,),
        "channels"   : 1,
        "train_size" : 1000,
        "test_size"  : 200,
        "loader"     : datasets.FashionMNIST,
    },
    "cifar10": {
        "label"      : "CIFAR-10 Object Recognition",
        "mean"       : (0.4914, 0.4822, 0.4465),
        "std"        : (0.2023, 0.1994, 0.2010),
        "channels"   : 3,
        "train_size" : 500,    # smaller subset — CIFAR images are larger
        "test_size"  : 100,
        "loader"     : datasets.CIFAR10,
    },
}

CLASS_NAMES = {
    "mnist"  : ["0","1","2","3","4","5","6","7","8","9"],
    "fashion": ["T-shirt","Trouser","Pullover","Dress","Coat",
                "Sandal","Shirt","Sneaker","Bag","Ankle boot"],
    "cifar10": ["airplane","automobile","bird","cat","deer",
                "dog","frog","horse","ship","truck"],
}


def run_preprocessing(output_path: str, job_type: str = "mnist"):
    """Download, normalise, subset and serialise the chosen dataset."""
    cfg   = DATASET_CONFIGS.get(job_type, DATASET_CONFIGS["mnist"])
    label = cfg["label"]

    print(f"\n[PREP ] ── Preprocessing Stage ─────────────────")
    print(f"[PREP ] Dataset : {label}")
    print(f"[PREP ] Train   : {cfg['train_size']} samples")
    print(f"[PREP ] Test    : {cfg['test_size']}  samples")

    # ── Build transform pipeline ──────────────────────────────────────────────
    if cfg["channels"] == 1:
        transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(cfg["mean"], cfg["std"]),
        ])
    else:
        # CIFAR-10: colour augmentation for richer demo
        transform = transforms.Compose([
            transforms.Resize((32, 32)),
            transforms.ToTensor(),
            transforms.Normalize(cfg["mean"], cfg["std"]),
        ])

    # ── Download dataset ──────────────────────────────────────────────────────
    DatasetClass = cfg["loader"]
    print(f"[PREP ] Downloading {label}...")
    full_train = DatasetClass('./data', train=True,  download=True,  transform=transform)
    full_test  = DatasetClass('./data', train=False, download=True,  transform=transform)

    train_subset = Subset(full_train, range(cfg["train_size"]))
    test_subset  = Subset(full_test,  range(cfg["test_size"]))

    # ── Extract tensors ───────────────────────────────────────────────────────
    train_data, train_targets = [], []
    for d, t in train_subset:
        train_data.append(d)
        train_targets.append(int(t))

    test_data, test_targets = [], []
    for d, t in test_subset:
        test_data.append(d)
        test_targets.append(int(t))

    payload = {
        "job_type"      : job_type,
        "train_data"    : torch.stack(train_data),
        "train_targets" : torch.tensor(train_targets),
        "test_data"     : torch.stack(test_data),
        "test_targets"  : torch.tensor(test_targets),
        "class_names"   : CLASS_NAMES.get(job_type, []),
        "channels"      : cfg["channels"],
    }

    torch.save(payload, output_path)
    print(f"[PREP ] Done. Serialised tensor bundle → {output_path}")
    print(f"[PREP ]  train shape: {payload['train_data'].shape}")
    print(f"[PREP ]  test  shape: {payload['test_data'].shape}\n")
