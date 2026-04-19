const express = require('express');
const router = express.Router();
const { query, withTransaction } = require('../lib/db');

// Reset Database API Endpoint - Wipes Operational Data, Keeps Master Data
// Endpoint: POST /api/system/reset
router.post('/reset', async (req, res) => {
  try {
    const { confirmReset } = req.body;
    
    // Safety check BEFORE obliterating data!
    if (confirmReset !== 'YES_RESET_SYSTEM') {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing or invalid confirmation flag. Must send { "confirmReset": "YES_RESET_SYSTEM" }' 
      });
    }

    await withTransaction(async (dbClient) => {
      // 1. Delete all sales and their items entirely from the system
      await query('DELETE FROM sale_items', [], dbClient);
      await query('DELETE FROM sales', [], dbClient);
      
      // If there are stock_transactions in your system, uncomment below:
      // await query('DELETE FROM stock_transactions', [], dbClient);

      // 2. Reset the inventory stock to exactly ZERO
      await query('UPDATE inventory SET quantity = 0', [], dbClient);
    });

    res.status(200).json({ 
      success: true, 
      message: 'System has been fully reset. Sales wiped, Inventory set to 0. Master Products retained.' 
    });
  } catch (error) {
    console.error('System Reset Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset system.',
      error: error.message 
    });
  }
});

module.exports = router;
