import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, RefreshCw, X } from 'lucide-react';
import { api, socket } from '../services/api';

export default function FailureSimulation() {
  const [toasts, setToasts] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    const handleNodeUpdate = (data) => {
      if (data.status === 'failed') {
        const id = Date.now();
        setToasts(prev => [...prev, {
          id,
          title: 'Critical Network Alert',
          message: `Node ${data.id.toUpperCase()} failed. Job reassigned automatically. Trust adjusted.`,
          type: 'error'
        }]);
        
        setTimeout(() => {
          setToasts(current => current.filter(t => t.id !== id));
        }, 5000);
      }
    };

    socket.on('node_update', handleNodeUpdate);
    return () => socket.off('node_update', handleNodeUpdate);
  }, []);

  const triggerFailure = async () => {
    setIsSimulating(true);
    await api.simulateNodeFailure();
    setIsSimulating(false);
  };

  return (
    <>
      <div className="fixed bottom-8 right-8 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={triggerFailure}
          disabled={isSimulating}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand/10 text-brand font-bold border border-brand/20  hover:bg-brand/10 backdrop-blur-md transition-all disabled:opacity-50"
        >
          {isSimulating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <AlertOctagon className="w-5 h-5 fill-current" />}
          Simulate Node Failure
        </motion.button>
      </div>

      <div className="fixed top-20 right-8 z-50 flex flex-col gap-3 max-w-sm">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="glass-card bg-brand/10 border border-brand/20 p-4 relative overflow-hidden flex gap-4 items-start shadow-2xl"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand/10" />
              <AlertOctagon className="w-6 h-6 text-brand shrink-0" />
              <div>
                <h4 className="font-bold text-red-100">{toast.title}</h4>
                <p className="text-sm text-gray-300/80 mt-1 leading-relaxed">{toast.message}</p>
              </div>
              <button 
                onClick={() => setToasts(current => current.filter(t => t.id !== toast.id))}
                className="absolute top-2 right-2 text-brand hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
