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

  // Expandable sections state
  const [expandedProducts, setExpandedProducts] = useState(new Set());

  const toggleExpand = (productId) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

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
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
          🏭 Product Master
        </h1>
        <p className="text-gray-600 mt-2 font-medium">
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
      <div className="flex gap-3">
        <button
          onClick={() => fetchProducts(true)}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95"
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

      {/* Products List (Expandable) */}
      {!loading && products.length > 0 && (
        <div className="space-y-4">
          {products.map((product) => {
            const isExpanded = expandedProducts.has(product._id);
            return (
              <div key={product._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Product Header (Clickable) */}
                <div 
                  className="bg-gray-50 hover:bg-gray-100 p-4 cursor-pointer flex justify-between items-center transition-colors"
                  onClick={() => toggleExpand(product._id)}
                >
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                    <div className="flex gap-2 text-xs">
                      {product.hasGSM && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">GSM</span>}
                      {product.hasSize && <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">Size</span>}
                      {product.hasColor && <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">Color</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500 font-medium text-sm">
                      {product.variants?.length || 0} Variants
                    </span>
                    <button 
                      className={`transform transition-transform text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      ▼
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-semibold text-gray-700">Product Variants</h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                          setShowAddVariant(true);
                          setVariantForm({ gsm: '', size: '', color: null });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Variant
                      </button>
                    </div>

                    {product.variants && product.variants.length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specifications</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {product.variants.map(variant => (
                              <tr key={variant._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{variant.displayName}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 font-semibold">₹{variant.price || 0}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedVariantForEdit(variant);
                                        setSelectedProduct(product);
                                        setShowEditModal(true);
                                      }}
                                      className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                                      title="Edit Variant"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedVariantForDelete(variant);
                                        setSelectedProduct(product);
                                        setShowDeleteModal(true);
                                      }}
                                      className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                                      title="Delete Variant"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-sm text-gray-500">No variants exist for this product yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
        product={selectedProduct}
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
