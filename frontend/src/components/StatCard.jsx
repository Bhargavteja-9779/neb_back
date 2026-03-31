import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

export default function StatCard({ title, value, icon: Icon, colorClass, suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseFloat(value);
    if (isNaN(end)) {
      setDisplayValue(value);
      return;
    }
    
    const duration = 1500; // ms
    const incrementTime = 30; // ms
    const steps = duration / incrementTime;
    const increment = end / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className={`glass-card p-6 relative overflow-hidden group`}
    >
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1 tracking-wide">{title}</p>
          <h3 className="text-3xl font-bold text-white tracking-tight">
            {displayValue}{suffix}
          </h3>
        </div>
        <div className={`p-3 rounded-xl bg-white/5 border border-white/10 shadow-inner backdrop-blur-sm ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {/* Soft Background Glow inside the card */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 blur-3xl opacity-20 pointer-events-none ${colorClass.replace('text-', 'bg-')}`} />
      
      {/* Bottom accent line hover effect */}
      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand/10 group-hover:w-full transition-all duration-500 ease-in-out" />
    </motion.div>
  );
}
