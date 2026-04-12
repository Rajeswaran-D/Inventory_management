/**
 * REAL-TIME SYNC SERVICE
 * Implements a simple Event Emitter for frontend synchronization
 * Tracks data changes via polling and triggers UI updates
 */

import { saleService } from './api';

class RealTimeSyncService {
  constructor() {
    this.listeners = {};
    this.isPolling = false;
    this.lastSaleId = null;
    this.pollInterval = 5000;
    this.errorCount = 0;
    this.maxErrorThreshold = 3;
    this.pollTimeout = null;
  }

  /**
   * 🎯 TASK 1: IMPLEMENT EVENT SYSTEM
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    // Return unsubscribe function for cleanup
    return () => this.off(event, callback);
  }

  // Alias for legacy code
  subscribe(event, callback) {
    return this.on(event, callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error(`❌ Error in real-time listener [${event}]:`, err);
      }
    });
  }

  /**
   * START POLLING
   */
  async startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    this.runPoll();
  }

  async runPoll() {
    if (!this.isPolling) return;

    try {
      const res = await saleService.getAll({ limit: 1 });
      const sales = res.data?.data || res.data || [];
      const latestSale = sales[0];

      // Reset error count on success
      this.errorCount = 0;
      this.pollInterval = 5000; 

      if (latestSale && latestSale._id !== this.lastSaleId) {
        this.lastSaleId = latestSale._id;
        
        // 🎯 TASK 2: EMIT UPDATE EVENT
        this.emit('update', latestSale);
        
        // Specific events for modules
        this.emit('sale', latestSale);
        this.emit('inventory', { type: 'stock_updated', sale: latestSale });
        this.emit('dashboard', { type: 'refresh' });
        
        console.log('🔄 Real-time sync: Data change detected');
      }
    } catch (err) {
      this.errorCount++;
      // Exponential backoff
      this.pollInterval = Math.min(this.pollInterval * 2, 60000); 
      
      if (this.errorCount >= this.maxErrorThreshold) {
        this.pollInterval = 60000;
      }
    }

    // Scheduling next poll
    if (this.isPolling) {
      this.pollTimeout = setTimeout(() => this.runPoll(), this.pollInterval);
    }
  }

  /**
   * 🎯 TASK 3: ENSURE CLEANUP
   */
  stopPolling() {
    this.isPolling = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    console.log('🛑 Real-time polling stopped');
  }
}

export const realTimeSyncService = new RealTimeSyncService();
export default realTimeSyncService;

// Auto-initialization in browser
if (typeof window !== 'undefined') {
  window.realTimeSync = realTimeSyncService;
  // Delay startup to allow other services to initialize
  setTimeout(() => realTimeSyncService.startPolling(), 3000);
}
