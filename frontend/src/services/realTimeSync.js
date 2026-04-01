/**
 * REAL-TIME SYNC SERVICE
 * Manages real-time data synchronization across all modules
 * Billing → Inventory → Sales History → Dashboard
 */

import { saleService } from './api';

class RealTimeSyncService {
  constructor() {
    this.listeners = {};
    this.isPolling = false;
    this.lastSaleId = null;
    this.pollInterval = 5000; // 5 seconds
  }

  /**
   * Register a listener for real-time updates
   * @param {string} eventType - 'sale', 'inventory', 'dashboard', 'reports'
   * @param {Function} callback - Function to call when data updates
   */
  subscribe(eventType, callback) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[eventType] = this.listeners[eventType].filter(cb => cb !== callback);
    };
  }

  /**
   * Alias for subscribe - EventEmitter-style .on() method
   */
  on(eventType, callback) {
    return this.subscribe(eventType, callback);
  }

  /**
   * Alias for unsubscribe - EventEmitter-style .off() method
   */
  off(eventType, callback) {
    if (!this.listeners[eventType]) return;
    this.listeners[eventType] = this.listeners[eventType].filter(cb => cb !== callback);
  }

  /**
   * Emit updates to all listeners
   * @param {string} eventType - Type of event
   * @param {*} data - Data to pass to listeners
   */
  emit(eventType, data) {
    if (!this.listeners[eventType]) return;
    this.listeners[eventType].forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error(`Error in listener for ${eventType}:`, err);
      }
    });
  }

  /**
   * Start polling for new sales
   */
  startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;

    const poll = async () => {
      try {
        const res = await saleService.getAll({ limit: 1 });
        const sales = res.data?.data || res.data || [];
        const latestSale = sales[0];

        if (latestSale && latestSale._id !== this.lastSaleId) {
          this.lastSaleId = latestSale._id;
          
          // Emit updates to all listeners
          this.emit('sale', latestSale);
          this.emit('inventory', { type: 'stock_updated', sale: latestSale });
          this.emit('dashboard', { type: 'refresh' });
          this.emit('reports', { type: 'new_sale', sale: latestSale });

          console.log('🔄 Real-time sync triggered for new sale:', latestSale._id);
        }
      } catch (err) {
        console.error('Error in polling:', err);
      }

      if (this.isPolling) {
        setTimeout(poll, this.pollInterval);
      }
    };

    poll();
  }

  /**
   * Stop polling
   */
  stopPolling() {
    this.isPolling = false;
  }

  /**
   * Trigger immediate update
   * @param {string} eventType - Type of event
   */
  async triggerUpdate(eventType) {
    try {
      if (eventType === 'dashboard' || eventType === 'reports') {
        this.emit(eventType, { type: 'refresh' });
      }
    } catch (err) {
      console.error(`Error triggering update for ${eventType}:`, err);
    }
  }

  /**
   * Get current polling status
   */
  getStatus() {
    return {
      isPolling: this.isPolling,
      pollInterval: this.pollInterval,
      listeners: Object.keys(this.listeners).map(key => ({
        type: key,
        count: this.listeners[key].length
      }))
    };
  }
}

// Export singleton instance
export const realTimeSyncService = new RealTimeSyncService();

// Also export as default for easier imports
export default new RealTimeSyncService();

// Auto-start polling in production
if (typeof window !== 'undefined') {
  window.realTimeSync = realTimeSyncService;
  // Start polling when app loads
  document.addEventListener('DOMContentLoaded', () => {
    realTimeSyncService.startPolling();
    console.log('✅ Real-time sync service initialized');
  });
}
