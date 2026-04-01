import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Edit, Trash2, AlertCircle, Search } from 'lucide-react';
import { inventoryService } from '../services/api';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import useToast from '../hooks/useToast';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export const Inventory = () => {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updateForm, setUpdateForm] = useState({ quantity: 0, price: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Fetch inventory
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await inventoryService.getAll({});
      let productsData = Array.isArray(res.data) ? res.data : res.data?.data || [];
      
      setProducts(productsData);
      applySearch(productsData, searchQuery);
      
      if (productsData.length > 0) {
        toast.info(`✅ Loaded ${productsData.length} products`);
      }
    } catch (err) {
      console.error('❌ Error fetching inventory:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to load inventory';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, toast]);

  // Apply search filter
  const applySearch = (data, query) => {
    if (!query.trim()) {
      setFilteredProducts(data);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = data.filter(p => {
      const variant = p.variant || p.variantId || {};
      const productMaster = variant.productId || {};
      const searchStr = `
        ${variant.displayName || ''} 
        ${productMaster.name || ''} 
        ${variant.size || ''} 
        ${variant.gsm || ''} 
        ${variant.color || ''}
      `.toLowerCase();
      return searchStr.includes(lowerQuery);
    });

    setFilteredProducts(filtered);
  };

  // Handle search input
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    applySearch(products, query);
  };

  // Auto-refresh setup
  useEffect(() => {
    fetchInventory();
    
    if (autoRefreshEnabled) {
      const interval = setInterval(() => {
        fetchInventory();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefreshEnabled, fetchInventory]);

  // Update product
  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;
    
    if (updateForm.quantity < 0 || updateForm.price < 0) {
      toast.error('Quantity and Price cannot be negative');
      return;
    }

    try {
      setIsSubmitting(true);
      await inventoryService.update(selectedProduct._id, updateForm);
      toast.success('✅ Inventory updated successfully');
      setShowUpdateModal(false);
      setSelectedProduct(null);
      await fetchInventory();
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error(err?.response?.data?.message || 'Failed to update inventory');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      setIsSubmitting(true);
      await inventoryService.delete(selectedProduct._id);
      toast.success('✅ Inventory item deleted');
      setShowDeleteConfirm(false);
      setSelectedProduct(null);
      await fetchInventory();
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error(err?.response?.data?.message || 'Failed to delete inventory');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get stock status
  const getStockStatus = (quantity, minimum) => {
    if (quantity < minimum) return { color: 'text-red-600', label: 'Low', bg: 'bg-red-50' };
    if (quantity < minimum * 2) return { color: 'text-amber-600', label: 'Medium', bg: 'bg-amber-50' };
    return { color: 'text-green-600', label: 'Good', bg: 'bg-green-50' };
  };

  const displayProducts = filteredProducts.length > 0 || searchQuery === '' ? filteredProducts : [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          📦 Inventory Management
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage products and stock levels efficiently
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">{error}</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">Check browser console for details</p>
          </div>
        </div>
      )}

      {/* Search & Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by size, material, GSM, color..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchInventory}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">Auto-Refresh (30s)</span>
          </label>
        </div>
      </div>

      {/* Loading State */}
      {loading && products.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading inventory...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && displayProducts.length === 0 && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery ? 'No products match your search' : 'No products in inventory'}
          </p>
        </div>
      )}

      {/* Inventory Table */}
      {!loading && displayProducts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Showing {displayProducts.length} of {products.length} items
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {searchQuery && `Filtered by: "${searchQuery}"`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Product</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Material/Size</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">GSM</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Quantity</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Price (₹)</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {displayProducts.map((product) => {
                  const variant = product.variant || product.variantId || {};
                  const productMaster = variant.productId || {};
                  const minimum = product.minimumStockLevel || 50;
                  const status = getStockStatus(product.quantity || 0, minimum);

                  return (
                    <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {variant?.displayName || variant?.sku || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {productMaster?.name && variant?.size 
                          ? `${productMaster.name} | ${variant.size}`
                          : productMaster?.name || variant?.size || '-'}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">
                        {variant?.gsm || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                        {product.quantity || 0}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                        ₹{(product.price || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${status.color} ${status.bg}`}>
                          {status.label} ({product.quantity || 0}/{minimum})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setUpdateForm({
                                quantity: product.quantity || 0,
                                price: product.price || 0
                              });
                              setShowUpdateModal(true);
                            }}
                            className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Update Modal */}
      <Modal isOpen={showUpdateModal} onClose={() => !isSubmitting && setShowUpdateModal(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Update Inventory
          </h2>

          {selectedProduct && (
            <div className="space-y-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Product:</strong> {selectedProduct.variant?.displayName || selectedProduct.variantId?.displayName || 'N/A'}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantity
              </label>
              <input
                type="number"
                min="0"
                value={updateForm.quantity}
                onChange={(e) => setUpdateForm({ ...updateForm, quantity: parseInt(e.target.value) || 0 })}
                placeholder="Enter quantity"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={updateForm.price}
                onChange={(e) => setUpdateForm({ ...updateForm, price: parseFloat(e.target.value) || 0 })}
                placeholder="Enter price"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => !isSubmitting && setShowUpdateModal(false)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateProduct}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Inventory Item"
        message={`Are you sure you want to delete "${selectedProduct?.variant?.displayName || selectedProduct?.variantId?.displayName || 'this item'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
        onConfirm={handleDeleteProduct}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
};

export default Inventory;
