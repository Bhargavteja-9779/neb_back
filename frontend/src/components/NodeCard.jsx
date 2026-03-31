import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Server, Database, Shield, Zap, AlertCircle } from 'lucide-react';

export default function NodeCard({ node, index }) {
  const isFailed = node.status === 'failed';
  const isBusy = node.status === 'busy';
  const isActive = node.status === 'active';

  const getStatusColor = () => {
    if (isFailed) return 'text-brand border-brand/20 bg-brand/10 shadow-inner';
    if (isBusy) return 'text-brand border-brand/20 bg-brand/10 shadow-inner';
    return 'text-brand border-brand/20 bg-brand/10 shadow-inner';
  };

  const getBadgeColor = () => {
    if (node.trust > 90) return 'text-gray-300 bg-brand/10 border-brand/20'; // Gold
    if (node.trust > 70) return 'text-slate-300 bg-slate-500/10 border-slate-500/20'; // Silver
    return 'text-orange-400 bg-orange-500/10 border-orange-500/20'; // Bronze
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ scale: 1.02, zIndex: 10 }}
      className={`glass-card p-5 relative overflow-hidden group`}
    >
      {/* Background glow specific to card */}
      <div className={`absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-10 transition duration-500 bg-gradient-to-br ${isFailed ? 'from-red-500 to-transparent' : 'from-blue-600 to-violet-600'} blur-xl`} />
      
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <Server className={`w-5 h-5 ${isFailed ? 'text-brand' : 'text-brand group-hover:text-gray-300'} transition-colors duration-300`} />
          <h3 className="text-lg font-bold text-white tracking-widest">{node.id}</h3>
        </div>
        
        <div className={`px-3 py-1 rounded-full border text-[10px] tracking-wider font-bold flex items-center gap-1.5 ${getStatusColor()}`}>
          {isFailed && <AlertCircle className="w-3 h-3" />}
          {isBusy && <Zap className="w-3 h-3 animate-pulse" />}
          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse " />}
          <span className="uppercase">{node.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="flex flex-col gap-1">
          <span className="text-gray-400 text-xs flex items-center gap-1"><Cpu className="w-3 h-3"/> CPU</span>
          <span className="text-white font-medium">{node.cpu} Cores</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-gray-400 text-xs flex items-center gap-1"><Database className="w-3 h-3"/> RAM</span>
          <span className="text-white font-medium">{node.ram} GB</span>
        </div>
      </div>

      <div className="relative z-10 pt-4 border-t border-white/[0.03] flex justify-between items-center">
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${getBadgeColor()} shadow-inner`}>
          <Shield className="w-3 h-3" />
          <span className="text-xs font-bold font-mono">T:{node.trust}</span>
        </div>
        
        <div className="flex items-center gap-1.5 text-gray-300/80">
          <Zap className="w-4 h-4 text-brand" />
          <span className="text-sm font-bold font-mono group-hover:text-gray-300 transition-colors">{node.credits} CR</span>
        </div>
      </div>
      
      {/* Bottom line hover effect */}
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-brand/10 opacity-0 group-hover:opacity-100 transition-all duration-300" />
    </motion.div>
  );
}
