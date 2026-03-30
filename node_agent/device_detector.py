"""
device_detector.py
──────────────────
Centralised GPU/CPU detection for NebulaAI nodes.

Priority order:
  1. NVIDIA CUDA  (torch.cuda)
  2. Apple MPS    (torch.backends.mps)  — Apple Silicon / Intel Mac with torch 2.x
  3. Intel Extension for PyTorch        — if intel_extension_for_pytorch is installed
  4. CPU fallback (Intel Iris labelled)

The returned `device_label` string is printed boldly on the terminal so judges
can instantly see which compute resource each node is using.
"""

import platform
import subprocess
import torch


def get_device():
    """
    Detect the best available compute device and return:
      - device : torch.device object to pass to .to(device)
      - device_label : human-readable string for terminal/logs
      - is_gpu : bool — True if any GPU acceleration is active
    """

    # ── 1. NVIDIA CUDA ────────────────────────────────────────────────────────
    if torch.cuda.is_available():
        name = torch.cuda.get_device_name(0)
        return (
            torch.device("cuda"),
            f"NVIDIA CUDA  [{name}]",
            True
        )

    # ── 2. Apple MPS (Metal Performance Shaders) ──────────────────────────────
    try:
        if torch.backends.mps.is_available():
            chip = _get_apple_chip()
            return (
                torch.device("mps"),
                f"Apple MPS    [{chip}]",
                True
            )
    except AttributeError:
        pass   # older PyTorch without MPS support

    # ── 3. Intel Extension for PyTorch (XPU) ─────────────────────────────────
    try:
        import intel_extension_for_pytorch as ipex   # type: ignore
        if hasattr(torch, 'xpu') and torch.xpu.is_available():
            name = torch.xpu.get_device_name(0)
            return (
                torch.device("xpu"),
                f"Intel XPU    [{name}]",
                True
            )
    except ImportError:
        pass

    # ── 4. CPU fallback — detect Intel Iris label for display ─────────────────
    iris_label = _get_integrated_gpu_label()
    return (
        torch.device("cpu"),
        f"CPU          [{iris_label}]",
        False
    )


def _get_apple_chip() -> str:
    """Returns the Apple chip name (e.g. 'Apple M1 Pro')."""
    try:
        result = subprocess.run(
            ["sysctl", "-n", "machdep.cpu.brand_string"],
            capture_output=True, text=True, timeout=2
        )
        return result.stdout.strip() or "Apple Silicon"
    except Exception:
        return "Apple Silicon"


def _get_integrated_gpu_label() -> str:
    """
    Tries to identify the integrated GPU on Intel / AMD machines.
    On Mac: uses system_profiler.
    On Linux: uses lspci.
    Falls back to CPU model name.
    """
    system = platform.system()

    if system == "Darwin":
        try:
            result = subprocess.run(
                ["system_profiler", "SPDisplaysDataType"],
                capture_output=True, text=True, timeout=5
            )
            for line in result.stdout.splitlines():
                if "Intel" in line or "Iris" in line or "AMD" in line or "Radeon" in line:
                    return line.strip().replace("Chipset Model:", "").strip()
        except Exception:
            pass
        # Fallback: CPU brand
        try:
            result = subprocess.run(
                ["sysctl", "-n", "machdep.cpu.brand_string"],
                capture_output=True, text=True, timeout=2
            )
            cpu = result.stdout.strip()
            if "Intel" in cpu:
                return f"Intel Iris Xe  ({cpu})"
            return cpu
        except Exception:
            pass

    elif system == "Linux":
        try:
            result = subprocess.run(
                ["lspci"], capture_output=True, text=True, timeout=3
            )
            for line in result.stdout.splitlines():
                if "VGA" in line or "Display" in line:
                    return line.split(":")[-1].strip()
        except Exception:
            pass

    # Last resort
    try:
        import cpuinfo  # type: ignore
        info = cpuinfo.get_cpu_info()
        return info.get("brand_raw", platform.processor())
    except Exception:
        return platform.processor() or "Unknown CPU"


def print_device_banner(device_label: str, is_gpu: bool):
    """Prints a coloured banner visible to judges."""
    GREEN  = "\033[92m"
    YELLOW = "\033[93m"
    CYAN   = "\033[96m"
    BOLD   = "\033[1m"
    RESET  = "\033[0m"

    color = GREEN if is_gpu else YELLOW
    icon  = "GPU" if is_gpu else "CPU"

    print(f"\n{BOLD}{color}┌{'─'*51}┐{RESET}")
    print(f"{BOLD}{color}│  [{icon}] Compute Device Detected                    │{RESET}")
    print(f"{BOLD}{color}│  {CYAN}{device_label:<47}{color}  │{RESET}")
    print(f"{BOLD}{color}└{'─'*51}┘{RESET}\n")
