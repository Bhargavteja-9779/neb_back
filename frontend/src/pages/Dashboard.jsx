import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Server, Cpu, Zap, PlusCircle, Play } from 'lucide-react';
import ComputeVisualization from '../components/ComputeVisualization';
import { api, socket } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ nodes: 0, cpu: 0, ram: 0, jobs: 0 });
  const [isJoining, setIsJoining] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      const nodes = await api.getNodes();
      const totalCpu = nodes.reduce((acc, curr) => acc + curr.cpu, 0);
      const totalRam = nodes.reduce((acc, curr) => acc + curr.ram, 0);
      const activeJobs = nodes.filter(n => n.status === 'busy').length;
      
      setStats({
        nodes: nodes.length,
        cpu: totalCpu,
        ram: totalRam,
        jobs: activeJobs > 0 ? activeJobs : 1
      });
    };

    fetchStats();

    const handleNodeJoin = () => {
      setStats(prev => ({
        ...prev,
        nodes: prev.nodes + 1,
        cpu: prev.cpu + 16,
        ram: prev.ram + 32,
      }));
    };

    socket.on('node_joined', handleNodeJoin);
    return () => socket.off('node_joined', handleNodeJoin);
  }, []);

  const handleJoinNetwork = async () => {
    setIsJoining(true);
    await api.simulateNodeJoin();
    setTimeout(() => setIsJoining(false), 800);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-10 pb-20 max-w-[1400px] mx-auto px-4 font-sans"
    >
      {/* Centered Hero Section */}
      <div className="w-full flex flex-col items-center text-center pt-8 md:pt-12 relative">
        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="z-10 mb-[-40px]"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white mb-4 leading-tight">
            NebulaAI
          </h1>
          <p className="text-lg md:text-xl font-medium text-gray-400 tracking-widest uppercase opacity-80">
            Autonomous Student AI Supercomputer
          </p>
        </motion.div>
        
        {/* Dominant Centered Globe */}
        <div className="w-full h-[500px] md:h-[750px] relative mt-10 md:mt-2 opacity-95 hover:opacity-100 transition-opacity duration-1000">
           <ComputeVisualization isTraining={isTraining} />
        </div>
      </div>

      {/* Centered Metrics Section */}
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-10 py-8 px-12 bg-[#18181B]/60 border border-white/5 rounded-3xl backdrop-blur-xl"
      >
         {/* Node Data - Green */}
         <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.05)]">
               <Server className="w-7 h-7 text-[#22C55E]" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Active Nodes</p>
              <p className="text-4xl font-black text-white leading-none">{stats.nodes.toLocaleString()}</p>
            </div>
         </div>
         
         <div className="w-px h-14 bg-white/5 hidden md:block" />
         
         {/* Info Data - Blue */}
         <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.05)]">
               <Cpu className="w-7 h-7 text-[#3B82F6]" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Total Logic Elements</p>
              <p className="text-4xl font-black text-white leading-none flex items-baseline gap-2">
                {stats.cpu.toLocaleString()} 
                <span className="text-[13px] text-[#3B82F6]/70 uppercase tracking-widest font-bold">Cores</span>
              </p>
            </div>
         </div>
         
         <div className="w-px h-14 bg-white/5 hidden md:block" />
         
         {/* Warning/Highlight Data - Yellow */}
         <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-[#EAB308]/10 border border-[#EAB308]/20 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.05)]">
               <Zap className="w-7 h-7 text-[#EAB308]" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Network Trust</p>
              <p className="text-4xl font-black text-white leading-none flex items-baseline gap-2">
                89 
                <span className="text-[13px] text-[#EAB308]/70 uppercase tracking-widest font-bold">%</span>
              </p>
            </div>
         </div>
      </motion.div>

      {/* Centered Symmetrical Quick Actions */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-5 w-full max-w-2xl"
      >
         <motion.button 
           whileHover={{ scale: 1.02, y: -2 }}
           whileTap={{ scale: 0.98 }}
           onClick={handleJoinNetwork}
           className="flex-1 flex items-center justify-center gap-4 bg-[#18181B] text-white rounded-2xl font-bold text-base hover:bg-[#202023] transition-all border border-white/5 hover:border-[#22C55E]/30 p-6 group shadow-lg"
         >
           <PlusCircle className="w-5 h-5 text-[#22C55E] group-hover:scale-110 transition-transform" /> 
           Join Network Compute
         </motion.button>
         
         <motion.button 
           whileHover={{ scale: 1.02, y: -2 }}
           whileTap={{ scale: 0.98 }}
           onClick={() => setIsTraining(!isTraining)}
           className={`flex-1 flex items-center justify-center gap-4 rounded-2xl font-bold text-base transition-all border p-6 group shadow-lg ${
             isTraining 
             ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/40 shadow-[0_0_20px_rgba(139,92,246,0.15)]' 
             : 'bg-[#18181B] text-gray-300 border-white/5 hover:bg-[#202023] hover:text-white hover:border-[#8B5CF6]/30'
           }`}
         >
           <Play className={`w-5 h-5 ${isTraining ? 'text-[#8B5CF6] fill-[#8B5CF6]/20' : 'text-gray-500'} group-hover:scale-110 transition-transform`} /> 
           {isTraining ? 'Training Active...' : 'Start Training'}
         </motion.button>
      </motion.div>
    </motion.div>
  );
}
