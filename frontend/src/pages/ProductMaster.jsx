import React, { useState, useEffect, useCallback ,useRef} from 'react';
import { Plus, Trash2, AlertCircle, RefreshCw, Edit2 } from 'lucide-react';
import { productService } from '../services/api';
import useToast from '../hooks/useToast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { AddProductVariantModal } from '../components/ui/AddProductVariantModal';
import { EditProductVariantModal } from '../components/ui/EditProductVariantModal';
import { DeleteProductVariantModal } from '../components/ui/DeleteProductVariantModal';

/**
 * PRODUCT MASTER PAGE
 * Manage product types and their configurations
 * Creates ProductVariant entries which auto-create Inventory
 */
export const ProductMaster = () => {
  const toast = useToast();
  const showProductsOnce = useRef(false);
  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  
  // New modal states for Edit & Delete
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVariantForEdit, setSelectedVariantForEdit] = useState(null);
  const [selectedVariantForDelete, setSelectedVariantForDelete] = useState(null);

  // Form state
  const [variantForm, setVariantForm] = useState({
    gsm: '',
    size: '',
    color: null
  });



  // Fetch products - NO DEPENDENCIES to prevent infinite loops
  const fetchProducts = useCallback(async (showToast = false) => {
    try {
      console.log('🔄 Fetching products...');
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
      // Only show toast on initial load OR if explicitly requested
      if (!showProductsOnce.current) {
        toast.info(`✅ Loaded ${productsWithVariants.length} product types`);
        showProductsOnce.current = true;
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to load products';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initial load - ONLY on mount
  useEffect(() => {
    console.log('🏭 Product Master component mounted - initial fetch');
    fetchProducts(false);
  }, []);

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
      // Refresh with toast enabled to confirm creation
      await fetchProducts(true);
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
      // Refresh with toast enabled to confirm deletion
      await fetchProducts(true);
    } catch (err) {
      console.error('Error deleting variant:', err);
      toast.error(err?.response?.data?.message || 'Failed to delete variant');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          🏭 Product Master
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage product types and variants
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => fetchProducts(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      )}

      {/* Products Grid */}
      {!loading && products.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              {/* Product Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3">
                <h3 className="text-lg font-bold text-white">{product.name}</h3>
              </div>

              {/* Product Details */}
              <div className="p-4 space-y-3">
                {/* Configuration */}
                <div className="text-sm">
                  <p className="text-gray-700">
                    <strong>Configuration:</strong>
                  </p>
                  <div className="mt-2 space-y-1 text-xs text-gray-600">
                    {product.hasGSM && <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded">📊 GSM Required</span>}
                    {product.hasSize && <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded ml-2">📐 Size Required</span>}
                    {product.hasColor && <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded mt-1">🎨 Color Required</span>}
                  </div>
                </div>

                {/* Options */}
                <div className="text-sm">
                  <p className="text-gray-700 font-medium mb-2">Available Options:</p>
                  {product.gsmOptions?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1"><strong>GSM:</strong></p>
                      <div className="flex flex-wrap gap-1">
                        {product.gsmOptions.map(gsm => (
                          <span key={gsm} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {gsm}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.sizeOptions?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1"><strong>Sizes:</strong></p>
                      <div className="flex flex-wrap gap-1">
                        {product.sizeOptions.map(size => (
                          <span key={size} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.colorOptions?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1"><strong>Colors:</strong></p>
                      <div className="flex flex-wrap gap-1">
                        {product.colorOptions.map(color => (
                          <span key={color} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {color}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Variants Count */}
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
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
                <div className="border-t border-gray-200 p-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Variants ({product.variants.length}):</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {product.variants.map(variant => (
                      <div key={variant._id} className="text-xs flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors">
                        <span className="text-gray-700 truncate flex-1 font-medium">{variant.displayName}</span>
                        <div className="flex gap-1 ml-2">
                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              setSelectedVariantForEdit(variant);
                              setSelectedProduct(product);
                              setShowEditModal(true);
                            }}
                            className="p-1.5 hover:bg-blue-100 rounded transition-colors text-blue-600"
                            title="Edit variant"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              setSelectedVariantForDelete(variant);
                              setSelectedProduct(product);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 hover:bg-red-100 rounded transition-colors text-red-600"
                            title="Delete variant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && !error && (
        <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No products found</p>
        </div>
      )}

      {/* Add Variant Modal */}
      <AddProductVariantModal
        isOpen={showAddVariant}
        onClose={() => {
          setShowAddVariant(false);
          setSelectedProduct(null);
        }}
        onProductAdded={() => fetchProducts(true)}
      />

      {/* Edit Variant Modal */}
      <EditProductVariantModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedVariantForEdit(null);
          setSelectedProduct(null);
        }}
        variant={selectedVariantForEdit}
        product={selectedProduct}
        onVariantUpdated={() => {
          setShowEditModal(false);
          setSelectedVariantForEdit(null);
          setSelectedProduct(null);
          fetchProducts(false);
        }}
      />

      {/* Delete Variant Modal */}
      <DeleteProductVariantModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedVariantForDelete(null);
          setSelectedProduct(null);
        }}
        variant={selectedVariantForDelete}
        product={selectedProduct}
        onProductDeleted={() => {
          setShowDeleteModal(false);
          setSelectedVariantForDelete(null);
          setSelectedProduct(null);
          fetchProducts(false);
        }}
      />

      {/* Delete Confirmation (Legacy - can be removed) */}
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
