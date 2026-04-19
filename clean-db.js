require('dotenv').config({ path: './backend/.env' });
const { query, withTransaction } = require('./backend/src/lib/db');

async function cleanOperationalData() {
  console.log("🧹 Initializing Cleanup of Operational Data...");

  try {
    await withTransaction(async (dbClient) => {
      // 1. Delete Sales Data
      console.log("🗑️ Deleting Sales Items...");
      await query('DELETE FROM sale_items', [], dbClient);
      
      console.log("🗑️ Deleting Sales...");
      await query('DELETE FROM sales', [], dbClient);
      
      // Commented out stock_transactions assuming that table might not exist yet based on schema
      // console.log("🗑️ Deleting Stock Transactions...");
      // await query('DELETE FROM stock_transactions', [], dbClient);

      // 2. Reset Inventory without removing the master layout
      console.log("🔄 Resetting Inventory Quantities to ZERO...");
      await query('UPDATE inventory SET quantity = 0', [], dbClient);
    });

    console.log("✅ Cleanup Successful! Your Master Products, Variants and Users remain intact.");
    console.log("📦 Sales are totally empty, and all stock is now at 0.");
  } catch (err) {
    console.error("❌ Cleanup Failed:", err.message);
  } finally {
    process.exit(0);
  }
}

cleanOperationalData();
