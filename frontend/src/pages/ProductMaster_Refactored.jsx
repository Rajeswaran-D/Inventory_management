import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { productService } from '../services/api';
import useToast from '../hooks/useToast';
import ConfirmDialog from '../components/ui/ConfirmDialog';

/**
 * PRODUCT MASTER PAGE
 * Manage product types and their configurations
 * Creates ProductVariant entries which auto-create Inventory
 */
export const ProductMaster = () => {
  const toast = useToast();
  
  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [variantForm, setVariantForm] = useState({
    gsm: '',
    size: '',
    color: null
  });

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await productService.getAllProducts();
      const productsData = Array.isArray(res.data) ? res.data : res.data?.data || [];

      // Get variants for each product
      const productsWithVariants = await Promise.all(
        productsData.map(async (product) => {
          try {
            const variantRes = await productService.getAllVariants({ productId: product._id });
            const variants = Array.isArray(variantRes.data) ? variantRes.data : variantRes.data?.data || [];
            return { ...product, variants };
          } catch (err) {
            console.warn(`Failed to load variants for ${product.name}:`, err);
            return { ...product, variants: [] };
          }
        })
      );

      setProducts(productsWithVariants);
      toast.info(`✅ Loaded ${productsWithVariants.length} product types`);
    } catch (err) {
      console.error('Error fetching products:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to load products';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Create variant
  const handleCreateVariant = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    // Validation
    if (selectedProduct.hasGSM && !variantForm.gsm) {
      toast.error('GSM is required for this product');
      return;
    }
    if (selectedProduct.hasSize && !variantForm.size) {
      toast.error('Size is required for this product');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        productId: selectedProduct._id,
        gsm: selectedProduct.hasGSM ? parseInt(variantForm.gsm) : null,
        size: selectedProduct.hasSize ? variantForm.size : null,
        color: selectedProduct.hasColor ? variantForm.color : null
      };

      await productService.createVariant(payload);

      toast.success('✅ Variant created successfully (Inventory auto-created)');
      setShowAddVariant(false);
      setVariantForm({ gsm: '', size: '', color: null });
      await fetchProducts();
    } catch (err) {
      console.error('Error creating variant:', err);
      const errorMsg = err?.response?.data?.message || 'Failed to create variant';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete variant
  const handleDeleteVariant = async () => {
    if (!selectedProduct) return;

    try {
      setIsSubmitting(true);
      await productService.deleteVariant(selectedProduct._id);
      toast.success('✅ Variant deleted');
      setShowDeleteConfirm(false);
      setSelectedProduct(null);
      await fetchProducts();
    } catch (err) {
      console.error('Error deleting variant:', err);
      toast.error(err?.response?.data?.message || 'Failed to delete variant');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          🏭 Product Master
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage product types and variants
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={fetchProducts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      )}

      {/* Products Grid */}
      {!loading && products.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div key={product._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              {/* Product Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3">
                <h3 className="text-lg font-bold text-white">{product.name}</h3>
              </div>

              {/* Product Details */}
              <div className="p-4 space-y-3">
                {/* Configuration */}
                <div className="text-sm">
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Configuration:</strong>
                  </p>
                  <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    {product.hasGSM && <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">📊 GSM Required</span>}
                    {product.hasSize && <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded ml-2">📐 Size Required</span>}
                    {product.hasColor && <span className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded mt-1">🎨 Color Required</span>}
                  </div>
                </div>

                {/* Options */}
                <div className="text-sm">
                  <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">Available Options:</p>
                  {product.gsmOptions?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1"><strong>GSM:</strong></p>
                      <div className="flex flex-wrap gap-1">
                        {product.gsmOptions.map(gsm => (
                          <span key={gsm} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                            {gsm}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.sizeOptions?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1"><strong>Sizes:</strong></p>
                      <div className="flex flex-wrap gap-1">
                        {product.sizeOptions.map(size => (
                          <span key={size} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.colorOptions?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1"><strong>Colors:</strong></p>
                      <div className="flex flex-wrap gap-1">
                        {product.colorOptions.map(color => (
                          <span key={color} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                            {color}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Variants Count */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Variants:</strong> {product.variants?.length || 0}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowAddVariant(true);
                      setVariantForm({ gsm: '', size: '', color: null });
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Variant
                  </button>
                </div>
              </div>

              {/* Variants List */}
              {product.variants && product.variants.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Recent Variants:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {product.variants.slice(0, 3).map(variant => (
                      <div key={variant._id} className="text-xs flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{variant.displayName}</span>
                        <button
                          onClick={() => {
                            setSelectedProduct(variant);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors ml-2"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    ))}
                    {product.variants.length > 3 && (
                      <p className="text-xs text-gray-500 p-2">+{product.variants.length - 3} more...</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">No products found</p>
        </div>
      )}

      {/* Add Variant Modal */}
      {showAddVariant && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Add Variant: {selectedProduct.name}
            </h2>

            <div className="space-y-4">
              {/* GSM */}
              {selectedProduct.hasGSM && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GSM *
                  </label>
                  <select
                    value={variantForm.gsm}
                    onChange={(e) => setVariantForm({ ...variantForm, gsm: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select GSM</option>
                    {selectedProduct.gsmOptions?.map(gsm => (
                      <option key={gsm} value={gsm}>{gsm} GSM</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Size */}
              {selectedProduct.hasSize && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Size *
                  </label>
                  <select
                    value={variantForm.size}
                    onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Size</option>
                    {selectedProduct.sizeOptions?.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Color */}
              {selectedProduct.hasColor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <select
                    value={variantForm.color || ''}
                    onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value || null })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">No Color</option>
                    {selectedProduct.colorOptions?.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowAddVariant(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateVariant}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Variant'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Variant"
        message={`Are you sure you want to delete "${selectedProduct?.displayName || 'this variant'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
        onConfirm={handleDeleteVariant}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
};

export default ProductMaster;
