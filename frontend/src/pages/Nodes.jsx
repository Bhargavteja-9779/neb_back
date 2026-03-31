import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import NodeCard from '../components/NodeCard';
import OrbitLoader from '../components/OrbitLoader';
import { RefreshCw, Search } from 'lucide-react';

export default function Nodes() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNodes = async () => {
    setLoading(true);
    const data = await api.getNodes();
    setNodes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand drop-shadow-sm">
            Compute Network
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Real-time status of distributed student laptops</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search nodes..." 
              className="bg-[#20201F] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-brand/20 text-white w-64 transition-all focus:ring-1 focus:ring-blue-500/50 shadow-inner"
            />
          </div>
          <button 
            onClick={fetchNodes}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand/10 text-brand hover:bg-brand/10 border border-brand/20 hover: transition-all font-medium text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[400px]">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full flex justify-center items-center"
            >
              <OrbitLoader />
            </motion.div>
          ) : (
            nodes.map((node, i) => (
              <NodeCard key={node.id} node={node} index={i} />
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
