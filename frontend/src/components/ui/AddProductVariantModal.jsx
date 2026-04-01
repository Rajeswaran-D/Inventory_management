/**
 * AddProductVariantModal Component
 * 
 * Clean form to:
 * 1. Create ProductVariant
 * 2. Auto-create Inventory entry
 * 3. Prevent duplicates
 * 4. Show success/error notifications
 */

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { productService, inventoryService } from '../../services/api';

export const AddProductVariantModal = ({ isOpen, onClose, onProductAdded }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [manualProduct, setManualProduct] = useState({
    name: '',
    hasGSM: false,
    hasSize: false,
    hasColor: false
  });
  const [formData, setFormData] = useState({
    size: '',
    gsm: '',
    color: '',
    price: ''
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch products on modal open
  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await productService.getAllProducts({ isActive: 'true' });
      setProducts(Array.isArray(res.data) ? res.data : res);
      console.log('📦 Products loaded:', res.data);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || 'Failed to load products';
      setError(errorMsg);
      console.error('❌ Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setFormData({ size: '', gsm: '', color: '', price: '' });
    setError('');
    setSuccess('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    const product = useManualEntry ? manualProduct : selectedProduct;
    
    if (!product) {
      setError(useManualEntry ? 'Please enter a product name' : 'Please select a product');
      return false;
    }

    if (useManualEntry && !product.name?.trim()) {
      setError('Please enter a product name');
      return false;
    }

    // Size validation
    if (product.hasSize && !formData.size) {
      setError('Please enter a size');
      return false;
    }

    // GSM validation
    if (product.hasGSM && !formData.gsm) {
      setError('Please enter GSM value');
      return false;
    }

    // Price validation
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) < 0) {
      setError('Please enter a valid initial price (≥0)');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const product = useManualEntry ? manualProduct : selectedProduct;
      
      // Step 1: Create variant (which auto-creates inventory)
      const variantData = {
        productId: useManualEntry ? null : selectedProduct._id,
        productName: useManualEntry ? product.name : selectedProduct.name,
        size: product.hasSize ? formData.size : null,
        gsm: product.hasGSM ? parseInt(formData.gsm) : null,
        color: product.hasColor ? formData.color : null,
        isManualProduct: useManualEntry
      };

      console.log('📝 Creating variant:', variantData);
      const variantRes = await productService.createVariant(variantData);
      const variant = variantRes.data.variant || variantRes.data;
      
      console.log('✅ Variant created:', variant);

      // Step 2: Update inventory with initial price
      if (variant.inventoryId) {
        await inventoryService.update(variant.inventoryId, {
          price: parseFloat(formData.price) || 0,
          quantity: 0
        });
      }

      // Success!
      setSuccess(`✅ Product created: ${product.name} | Price: ₹${formData.price}`);
      toast.success(`✅ ${product.name} variant added successfully!`);
      
      // Reset form
      setTimeout(() => {
        setFormData({ size: '', gsm: '', color: '', price: '' });
        setSelectedProduct(null);
        setManualProduct({ name: '', hasGSM: false, hasSize: false, hasColor: false });
        setUseManualEntry(false);
        setSuccess('');
        onClose();
        onProductAdded?.();
      }, 1500);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to create product';
      
      // Check for duplicate error
      if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
        setError('⚠️ This product variant already exists');
      } else {
        setError(errorMsg);
      }
      
      toast.error(errorMsg);
      console.error('❌ Error creating variant:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600">
          <div className="flex items-center gap-3">
            <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Product Variant</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading products...</p>
            </div>
          ) : (
            <>
              {/* Toggle Between Modes */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setUseManualEntry(false);
                    setManualProduct({ name: '', hasGSM: false, hasSize: false, hasColor: false });
                    setFormData({ size: '', gsm: '', color: '', price: '' });
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    !useManualEntry
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-300'
                  }`}
                >
                  📦 Select Existing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseManualEntry(true);
                    setSelectedProduct(null);
                    setFormData({ size: '', gsm: '', color: '', price: '' });
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    useManualEntry
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-300'
                  }`}
                >
                  ✏️ Manual Entry
                </button>
              </div>

              {/* Mode 1: Select Existing Product */}
              {!useManualEntry && (
                <>
                  {/* Product Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      📦 Select Product Master
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {products.map(product => (
                        <button
                          key={product._id}
                          type="button"
                          onClick={() => handleProductSelect(product)}
                          className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                            selectedProduct?._id === product._id
                              ? 'border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-500'
                              : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {product.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Product Info */}
                  {selectedProduct && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>Selected:</strong> {selectedProduct.name}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Mode 2: Manual Entry */}
              {useManualEntry && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={manualProduct.name}
                      onChange={(e) => setManualProduct({ ...manualProduct, name: e.target.value })}
                      placeholder="e.g., Custom Paper, White Envelope, etc."
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-3">
                      Check which properties this product has:
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={manualProduct.hasGSM}
                          onChange={(e) => setManualProduct({ ...manualProduct, hasGSM: e.target.checked })}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-amber-900 dark:text-amber-200">📊 Has GSM (Paper Weight)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={manualProduct.hasSize}
                          onChange={(e) => setManualProduct({ ...manualProduct, hasSize: e.target.checked })}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-amber-900 dark:text-amber-200">📐 Has Size</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={manualProduct.hasColor}
                          onChange={(e) => setManualProduct({ ...manualProduct, hasColor: e.target.checked })}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-amber-900 dark:text-amber-200">🎨 Has Color</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Fields - Show for both modes when product is selected/entered */}
              {(selectedProduct || useManualEntry) && (
                <>
                  {/* Product Info Box */}
                  {selectedProduct && !useManualEntry && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>Selected:</strong> {selectedProduct.name}
                      </p>
                    </div>
                  )}

                  {/* GSM Field */}
                  {((selectedProduct && selectedProduct.hasGSM) || (useManualEntry && manualProduct.hasGSM)) && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        GSM (Paper Weight) *
                      </label>
                      <input
                        type="number"
                        name="gsm"
                        value={formData.gsm}
                        onChange={handleFormChange}
                        placeholder="e.g., 80, 100, 150"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {/* Size Field */}
                  {((selectedProduct && selectedProduct.hasSize) || (useManualEntry && manualProduct.hasSize)) && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Size *
                      </label>
                      <input
                        type="text"
                        name="size"
                        value={formData.size}
                        onChange={handleFormChange}
                        placeholder="e.g., 52x76, A4, DL"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {/* Color Field */}
                  {((selectedProduct && selectedProduct.hasColor) || (useManualEntry && manualProduct.hasColor)) && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Color
                      </label>
                      <input
                        type="text"
                        name="color"
                        value={formData.color}
                        onChange={handleFormChange}
                        placeholder="e.g., White, Yellow, Blue"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {/* Price Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Initial Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleFormChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (!selectedProduct && !useManualEntry) || (useManualEntry && !manualProduct.name?.trim())}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Product Variant
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddProductVariantModal;
