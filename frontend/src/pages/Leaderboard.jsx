import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowUp, ArrowDown, Minus, Shield, Zap } from 'lucide-react';
import { api } from '../services/api';

export default function Leaderboard() {
  const [nodes, setNodes] = useState([]);
  
  useEffect(() => {
    const fetchNodes = async () => {
      let data = await api.getNodes();
      data = data.map(n => ({
        ...n, 
        jobsCompleted: Math.floor(Math.random() * 50) + 10,
        trend: Math.random() > 0.6 ? 'up' : (Math.random() > 0.5 ? 'down' : 'stable')
      }));
      data.sort((a, b) => b.trust - a.trust);
      setNodes(data);
    };
    fetchNodes();
    
    const interval = setInterval(async () => {
      fetchNodes();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getMedal = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return <span className="text-gray-500 text-sm font-bold">#{index + 1}</span>;
  };

  const getTrustColor = (index) => {
    if (index === 0) return 'from-yellow-400 to-amber-500';
    if (index === 1) return 'from-gray-300 to-gray-400';
    if (index === 2) return 'from-amber-600 to-orange-500';
    return 'from-blue-500 to-blue-400';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1200px] mx-auto px-4 py-8 space-y-8"
    >
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.08)]">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Global Leaderboard
          </h1>
        </div>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Top contributing student nodes ranked by trust score
        </p>
      </div>

      {/* Top 3 Podium Cards */}
      {nodes.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {[1, 0, 2].map((podiumIdx) => {
            const node = nodes[podiumIdx];
            if (!node) return null;
            const isFirst = podiumIdx === 0;
            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: podiumIdx * 0.15 }}
                className={`relative rounded-2xl border p-6 text-center backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] ${
                  isFirst 
                    ? 'bg-yellow-400/[0.04] border-yellow-400/20 shadow-[0_0_40px_rgba(234,179,8,0.06)] md:order-2 md:-mt-4' 
                    : 'bg-white/[0.03] border-white/[0.06] md:mt-4'
                } ${podiumIdx === 1 ? 'md:order-1' : ''} ${podiumIdx === 2 ? 'md:order-3' : ''}`}
              >
                <div className="text-3xl mb-3">{getMedal(podiumIdx)}</div>
                <p className="font-mono font-bold text-white text-lg uppercase mb-1">{node.id}</p>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getTrustColor(podiumIdx)} text-black`}>
                  Trust {node.trust}
                </div>
                <div className="mt-4 flex justify-center gap-6 text-xs text-gray-400">
                  <div>
                    <p className="text-white font-bold text-sm">{node.jobsCompleted}</p>
                    <p>Jobs</p>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{node.credits}</p>
                    <p>Credits</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Node ID</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Trust Score</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Jobs</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Credits</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Trend</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {nodes.slice(3).map((node, index) => (
                  <motion.tr
                    key={node.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.04] text-xs font-bold text-gray-400 group-hover:text-white transition-colors">
                        {index + 4}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-white/90 uppercase text-sm">{node.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-blue-400/70" />
                        <span className="font-semibold text-sm">{node.trust}</span>
                        <div className="w-full max-w-[80px] h-1 bg-white/[0.06] rounded-full ml-1">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400" 
                            style={{ width: `${node.trust}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {node.jobsCompleted}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-300 text-sm flex items-center gap-1 group-hover:text-blue-400 transition-colors">
                      <Zap className="w-3.5 h-3.5" />
                      {node.credits} 
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center">
                        {node.trend === 'up' && <ArrowUp className="w-4 h-4 text-emerald-400" />}
                        {node.trend === 'down' && <ArrowDown className="w-4 h-4 text-red-400/70" />}
                        {node.trend === 'stable' && <Minus className="w-4 h-4 text-gray-600" />}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
