import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Edit, Trash2, AlertCircle, Search, Plus, Minus, X } from 'lucide-react';
import { inventoryService, productService } from '../services/api';
import { toast } from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import useToast from '../hooks/useToast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { SmartStockUpdateModal } from '../components/ui/SmartStockUpdateModal';

const Inventory = () => {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showStockUpdateModal, setShowStockUpdateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockAction, setStockAction] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updateForm, setUpdateForm] = useState({ quantity: 0, price: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const showProductsOnce = useRef(false);

  // Add Product Modal state
  const [addStep, setAddStep] = useState(0); // 0=mode, 1=pick existing, 'new'=create new, 2=variant details
  const [addMode, setAddMode] = useState('existing'); // 'existing' | 'new'
  const [allProductMasters, setAllProductMasters] = useState([]);
  const [addProductSelected, setAddProductSelected] = useState(null);
  const [addVariantForm, setAddVariantForm] = useState({ gsm: '', size: '', color: '', price: '' });
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [newProductForm, setNewProductForm] = useState({ name: '', hasGSM: true, hasSize: true, hasColor: false });
  const [prevAddStep, setPrevAddStep] = useState(0); // tracks which step to go back to from step 2
  const [browseSearch, setBrowseSearch] = useState('');
  const [allVariants, setAllVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  

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

  // Fetch inventory - NO DEPENDENCIES to prevent infinite loops
  const fetchInventory = useCallback(async (showToast = false) => {
    try {
      console.log('🔄 Fetching inventory...');
      setLoading(true);
      setError(null);
      
      const res = await inventoryService.getAll({ limit: 1000 });
      let productsData = Array.isArray(res.data) ? res.data : res.data?.data || [];
      
      // Log data structure for debugging
      console.log('📦 Raw inventory data:', productsData[0]);
      
      setProducts(productsData);
      applySearch(productsData, searchQuery);
      
      // Only show toast on initial load OR if explicitly requested
      if(!showProductsOnce.current){
        toast.info(`✅ Loaded ${productsData.length} products`);
        showProductsOnce.current = true;
        setHasLoadedOnce(true); 
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

  // Handle search input - LOCAL FILTERING ONLY, NO API CALL
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    applySearch(products, query);
  };

  // Initial load - once on mount
  useEffect(() => {
    console.log('📦 Inventory component mounted - initial fetch');
    fetchInventory(false);
  }, []);

  // Auto-refresh setup - SEPARATE from initial load
  useEffect(() => {
    if (!autoRefreshEnabled || !hasLoadedOnce) return;
    
    console.log('🔄 Auto-refresh enabled - setting 30s interval');
    const interval = setInterval(() => {
      console.log('⏰ Auto-refreshing inventory...');
      fetchInventory(false); // Don't show toast on auto-refresh
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, hasLoadedOnce, fetchInventory]);

  // Open Add Product Modal — load product masters first
  const openAddProductModal = async () => {
    try {
      const res = await productService.getAllProducts();
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setAllProductMasters(data);
    } catch (e) {
      toast.error('Failed to load product types');
    }
    setAddStep(0);
    setAddMode('existing');
    setAddProductSelected(null);
    setAddVariantForm({ gsm: '', size: '', color: '', price: '' });
    setNewProductForm({ name: '', hasGSM: true, hasSize: true, hasColor: false });
    setBrowseSearch('');
    setAllVariants([]);
    setShowAddProductModal(true);
  };

  // Load all variants for browse step
  const openBrowseStep = async () => {
    setAddStep('browse');
    setBrowseSearch('');
    setLoadingVariants(true);
    try {
      const res = await productService.getAllVariants();
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setAllVariants(data);
    } catch (e) {
      toast.error('Failed to load variants');
    } finally {
      setLoadingVariants(false);
    }
  };

  // Pick an existing variant → open the update modal for it
  const handlePickExistingVariant = async (variant) => {
    // Find matching inventory item from loaded products list
    const existingInv = products.find(p =>
      (p.variant?._id === variant._id) ||
      (p.variantId?._id === variant._id) ||
      (p.variantId === variant._id)
    );
    if (existingInv) {
      setShowAddProductModal(false);
      setSelectedProduct(existingInv);
      setUpdateForm({
        quantity: existingInv.quantity || 0,
        price: existingInv.price || 0
      });
      setShowUpdateModal(true);
    } else {
      // Variant exists in product_variants but not yet in inventory
      // We will hit the backend to create the missing inventory record
      try {
        setIsAddingVariant(true);
        // Call backend to create missing inventory record
        const res = await productService.createVariant({
          productId: variant.productId?._id || variant.product_id || variant.productId,
          gsm: variant.gsm,
          size: variant.size,
          color: variant.color,
          price: variant.price || 0
        });
        
        toast.success(`Inventory initialized for ${variant.displayName || 'variant'}!`);
        setShowAddProductModal(false);
        
        // Refresh to get the newly created inventory item
        await fetchInventory(false);
        
        // Find it in the newly returned data (simulate)
        // Set a slight timeout to ensure state catches up if we just rely on fetchInventory
        setTimeout(() => {
          // You could find the item from res.data.variant.inventoryId if needed,
          // but user can just see it in the list now!
        }, 100);
        
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to initialize inventory for this variant.');
      } finally {
        setIsAddingVariant(false);
      }
    }
  };

  // Create a brand-new product master then move to variant step
  const handleCreateNewProductMaster = async () => {
    if (!newProductForm.name.trim()) { toast.error('Product name is required'); return; }
    try {
      setIsAddingVariant(true);
      const res = await productService.createProduct({
        name: newProductForm.name.trim(),
        hasGSM: newProductForm.hasGSM,
        hasSize: newProductForm.hasSize,
        hasColor: newProductForm.hasColor
      });
      const created = res.data?.product || res.data?.data || res.data;
      setAddProductSelected(created);
      setAddVariantForm({ gsm: '', size: '', color: '', price: '' });
      setPrevAddStep('new');
      setAddStep(2);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create product';
      toast.error(msg.includes('already exists') ? '⚠️ A product with this name already exists' : msg);
    } finally {
      setIsAddingVariant(false);
    }
  };

  const handleAddVariantSubmit = async () => {
    if (!addProductSelected) return;
    const gsmVal = addProductSelected.hasGSM ? (addVariantForm.gsm !== '' ? Number(addVariantForm.gsm) : null) : null;
    const sizeVal = addProductSelected.hasSize ? (addVariantForm.size.trim() || null) : null;
    const colorVal = addProductSelected.hasColor ? (addVariantForm.color?.trim() || null) : null;
    if (addProductSelected.hasGSM && !gsmVal) { toast.error('GSM is required'); return; }
    if (addProductSelected.hasSize && !sizeVal) { toast.error('Size is required'); return; }
    const priceVal = parseFloat(addVariantForm.price);
    if (addVariantForm.price === '' || isNaN(priceVal) || priceVal < 0) { toast.error('Enter a valid price'); return; }
    try {
      setIsAddingVariant(true);
      await productService.createVariant({
        productId: addProductSelected._id,
        gsm: gsmVal,
        size: sizeVal,
        color: colorVal,
        price: priceVal
      });
      toast.success('✅ Product variant added successfully!');
      setShowAddProductModal(false);
      fetchInventory(false);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to add variant';
      toast.error(msg.includes('already exists') || msg.includes('duplicate') ? '⚠️ This variant already exists' : msg);
    } finally {
      setIsAddingVariant(false);
    }
  };

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
      // Refresh with toast enabled to confirm update
      await fetchInventory(true);
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
  
      const variantId =
        selectedProduct.variant?._id ||
        selectedProduct.variantId?._id ||
        selectedProduct.variantId;
  
      if (variantId) {
        await productService.deleteVariant(variantId);
      }
  
      toast.success('✅ Deleted permanently');
  
      setShowDeleteConfirm(false);
      setSelectedProduct(null);
  
      // Refresh UI
      await fetchInventory(true);
  
    } catch (err) {
      console.error('Error deleting:', err);
      toast.error(err?.response?.data?.message || 'Failed to delete');
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
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
          📦 Inventory Management
        </h1>
        <p className="text-gray-600 mt-2 font-medium">
          Manage products and stock levels efficiently
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700">{error}</p>
            <p className="text-xs text-red-600 mt-1">Check browser console for details</p>
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
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => openAddProductModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>

          <button
            onClick={() => fetchInventory(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
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
        <div className="bg-white rounded-lg p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && displayProducts.length === 0 && !error && (
        <div className="bg-white rounded-lg p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">
            {searchQuery ? 'No products match your search' : 'No products in inventory'}
          </p>
        </div>
      )}

      {/* Inventory Table */}
      {!loading && displayProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">
              Showing {displayProducts.length} of {products.length} items
            </h3>
            <span className="text-xs text-gray-500">
              {searchQuery && `Filtered by: "${searchQuery}"`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Product Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Material</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Size</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">GSM</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Quantity</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Price (₹)</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayProducts.map((product) => {
                  const variant = product.variant || product.variantId || {};
                  const productMaster = variant.productId || {};
                  const minimum = product.minimumStockLevel || 50;
                  const status = getStockStatus(product.quantity || 0, minimum);

                  return (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">
                          {variant?.displayName || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {productMaster?.name || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {variant?.size || '-'}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">
                        {variant?.gsm || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {product.quantity || 0}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        ₹{(product.price || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${status.color} ${status.bg}`}>
                          {status.label} ({product.quantity || 0}/{minimum})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 justify-center">
                          {/* Smart Stock Buttons */}
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setStockAction('add');
                              setShowStockUpdateModal(true);
                            }}
                            className="p-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 font-semibold transition-colors flex items-center gap-1"
                            title="Add Stock"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setStockAction('reduce');
                              setShowStockUpdateModal(true);
                            }}
                            className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-semibold transition-colors flex items-center gap-1"
                            title="Reduce Stock"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setUpdateForm({
                                quantity: product.quantity || 0,
                                price: product.price || 0
                              });
                              setShowUpdateModal(true);
                            }}
                            className="p-2 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-2 rounded-lg hover:bg-red-100 transition-colors"
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
          <h2 className="text-xl font-bold text-gray-900">
            Update Inventory
          </h2>

          {selectedProduct && (
            <div className="space-y-2 p-3 rounded-lg bg-gray-100">
              <p className="text-sm text-gray-700">
                <strong>Product:</strong> {selectedProduct.variant?.displayName || selectedProduct.variantId?.displayName || 'N/A'}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                min="0"
                value={updateForm.quantity}
                onChange={(e) => setUpdateForm({ ...updateForm, quantity: parseInt(e.target.value) || 0 })}
                placeholder="Enter quantity"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={updateForm.price}
                onChange={(e) => setUpdateForm({ ...updateForm, price: parseFloat(e.target.value) || 0 })}
                placeholder="Enter price"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              onClick={() => !isSubmitting && setShowUpdateModal(false)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
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

      {/* Add Product Modal — Step-based */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                {addStep === 0 && 'Add Product'}
                {addStep === 1 && 'Select Product Type'}
                {addStep === 'new' && 'Create New Product Type'}
                {addStep === 2 && `Add Variant — ${addProductSelected?.name}`}
                {addStep === 'browse' && 'Browse Existing Inventory'}
              </h2>
              <button onClick={() => setShowAddProductModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* STEP 0: Choose mode */}
              {addStep === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-2">What would you like to do?</p>
                  <button
                    onClick={openBrowseStep}
                    className="w-full text-left px-4 py-4 rounded-xl border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 transition-all"
                  >
                    <p className="font-bold text-gray-900">🔍 Find & Update Existing Product</p>
                    <p className="text-xs text-gray-500 mt-1">Search all existing variants in inventory to update price or stock</p>
                  </button>
                  <button
                    onClick={() => setAddStep(1)}
                    className="w-full text-left px-4 py-4 rounded-xl border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <p className="font-bold text-gray-900">➕ Add New Variant to Existing Product</p>
                    <p className="text-xs text-gray-500 mt-1">Add a new size/GSM combination to an already-existing product type</p>
                  </button>
                  <button
                    onClick={() => { setAddStep('new'); setNewProductForm({ name: '', hasGSM: true, hasSize: true, hasColor: false }); }}
                    className="w-full text-left px-4 py-4 rounded-xl border-2 border-green-200 hover:border-green-500 hover:bg-green-50 transition-all"
                  >
                    <p className="font-bold text-gray-900">🆕 Create a Brand New Product</p>
                    <p className="text-xs text-gray-500 mt-1">Define a completely new product type and add its first variant</p>
                  </button>
                  <button onClick={() => setShowAddProductModal(false)} className="w-full py-2 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50">Cancel</button>
                </div>
              )}

              {/* STEP new: Create new product type */}
              {addStep === 'new' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Cotton, Paper, Cloth..."
                      value={newProductForm.name}
                      onChange={e => setNewProductForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Variant Attributes</label>
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                      <input type="checkbox" checked={newProductForm.hasGSM} onChange={e => setNewProductForm(f => ({ ...f, hasGSM: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Has GSM</p>
                        <p className="text-xs text-gray-400">Variants will have a GSM (weight) attribute</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                      <input type="checkbox" checked={newProductForm.hasSize} onChange={e => setNewProductForm(f => ({ ...f, hasSize: e.target.checked }))} className="w-4 h-4 accent-green-600" />
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Has Size</p>
                        <p className="text-xs text-gray-400">Variants will have a size dimension</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                      <input type="checkbox" checked={newProductForm.hasColor} onChange={e => setNewProductForm(f => ({ ...f, hasColor: e.target.checked }))} className="w-4 h-4 accent-purple-600" />
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Has Color</p>
                        <p className="text-xs text-gray-400">Variants will have a color attribute</p>
                      </div>
                    </label>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setAddStep(0)} className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50">← Back</button>
                    <button
                      onClick={handleCreateNewProductMaster}
                      disabled={isAddingVariant}
                      className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors disabled:opacity-50"
                    >
                      {isAddingVariant ? 'Creating...' : 'Next: Add Variant →'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 1: Pick existing product */}
              {addStep === 1 && (
                <>
                  <p className="text-sm text-gray-500">Choose a product type to add a variant for:</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {allProductMasters.map(pm => (
                      <button
                        key={pm._id}
                        onClick={() => { setAddProductSelected(pm); setPrevAddStep(1); setAddStep(2); setAddVariantForm({ gsm: '', size: '', color: '', price: '' }); }}
                        className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex justify-between items-center"
                      >
                        <span className="font-semibold text-gray-800">{pm.name}</span>
                        <div className="flex gap-1.5 text-xs">
                          {pm.hasGSM && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">GSM</span>}
                          {pm.hasSize && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Size</span>}
                        </div>
                      </button>
                    ))}
                    {allProductMasters.length === 0 && <p className="text-center text-gray-400 py-8">No product types found.</p>}
                  </div>
                  <button onClick={() => setAddStep(0)} className="w-full py-2 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50">← Back</button>
                </>
              )}

              {addStep === 2 && addProductSelected && (
                <div className="space-y-4">
                  {addProductSelected.hasGSM && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">GSM *</label>
                      <div className="flex gap-2">
                        <select
                          value={addVariantForm.gsm}
                          onChange={e => setAddVariantForm(f => ({ ...f, gsm: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Select GSM...</option>
                          {(addProductSelected.gsmOptions || []).map(g => <option key={g} value={g}>{g} GSM</option>)}
                        </select>
                        <input type="number" placeholder="Custom" min="0"
                          value={addVariantForm.gsm}
                          onChange={e => setAddVariantForm(f => ({ ...f, gsm: e.target.value }))}
                          className="w-24 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  )}
                  {addProductSelected.hasSize && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Size *</label>
                      <div className="flex gap-2">
                        <select
                          value={addVariantForm.size}
                          onChange={e => setAddVariantForm(f => ({ ...f, size: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Select Size...</option>
                          {(addProductSelected.sizeOptions || []).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <input type="text" placeholder="Custom"
                          value={addVariantForm.size}
                          onChange={e => setAddVariantForm(f => ({ ...f, size: e.target.value }))}
                          className="w-24 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  )}
                  {addProductSelected.hasColor && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color</label>
                      <div className="flex gap-2">
                        <select
                          value={addVariantForm.color || ''}
                          onChange={e => setAddVariantForm(f => ({ ...f, color: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Select Color...</option>
                          {(addProductSelected.colorOptions || []).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input type="text" placeholder="Custom"
                          value={addVariantForm.color || ''}
                          onChange={e => setAddVariantForm(f => ({ ...f, color: e.target.value }))}
                          className="w-24 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Initial Price (₹) *</label>
                    <input type="number" placeholder="0.00" min="0" step="0.01"
                      value={addVariantForm.price}
                      onChange={e => setAddVariantForm(f => ({ ...f, price: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setAddStep(prevAddStep)} className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50">← Back</button>
                    <button
                      onClick={handleAddVariantSubmit}
                      disabled={isAddingVariant}
                      className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50"
                    >
                      {isAddingVariant ? 'Adding...' : 'Add to Inventory'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP browse: Search and pick an existing variant */}
              {addStep === 'browse' && (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, size, GSM..."
                      value={browseSearch}
                      onChange={e => setBrowseSearch(e.target.value)}
                      autoFocus
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    />
                  </div>
                  {loadingVariants && (
                    <div className="text-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading variants...</p>
                    </div>
                  )}
                  {!loadingVariants && (
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                      {allVariants
                        .filter(v => {
                          if (!browseSearch.trim()) return true;
                          const q = browseSearch.toLowerCase();
                          return (
                            (v.displayName || '').toLowerCase().includes(q) ||
                            (v.productId?.name || '').toLowerCase().includes(q) ||
                            String(v.gsm || '').includes(q) ||
                            (v.size || '').toLowerCase().includes(q)
                          );
                        })
                        .slice(0, 60)
                        .map(v => {
                          const inInventory = products.some(p =>
                            (p.variant?._id === v._id) ||
                            (p.variantId?._id === v._id) ||
                            (p.variantId === v._id)
                          );
                          return (
                            <button
                              key={v._id}
                              onClick={() => handlePickExistingVariant(v)}
                              className="w-full text-left px-3 py-2.5 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all flex justify-between items-center gap-2"
                            >
                              <div>
                                <p className="font-semibold text-gray-800 text-sm">{v.displayName || v.productId?.name}</p>
                                <p className="text-xs text-gray-400">
                                  {v.productId?.name}{v.gsm ? ` · ${v.gsm} GSM` : ''}{v.size ? ` · ${v.size}` : ''}
                                </p>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                                inInventory ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {inInventory ? 'In Stock' : 'Not Loaded'}
                              </span>
                            </button>
                          );
                        })
                      }
                      {allVariants.filter(v => {
                        if (!browseSearch.trim()) return true;
                        const q = browseSearch.toLowerCase();
                        return (
                          (v.displayName || '').toLowerCase().includes(q) ||
                          (v.productId?.name || '').toLowerCase().includes(q) ||
                          String(v.gsm || '').includes(q) ||
                          (v.size || '').toLowerCase().includes(q)
                        );
                      }).length === 0 && (
                        <p className="text-center text-gray-400 py-6 text-sm">No variants match your search</p>
                      )}
                    </div>
                  )}
                  <button onClick={() => setAddStep(0)} className="w-full py-2 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 text-sm">← Back</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Smart Stock Update Modal */}
      {selectedProduct && (
        <SmartStockUpdateModal
          isOpen={showStockUpdateModal}
          onClose={() => {
            setShowStockUpdateModal(false);
            setSelectedProduct(null);
          }}
          inventoryItem={selectedProduct}
          onStockUpdated={() => {
            setShowStockUpdateModal(false);
            setSelectedProduct(null);
            fetchInventory(false);
          }}
        />
      )}
    </div>
  );
};

export default Inventory;
