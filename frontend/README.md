# NebulaAI – Autonomous Student AI Supercomputer

A production-quality hackathon demo frontend for NebulaAI, converting idle student laptops into a collaborative AI supercomputer.

## 🚀 Features Highlights
- **Real-time animated dashboard** demonstrating compute power growth.
- **Interactive Supercomputer Visualization** showing Neural Sync connections.
- **Node Network Grid** with dynamic status (Active, Busy, Failed) and trust levels.
- **Distributed Training Interface** powered by Recharts processing mock WebSocket data.
- **Live Leaderboard** highlighting top contributing nodes with Framer Motion reordering.
- **AI Assistant Chat** designed like modern LLM interfaces with typing indicators.
- **Failure Recovery Demo** simulating node drop-off and automatic job task reassignment.

## 🛠 Tech Stack
- React (Vite)
- Tailwind CSS v4 
- Framer Motion (Animations, Page Transitions)
- Recharts (Real-time Metric Tracking)
- Lucide React (Premium Icons)
- React Router (Routing)

## 🏁 How to Run Locally

### 1. Prerequisites
Ensure you have Node.js (v18+) and npm installed.

### 2. Installation
Clone or inside the project folder, run:
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Navigate to the provided localhost URL (e.g., `http://localhost:5173`) in your browser.

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── ComputeVisualization.jsx  # SVG Animated Nodes
│   │   ├── FailureSimulation.jsx     # Floating Simulation Controls
│   │   ├── Navbar.jsx                # Layout Navbar
│   │   ├── NodeCard.jsx              # Status Cards for Laptops
│   │   ├── StatCard.jsx              # Dashboard Counters
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Nodes.jsx
│   │   ├── Training.jsx
│   │   ├── Leaderboard.jsx
│   │   ├── Chat.jsx
│   ├── services/
│   │   ├── api.js                    # Mock Data & Socket
```

## 🎨 Design System
Features dark theme styling (`#0B0F19`), Glassmorphism cards (`#121826` with blur), and gradient neon accents reflecting Google Cloud/OpenAI aesthetic.
