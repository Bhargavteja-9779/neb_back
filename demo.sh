#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  demo.sh — NebulaAI Hackathon Demo Script
#  Run this on Laptop A (the server machine)
#  Usage:  chmod +x demo.sh && ./demo.sh
# ─────────────────────────────────────────────────────────────────────────────

BOLD="\033[1m"
CYAN="\033[96m"
GREEN="\033[92m"
YELLOW="\033[93m"
RED="\033[91m"
RESET="\033[0m"

SERVER="http://localhost:8000"
PYTHON="/Users/bhargavtejap.n/Desktop/PROJECTS/visageux/.venv/bin/python"

separator() {
    echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
}

header() {
    separator
    echo -e "${BOLD}${CYAN}   NebulaAI — Hackathon Live Demo${RESET}"
    echo -e "${CYAN}   Heterogeneous AI Orchestration System${RESET}"
    separator
    echo ""
}

wait_for_server() {
    echo -e "${YELLOW}[DEMO] Waiting for Orchestrator to start...${RESET}"
    for i in {1..20}; do
        if curl -s "$SERVER/status" > /dev/null 2>&1; then
            echo -e "${GREEN}[DEMO] Orchestrator is online!${RESET}"
            return 0
        fi
        sleep 1
        echo -n "."
    done
    echo -e "\n${RED}[DEMO] Orchestrator did not start. Make sure to run: cd backend && uvicorn main:app${RESET}"
    exit 1
}

check_nodes() {
    echo -e "\n${BOLD}[DEMO] Step 1 — Checking connected nodes...${RESET}"
    NODES=$(curl -s "$SERVER/status" | $PYTHON -c "
import sys, json
data = json.load(sys.stdin)
cluster = data['cluster']
nodes   = data['nodes']
print(f\"  Total Nodes  : {cluster['total_nodes']}\")
print(f\"  Online       : {cluster['online_nodes']}\")
print(f\"  Offline      : {cluster['offline_nodes']}\")
print()
for n in nodes:
    gpu = '[GPU]' if n['gpu'] else '[CPU]'
    print(f\"  {gpu} {n['node_id']}  Trust:{n['trust']}  RAM:{n['ram_gb']}GB  Status:{n['status']}\")
" 2>/dev/null)
    echo -e "$NODES"
}

fire_all_jobs() {
    echo -e "\n${BOLD}[DEMO] Step 2 — Launching all 3 training pipelines...${RESET}"
    RESULT=$(curl -s -X POST "$SERVER/demo_all")
    echo -e "$RESULT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"  Status: {data['status']}\")
for j in data.get('jobs', []):
    print(f\"  Launched: {j['job_id']}  ({j['dataset'].upper()})\")
"
}

watch_progress() {
    echo -e "\n${BOLD}[DEMO] Step 3 — Live pipeline progress (watching for 60s)...${RESET}"
    echo -e "${YELLOW}  (Ctrl+C to stop watching and continue)${RESET}\n"
    for i in {1..12}; do
        sleep 5
        PROGRESS=$(curl -s "$SERVER/status" | $PYTHON -c "
import sys, json
data = json.load(sys.stdin)
tasks = data.get('pipeline_tasks', [])
from collections import Counter
status_counts = Counter(t['status'] for t in tasks)
print(f\"  Queued:{status_counts.get('pending',0)}  Running:{status_counts.get('running',0)}  Done:{status_counts.get('completed',0)}\")
jobs = data.get('recent_jobs', [])
for j in jobs[:3]:
    acc = f\"{j['accuracy']:.1f}%\" if j['accuracy'] else 'pending'
    print(f\"  Job {j['id']}: {j['status']}  Accuracy: {acc}\")
" 2>/dev/null)
        echo -e "  [$i/12] $PROGRESS"
    done
}

show_results() {
    echo -e "\n${BOLD}[DEMO] Final Results:${RESET}"
    curl -s "$SERVER/status" | $PYTHON -c "
import sys, json
data = json.load(sys.stdin)
jobs = data.get('recent_jobs', [])
print()
print('  Dataset              Accuracy    Loss    Status')
print('  ' + '-'*55)
labels = {'mnist':'MNIST Handwritten Digits','fashion':'FashionMNIST Clothing','cifar10':'CIFAR-10 Objects'}
for j in jobs:
    label = labels.get(j.get('job_type',''),'Unknown')
    acc   = f\"{j['accuracy']:.2f}%\" if j['accuracy'] else '---'
    loss  = f\"{j['loss']:.4f}\"     if j['loss']     else '---'
    print(f\"  {label:<25} {acc:<10}  {loss:<8} {j['status']}\")
print()
"
}

# ─────────────────────────────────────────────────────────────────────────────
header
wait_for_server
check_nodes
fire_all_jobs
watch_progress
show_results
separator
echo -e "${BOLD}${GREEN}   Demo Complete! Open http://localhost:8000/docs for interactive UI${RESET}"
separator
