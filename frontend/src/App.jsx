import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Nodes from './pages/Nodes';
import Training from './pages/Training';
import Leaderboard from './pages/Leaderboard';
import Chat from './pages/Chat';
import FailureSimulation from './components/FailureSimulation';
import NetworkBackground from './components/NetworkBackground';
import { AnimatePresence } from 'framer-motion';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/nodes" element={<Nodes />} />
        <Route path="/training" element={<Training />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </AnimatePresence>
  );
}

function ConditionalFailureSim() {
  const location = useLocation();
  if (location.pathname === '/') return null;
  return (
    <div className="relative z-10">
      <FailureSimulation />
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen text-[#FAFAFA] flex flex-col font-sans relative">
        <div className="noise-overlay" />
        <NetworkBackground />
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow relative">
            <AnimatedRoutes />
          </main>

          <ConditionalFailureSim />

        </div>
      </div>
    </Router>
  );
}

export default App;
