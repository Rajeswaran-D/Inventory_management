import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, AlertCircle, RefreshCw, Edit2, ChevronDown, Package } from 'lucide-react';
import { productService } from '../services/api';
import useToast from '../hooks/useToast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { AddProductVariantModal } from '../components/ui/AddProductVariantModal';
import { EditProductVariantModal } from '../components/ui/EditProductVariantModal';
import { DeleteProductVariantModal } from '../components/ui/DeleteProductVariantModal';
import { ProductMasterModal } from '../components/ui/ProductMasterModal';

export const ProductMaster = () => {
  const { info: toastInfo, error: toastError } = useToast();
  const showProductsOnce = useRef(false);
  
  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal states
  const [showAddMaster, setShowAddMaster] = useState(false);
  const [showEditMaster, setShowEditMaster] = useState(false);
  const [showDeleteMasterConfirm, setShowDeleteMasterConfirm] = useState(false);
  
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [showEditVariant, setShowEditVariant] = useState(false);
  const [showDeleteVariant, setShowDeleteVariant] = useState(false);
  
  // Selection states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

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

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await productService.getAllProducts();
      const productsData = res.data?.data || res.data || [];

      if (!Array.isArray(productsData)) {
        throw new Error('Invalid product data received from server');
      }

      const productsWithVariants = await Promise.all(
        productsData.map(async (product) => {
          try {
            const variantRes = await productService.getVariants({ productId: product.id || product._id });
            const variants = variantRes.data?.data || variantRes.data || [];
            return { ...product, variants: Array.isArray(variants) ? variants : [] };
          } catch (err) {
            return { ...product, variants: [] };
          }
        })
      );

      setProducts(productsWithVariants);
      if (!showProductsOnce.current) {
        toastInfo(`✅ Loaded ${productsWithVariants.length} product categories`);
        showProductsOnce.current = true;
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to load products';
      setError(errorMsg);
      toastError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [toastInfo, toastError]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // DELETE PRODUCT MASTER
  const handleDeleteProductMaster = async () => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      await productService.deleteProduct(selectedProduct.id || selectedProduct._id);
      toast.success('Product category deleted successfully');
      setShowDeleteMasterConfirm(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete product category';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-green-600" />
            Product Master
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Configure materials and product variants</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchProducts()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddMaster(true)}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add Master
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {loading && products.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-gray-100 shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Synchronizing products...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => {
            const id = product.id || product._id;
            const isExpanded = expandedProducts.has(id);
            return (
              <div key={id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
                {/* Product Header */}
                <div className="flex items-center justify-between p-5 hover:bg-gray-50/50">
                  <div className="flex items-center gap-5 flex-1 cursor-pointer" onClick={() => toggleExpand(id)}>
                    <div className="p-3 bg-green-50 rounded-lg">
                       <Package className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Rule System: {product.materialType}</span>
                        </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="hidden md:flex gap-2">
                       {product.hasGSM && <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100 uppercase">GSM</span>}
                       {product.hasSize && <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100 uppercase">Size</span>}
                       {product.hasColor && <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold border border-purple-100 uppercase">Color</span>}
                    </div>

                    <div className="flex items-center border-l pl-6 gap-2">
                        <button 
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowEditMaster(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Master"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowDeleteMasterConfirm(true);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Master"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => toggleExpand(id)}
                          className={`p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all ${isExpanded ? 'rotate-180' : ''}`}
                        >
                          <ChevronDown className="w-5 h-5" />
                        </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-gray-50/30 p-6 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-5">
                       <h4 className="font-bold text-gray-700 flex items-center gap-2 underline decoration-green-500/30 underline-offset-4">
                         Variants & Inventory
                         <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">{product.variants?.length || 0}</span>
                       </h4>
                       <button
                         onClick={() => {
                           setSelectedProduct(product);
                           setShowAddVariant(true);
                         }}
                         className="flex items-center gap-2 px-4 py-2 bg-white border border-green-600 text-green-700 hover:bg-green-50 rounded-lg text-sm font-bold transition-all"
                       >
                         <Plus className="w-4 h-4" /> Add Variant
                       </button>
                    </div>

                    {product.variants && product.variants.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {product.variants.map(variant => (
                          <div key={variant.id || variant._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center group hover:border-green-300 transition-all">
                             <div>
                                <p className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">{variant.displayName}</p>
                                <p className="text-lg font-black text-gray-900 mt-1">₹{variant.price}</p>
                             </div>
                             <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => {
                                    setSelectedVariant(variant);
                                    setSelectedProduct(product);
                                    setShowEditVariant(true);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedVariant(variant);
                                    setSelectedProduct(product);
                                    setShowDeleteVariant(true);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-white rounded-xl border-2 border-dashed border-gray-200">
                        <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm font-medium">No variants defined for this material yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODALS */}
      <ProductMasterModal 
        isOpen={showAddMaster || showEditMaster}
        onClose={() => {
          setShowAddMaster(false);
          setShowEditMaster(false);
          setSelectedProduct(null);
        }}
        product={showEditMaster ? selectedProduct : null}
        onProductSaved={fetchProducts}
      />

      <AddProductVariantModal
        isOpen={showAddVariant}
        onClose={() => {
          setShowAddVariant(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onProductAdded={fetchProducts}
      />

      <EditProductVariantModal
        isOpen={showEditVariant}
        onClose={() => {
          setShowEditVariant(false);
          setSelectedVariant(null);
          setSelectedProduct(null);
        }}
        variant={selectedVariant}
        product={selectedProduct}
        onVariantUpdated={fetchProducts}
      />

      <DeleteProductVariantModal
        isOpen={showDeleteVariant}
        onClose={() => {
          setShowDeleteVariant(false);
          setSelectedVariant(null);
          setSelectedProduct(null);
        }}
        variant={selectedVariant}
        product={selectedProduct}
        onProductDeleted={fetchProducts}
      />

      <ConfirmDialog
        isOpen={showDeleteMasterConfirm}
        title="Delete Product Category?"
        message={`Are you sure you want to delete "${selectedProduct?.name}"? All variants must be deleted first.`}
        confirmText="Confirm Delete"
        variant="danger"
        isLoading={isSubmitting}
        onConfirm={handleDeleteProductMaster}
        onCancel={() => {
          setShowDeleteMasterConfirm(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
};

export default ProductMaster;
