"""
node_agent.py
─────────────
NebulaAI Distributed Compute Node Agent

Each laptop runs this script to join the NebulaAI cluster.
The agent:
  1. Detects hardware (CPU cores, RAM, GPU/device)
  2. Registers with the Orchestrator (SERVER_URL)
  3. Runs a background heartbeat thread
  4. Polls for assigned pipeline tasks
  5. Executes tasks and uploads results
"""

import time
import requests
import uuid
import sys
import platform
import itertools
import threading
import psutil
from requests.exceptions import RequestException

from config import SERVER_URL
from task_executor import execute_task
from device_detector import get_device, print_device_banner

# ── Unique node identity for this session ─────────────────────────────────────
NODE_ID = f"node_{uuid.uuid4().hex[:8]}"

BOLD   = "\033[1m"
CYAN   = "\033[96m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RESET  = "\033[0m"


def detect_capabilities():
    """
    Detect hardware and return (cpu_cores, ram_gb, gpu_bool, capabilities_list).
    Every node advertises all three capabilities; the scheduler will
    preferentially route training to GPU nodes using trust scoring.
    """
    cpu_cores = psutil.cpu_count(logical=True)
    ram_gb    = round(psutil.virtual_memory().total / (1024 ** 3), 2)

    # Use device_detector for consistent GPU detection
    _, _, is_gpu = get_device()

    # All nodes declare full capability set; orchestrator picks best node per stage
    capabilities = ["preprocessing", "training", "evaluation"]
    return cpu_cores, ram_gb, is_gpu, capabilities


def print_startup_banner(cpu, ram, gpu, capabilities, device_label):
    """Prints a formatted node startup banner — visible to judges."""
    hostname = platform.node()
    os_info  = f"{platform.system()} {platform.release()}"
    gpu_flag = f"{GREEN}YES — {device_label}{RESET}" if gpu else f"{YELLOW}NO  — {device_label}{RESET}"

    print(f"\n{BOLD}{'═'*55}{RESET}")
    print(f"{BOLD}{CYAN}   NebulaAI Distributed Node — STARTING{RESET}")
    print(f"{BOLD}{'═'*55}{RESET}")
    print(f"  Node ID    : {BOLD}{CYAN}{NODE_ID}{RESET}")
    print(f"  Hostname   : {hostname}")
    print(f"  OS         : {os_info}")
    print(f"  CPU Cores  : {cpu}")
    print(f"  RAM        : {ram} GB")
    print(f"  GPU Active : {gpu_flag}")
    print(f"  Compute    : {device_label}")
    print(f"  Server     : {SERVER_URL}")
    print(f"  Caps       : {', '.join(capabilities)}")
    print(f"{BOLD}{'═'*55}{RESET}\n")


def register_node():
    """Registers this node with the Orchestrator, retrying until successful."""
    cpu, ram, gpu, capabilities = detect_capabilities()
    _, device_label, _ = get_device()

    print_startup_banner(cpu, ram, gpu, capabilities, device_label)

    payload = {
        "id"          : NODE_ID,
        "cpu"         : cpu,
        "ram"         : ram,
        "gpu"         : gpu,
        "hostname"    : platform.node(),
        "capabilities": capabilities,
    }

    while True:
        try:
            resp = requests.post(f"{SERVER_URL}/register_node", json=payload, timeout=5)
            if resp.status_code == 200:
                print(f"{GREEN}[NODE ] Successfully registered as {NODE_ID}{RESET}")
                break
            else:
                print(f"[NODE ] Registration error: {resp.text}")
        except RequestException as e:
            print(f"[NODE ] Cannot reach Orchestrator ({SERVER_URL}). Retrying in 5s... ({e})")
        time.sleep(5)


def heartbeat_loop():
    """Sends heartbeats every 5 seconds so the Orchestrator knows this node is alive."""
    while True:
        try:
            requests.post(f"{SERVER_URL}/heartbeat", json={"node_id": NODE_ID}, timeout=3)
        except RequestException:
            pass
        time.sleep(5)


def check_for_task():
    """Polls the Orchestrator for the next assigned task."""
    try:
        resp = requests.get(f"{SERVER_URL}/get_task/{NODE_ID}", timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            if "task_id" in data:
                return data
    except RequestException:
        pass
    return None


def main():
    register_node()

    # ── Background heartbeat ───────────────────────────────────────────────────
    hb_thread = threading.Thread(target=heartbeat_loop, daemon=True)
    hb_thread.start()

    print(f"[NODE ] Polling Orchestrator for pipeline tasks...")
    spinner = itertools.cycle(['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'])

    try:
        while True:
            sys.stdout.write(f"\r{CYAN}{next(spinner)} [{NODE_ID}] Waiting for task assignment...{RESET}")
            sys.stdout.flush()

            task = check_for_task()
            if task:
                sys.stdout.write("\r\033[K")
                sys.stdout.flush()

                print(f"\n{BOLD}{GREEN}[NODE ] Task received!{RESET}")
                print(f"  Task ID   : {task['task_id']}")
                print(f"  Stage     : {BOLD}{task['task_type'].upper()}{RESET}")
                print(f"  Dataset   : {task.get('job_type', 'mnist').upper()}")
                print(f"  Job       : {task['job_id']}\n")

                try:
                    execute_task(
                        task_id   = task['task_id'],
                        job_id    = task['job_id'],
                        task_type = task['task_type'],
                        dependency= task.get('dependency'),
                        node_id   = NODE_ID,
                        job_type  = task.get('job_type', 'mnist'),
                    )
                except Exception as e:
                    print(f"\n[NODE ] Task failed: {e}\n")

            time.sleep(1)

    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}[NODE ] Shutting down gracefully. Goodbye.{RESET}\n")


if __name__ == "__main__":
    main()
