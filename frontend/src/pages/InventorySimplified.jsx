/**
 * SIMPLIFIED INVENTORY COMPONENT
 * 
 * Clean table display showing:
 * - Product Name
 * - Size (if applicable)
 * - GSM (if applicable)
 * - Color (if applicable)
 * - Quantity
 * - Price
 * - Actions (Edit, Delete)
 */

import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

export const Inventory = () => {
  // ========================================================================
  // STATE
  // ========================================================================

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ quantity: 0, price: 0 });

  // Delete Confirmation
  const [deletingId, setDeletingId] = useState(null);

  // ========================================================================
  // LOAD INVENTORY
  // ========================================================================

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📦 Fetching inventory...');

      const res = await API.get('/inventory?limit=500');
      const data = res.data.data || [];

      console.log(`✅ Loaded ${data.length} inventory items`);
      setItems(data);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      console.error('❌ Error loading inventory:', errorMsg);
      setError(errorMsg);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // EDIT FUNCTIONS
  // ========================================================================

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({
      quantity: item.quantity,
      price: item.price
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ quantity: 0, price: 0 });
  };

  const saveEdit = async () => {
    if (editForm.quantity < 0 || editForm.price < 0) {
      toast.error('Quantity and price must be >= 0');
      return;
    }

    try {
      console.log('💾 Updating inventory item...');
      await API.put(`/inventory/${editingId}`, editForm);

      // Update local state
      setItems(items.map(item =>
        item._id === editingId
          ? { ...item, ...editForm }
          : item
      ));

      toast.success('Inventory updated');
      cancelEdit();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      console.error('❌ Error updating:', errorMsg);
      toast.error('Failed to update inventory');
    }
  };

  // ========================================================================
  // DELETE FUNCTIONS
  // ========================================================================

  const confirmDelete = (itemId) => {
    setDeletingId(itemId);
  };

  const cancelDelete = () => {
    setDeletingId(null);
  };

  const deleteItem = async () => {
    if (!deletingId) return;

    try {
      console.log('🗑️  Deleting inventory item...');
      await API.delete(`/inventory/${deletingId}`);

      setItems(items.filter(item => item._id !== deletingId));
      toast.success('Item deleted');
      cancelDelete();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      console.error('❌ Error deleting:', errorMsg);
      toast.error('Failed to delete item');
    }
  };

  // ========================================================================
  // HELPER FUNCTIONS
  // ========================================================================

  const getProductDisplay = (product) => {
    const parts = [product.productName];
    if (product.gsm) parts.push(`${product.gsm}GSM`);
    if (product.size) parts.push(product.size);
    if (product.color) parts.push(product.color);
    return parts.join(' | ');
  };

  const isLowStock = (item) => item.quantity < (item.minimumStockLevel || 50);

  // ========================================================================
  // RENDER
  // ========================================================================

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-2">
            {items.length} products | {items.reduce((sum, i) => sum + i.quantity, 0)} total units
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-600 rounded">
            <p className="text-red-700">❌ {error}</p>
          </div>
        )}

        {/* TABLE */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Product</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">Quantity</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">Price (₹)</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">Stock Value (₹)</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No inventory items found. Run seed script first.
                    </td>
                  </tr>
                ) : (
                  items.map(item => {
                    const product = item.productId;
                    const low = isLowStock(item);
                    const stockValue = item.quantity * item.price;

                    return (
                      <tr key={item._id} className="border-b hover:bg-gray-50 transition-colors">
                        {/* PRODUCT NAME */}
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {getProductDisplay(product)}
                        </td>

                        {/* QUANTITY */}
                        {editingId === item._id ? (
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={editForm.quantity}
                              onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                              className="w-24 px-2 py-1 border-2 border-blue-600 rounded focus:outline-none"
                            />
                          </td>
                        ) : (
                          <td className={`px-6 py-4 text-right font-semibold ${low ? 'text-red-600' : 'text-gray-900'}`}>
                            {item.quantity}
                            {low && ' ⚠️'}
                          </td>
                        )}

                        {/* PRICE */}
                        {editingId === item._id ? (
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editForm.price}
                              onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                              className="w-24 px-2 py-1 border-2 border-blue-600 rounded focus:outline-none"
                            />
                          </td>
                        ) : (
                          <td className="px-6 py-4 text-right text-gray-900">
                            ₹{item.price.toFixed(2)}
                          </td>
                        )}

                        {/* STOCK VALUE */}
                        <td className="px-6 py-4 text-right text-gray-900 font-semibold">
                          ₹{stockValue.toFixed(2)}
                        </td>

                        {/* STATUS */}
                        <td className="px-6 py-4 text-center">
                          {item.quantity === 0 ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                              <AlertCircle className="w-4 h-4" />
                              Out
                            </span>
                          ) : low ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                              <AlertCircle className="w-4 h-4" />
                              Low
                            </span>
                          ) : (
                            <span className="inline-flex px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              ✓ OK
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-center">
                            {editingId === item._id ? (
                              <>
                                <button
                                  onClick={saveEdit}
                                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm font-medium"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(item)}
                                  className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => confirmDelete(item._id)}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DELETE CONFIRMATION MODAL */}
        {deletingId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this item?</p>
              <div className="flex gap-3">
                <button
                  onClick={deleteItem}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                >
                  Delete
                </button>
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
