import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Server, Activity, Trophy, MessageSquare, Home } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/nodes', label: 'Nodes', icon: Server },
  { path: '/training', label: 'Training', icon: Activity },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/chat', label: 'AI Assistant', icon: MessageSquare },
];

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navbar-glass sticky top-0 z-50">
      <div className="container mx-auto px-6 h-14 flex items-center justify-between">

        {/* Brand / Logo */}
        <Link to="/" className="navbar-brand group flex items-center gap-2.5">
          <div className="navbar-logo-icon">
            {/* Realistic globe SVG icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="text-blue-400 group-hover:text-blue-300 transition-colors duration-300"
            >
              {/* Atmosphere glow */}
              <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.06" />
              {/* Globe outline */}
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.2" fill="none" />
              {/* Equator */}
              <ellipse cx="12" cy="12" rx="10" ry="3.5" stroke="currentColor" strokeWidth="0.7" fill="none" opacity="0.5" />
              {/* Meridian */}
              <ellipse cx="12" cy="12" rx="3.5" ry="10" stroke="currentColor" strokeWidth="0.7" fill="none" opacity="0.5" />
              {/* Latitude lines */}
              <ellipse cx="12" cy="7" rx="8.5" ry="2.5" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.3" />
              <ellipse cx="12" cy="17" rx="8.5" ry="2.5" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.3" />
              {/* Center vertical */}
              <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="0.5" opacity="0.25" />
              {/* Center horizontal */}
              <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="0.5" opacity="0.25" />
            </svg>
          </div>
          <span className="text-[17px] font-bold tracking-tight text-white/90 group-hover:text-white transition-colors duration-300">
            NebulaAI
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-0.5">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${active ? 'nav-link-active' : ''}`}
              >
                <Icon className="w-[15px] h-[15px]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/8 border border-emerald-500/15">
          <div className="w-[6px] h-[6px] rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium text-emerald-400/90 tracking-wide">Online</span>
        </div>

      </div>
    </nav>
  );
}
