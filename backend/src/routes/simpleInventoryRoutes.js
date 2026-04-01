const express = require("express");
const router = express.Router();
const simpleInventoryController = require("../controllers/simpleInventoryController");

// Add inventory item
router.post("/add", simpleInventoryController.addSimpleInventoryItem);

// Get all inventory items
router.get("/all", simpleInventoryController.getAllSimpleInventoryItems);

// Get product names
router.get("/products/names", simpleInventoryController.getSimpleProductNames);

// Get variants for a product
router.get("/product/:productName/variants", simpleInventoryController.getSimpleVariantsForProduct);

// Search inventory
router.get("/search", simpleInventoryController.searchSimpleInventory);

// Update inventory item
router.put("/update/:id", simpleInventoryController.updateSimpleInventoryItem);

// Delete inventory item
router.delete("/delete/:id", simpleInventoryController.deleteSimpleInventoryItem);

module.exports = router;
