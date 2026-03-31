import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Play, Square, Activity, Cpu, Database, Network } from 'lucide-react';
import { api, socket } from '../services/api';

export default function Training() {
  const [isTraining, setIsTraining] = useState(false);
  const [metrics, setMetrics] = useState({ epoch: 0, accuracy: 0, loss: 0 });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const handleMetrics = (data) => {
      setMetrics(data);
      setHistory(prev => {
        const newHistory = [...prev, { epoch: data.epoch, accuracy: data.accuracy, loss: data.loss }];
        // Keep last 20 data points for performance and visualization
        if (newHistory.length > 20) return newHistory.slice(newHistory.length - 20);
        return newHistory;
      });
    };

    socket.on('training_metrics', handleMetrics);
    return () => socket.off('training_metrics', handleMetrics);
  }, []);

  const handleStartTraining = async () => {
    setIsTraining(true);
    setHistory([]);
    await api.submitJob();
  };

  const handleStopTraining = () => {
    setIsTraining(false);
    // In real app, call api.stopJob()
  };

  const progress = Math.min(100, (metrics.epoch / 50) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center bg-[#20201F]/70 p-6 rounded-2xl border border-white/5 backdrop-blur-md shadow-inner">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand drop-shadow-sm">
            Distributed Model Training
          </h1>
          <p className="text-gray-400 mt-2 flex items-center gap-2 text-sm">
            <Network className="w-4 h-4 text-brand" /> ResNet-50 on 12 distributed nodes
          </p>
        </div>
        
        <div className="flex gap-4">
          {!isTraining ? (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartTraining}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand/10 text-white font-medium shadow-md border border-brand/20"
            >
              <Play className="w-5 h-5 fill-current" />
              Initialize Training
            </motion.button>
          ) : (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStopTraining}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand/10 text-brand font-medium  border border-brand/20 hover:bg-brand/10"
            >
              <Square className="w-5 h-5 fill-current" />
              Terminate Job
            </motion.button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 flex flex-col justify-center items-center relative overflow-hidden group">
          <Activity className="absolute -right-4 -top-4 w-24 h-24 text-brand/10 group-hover:text-brand/20 transition-colors" />
          <h3 className="text-gray-400 text-sm font-medium mb-1">Status</h3>
          <p className={`text-2xl font-bold ${isTraining ? 'text-green-400' : 'text-gray-300'}`}>
            {isTraining ? 'TRAINING' : 'IDLE'}
          </p>
          {isTraining && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500/20">
              <div className="h-full bg-green-500 w-1/3 animate-[pulse_1s_ease-in-out_infinite]" />
            </div>
          )}
        </div>
        
        <div className="glass-card p-6 flex flex-col justify-center items-center">
          <h3 className="text-gray-400 text-sm font-medium mb-1">Current Epoch</h3>
          <p className="text-3xl font-bold text-white font-mono">{metrics.epoch} <span className="text-base text-gray-500">/ 50</span></p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-center items-center">
          <h3 className="text-gray-400 text-sm font-medium mb-1">Accuracy</h3>
          <p className="text-3xl font-bold text-brand font-mono">{metrics.accuracy.toFixed(1)}%</p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-center items-center">
          <h3 className="text-gray-400 text-sm font-medium mb-1">Loss</h3>
          <p className="text-3xl font-bold text-indigo-400 font-mono">{metrics.loss.toFixed(4)}</p>
        </div>
      </div>

      {isTraining && (
        <div className="glass-card p-6">
          <div className="flex justify-between items-end mb-2">
            <h3 className="text-sm font-medium text-gray-400">Overall Progress</h3>
            <span className="text-xs text-indigo-300 font-mono">{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-[#0B0F1A] rounded-full h-2 overflow-hidden border border-white/5 shadow-inner">
            <motion.div 
              className="bg-brand/10 h-2 rounded-full relative "
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress_1s_linear_infinite]" />
            </motion.div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 h-[400px]">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2 drop-shadow-sm">
            <Activity className="w-5 h-5 text-brand" />
            Accuracy Tracking
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.5} vertical={false} />
                <XAxis dataKey="epoch" stroke="#64748B" tick={{fill: '#475569', fontSize: 12}} />
                <YAxis stroke="#64748B" domain={[0, 100]} tick={{fill: '#475569', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#20201F', borderColor: '#1E293B', borderRadius: '8px' }}
                  itemStyle={{ color: '#3B82F6' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#3B82F6', stroke: '#0B0F1A', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="glass-card p-6 h-[400px]">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2 drop-shadow-sm">
            <Activity className="w-5 h-5 text-brand" />
            Loss Convergence
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.5} vertical={false} />
                <XAxis dataKey="epoch" stroke="#64748B" tick={{fill: '#475569', fontSize: 12}} />
                <YAxis stroke="#64748B" domain={[0, 'auto']} tick={{fill: '#475569', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#20201F', borderColor: '#1E293B', borderRadius: '8px' }}
                  itemStyle={{ color: '#8B5CF6' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="loss" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#8B5CF6', stroke: '#0B0F1A', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
