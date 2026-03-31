// Mock Data Service
const USE_MOCK = true; // Toggle this for real backend

let MOCK_NODES = Array.from({ length: 12 }).map((_, i) => ({
  id: `node_${i + 1}`,
  cpu: Math.floor(Math.random() * 32) + 4,
  ram: Math.floor(Math.random() * 64) + 8,
  trust: Math.floor(Math.random() * 50) + 50,
  status: Math.random() > 0.2 ? 'active' : (Math.random() > 0.5 ? 'busy' : 'failed'),
  credits: Math.floor(Math.random() * 1000)
}));

let MOCK_TRAINING_STATE = {
  epoch: 0,
  accuracy: 10,
  loss: 2.5,
  isTraining: false,
};

export const api = {
  getNodes: async () => {
    if (USE_MOCK) return new Promise(res => setTimeout(() => res([...MOCK_NODES]), 300));
    // Implementation for real API 
  },
  
  getJobStatus: async () => {
    if (USE_MOCK) return new Promise(res => setTimeout(() => res({ ...MOCK_TRAINING_STATE }), 200));
  },
  
  submitJob: async () => {
    if (USE_MOCK) {
      MOCK_TRAINING_STATE.isTraining = true;
      MOCK_TRAINING_STATE.epoch = 0;
      MOCK_TRAINING_STATE.accuracy = 10;
      MOCK_TRAINING_STATE.loss = 2.5;
      return new Promise(res => setTimeout(() => res({ success: true }), 500));
    }
  },

  simulateNodeFailure: async () => {
    if (USE_MOCK) {
      const activeNodes = MOCK_NODES.filter(n => n.status === 'active' || n.status === 'busy');
      if (activeNodes.length > 0) {
        const target = activeNodes[Math.floor(Math.random() * activeNodes.length)];
        target.status = 'failed';
        target.trust = Math.max(0, target.trust - 15);
        
        // Emit global event
        socket.emit('node_update', { id: target.id, status: 'failed' });
        
        return new Promise(res => setTimeout(() => res({ success: true, failedNode: target.id }), 200));
      }
      return { success: false };
    }
  },

  simulateNodeJoin: async () => {
    if (USE_MOCK) {
      const newNode = {
        id: `node_new_${Math.floor(Math.random() * 1000)}`,
        cpu: 16,
        ram: 32,
        trust: 100,
        status: 'active',
        credits: 0
      };
      MOCK_NODES.push(newNode);
      socket.emit('node_joined', { id: newNode.id });
      return new Promise(res => setTimeout(() => res({ success: true, node: newNode }), 300));
    }
  }
};

// Simple Mock Event Emitter for WebSockets
class MockSocket {
  constructor() {
    this.listeners = {};
    if (USE_MOCK) {
      setInterval(() => {
        if (MOCK_TRAINING_STATE.isTraining) {
          MOCK_TRAINING_STATE.epoch += 1;
          MOCK_TRAINING_STATE.accuracy = Math.min(99.9, MOCK_TRAINING_STATE.accuracy + Math.random() * 2);
          MOCK_TRAINING_STATE.loss = Math.max(0.01, MOCK_TRAINING_STATE.loss - Math.random() * 0.1);
          
          this.emit('training_metrics', { ...MOCK_TRAINING_STATE });
          
          if (MOCK_TRAINING_STATE.epoch > 50) {
            MOCK_TRAINING_STATE.isTraining = false;
          }
        }
      }, 1000);
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

export const socket = new MockSocket();
