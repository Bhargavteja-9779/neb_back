import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello! I am the NebulaAI Assistant. How can I help you optimize your computational cluster today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Mock AI Response after delay
    setTimeout(() => {
      let aiText = "I can certainly help with that.";
      const lowerInput = userMessage.text.toLowerCase();
      
      if (lowerInput.includes('train')) {
        aiText = "Based on current network topology, I suggest deploying the model to the primary cluster (Nodes 1-4) to minimize latency. The ResNet-50 architecture would be optimal for this distributed setup. Would you like me to initialize the job?";
      } else if (lowerInput.includes('node') || lowerInput.includes('status')) {
        aiText = "Currently, we have 12 active nodes contributing 142 CPU cores and 512GB of distributed RAM. Network trust is stable at 89%.";
      } else {
        aiText = "I have analyzed the request against NebulaAI's current load. We can allocate up to 45% of available compute without affecting active tasks.";
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiText
      }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col"
    >
      <div className="bg-[#20201F]/70 border border-white/5 p-4 rounded-t-2xl flex items-center gap-3 backdrop-blur-md shadow-inner">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center border border-brand/20 ">
          <Sparkles className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-white tracking-tight drop-shadow-sm">Nebula Architect (AI)</h2>
          <p className="text-xs text-gray-300/80">Powered by Distil-LLaMA Network</p>
        </div>
      </div>

      <div className="flex-1 glass-card border-t-0 rounded-t-none rounded-b-2xl p-6 overflow-y-auto flex flex-col gap-4">
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex gap-4 max-w-[80%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-inner ${
                msg.sender === 'user' ? 'bg-brand/10 text-brand' : 'bg-brand/10 text-brand'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
              </div>
              
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-md ${
                msg.sender === 'user' 
                  ? 'bg-brand/10 text-white rounded-tr-sm' 
                  : 'bg-white/[0.03] border border-white/[0.05] text-gray-200 rounded-tl-sm backdrop-blur-md'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 max-w-[80%]"
            >
              <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0 mt-1 shadow-inner">
                <Bot className="w-5 h-5" />
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] rounded-tl-sm flex items-center gap-1.5 h-[52px] shadow-md backdrop-blur-md">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 relative">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI to analyze network, suggest node allocation, or write training scripts..."
            className="w-full bg-[#0B0F1A]/80 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-white placeholder-gray-500 focus:outline-none focus:border-brand/20 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner backdrop-blur-md"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2 rounded-xl bg-brand text-[#141413] hover:bg-brand text-[#141413] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors "
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
