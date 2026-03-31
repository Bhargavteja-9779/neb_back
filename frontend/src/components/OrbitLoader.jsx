import React from 'react';
import { motion } from 'framer-motion';

export default function OrbitLoader() {
  return (
    <div className="flex justify-center items-center h-48 w-full">
      <div className="relative w-24 h-24">
        {/* Core */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 m-auto w-6 h-6 bg-brand text-[#141413] rounded-full "
        />
        
        {/* Ring 1 */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 w-full h-full border border-brand/20 rounded-full border-t-blue-400"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full " />
        </motion.div>
        
        {/* Ring 2 */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 border border-brand/20 rounded-full border-b-violet-400"
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-violet-400 rounded-full " />
        </motion.div>
      </div>
    </div>
  );
}
