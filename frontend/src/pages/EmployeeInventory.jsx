import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, Search, Package, AlertTriangle, Layers } from 'lucide-react';
import { inventoryService } from '../services/api';
import useToast from '../hooks/useToast';

const EmployeeInventory = () => {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

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

  const fetchInventory = useCallback(async (showToast = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await inventoryService.getAll({});
      let productsData = Array.isArray(res.data) ? res.data : res.data?.data || [];
      
      setProducts(productsData);
      applySearch(productsData, searchQuery);
      
      if (productsData.length > 0 && (showToast || !hasLoadedOnce)) {
        toast.info(`✅ Loaded ${productsData.length} products`);
        setHasLoadedOnce(true);
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to load inventory';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, toast, hasLoadedOnce]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    applySearch(products, query);
  };

  useEffect(() => {
    fetchInventory(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStockStatus = (quantity, minimum) => {
    if (quantity === 0) return { color: 'text-red-700', label: 'Out of Stock', bg: 'bg-red-100', border: 'border-red-500' };
    if (quantity < minimum) return { color: 'text-red-600', label: 'Low Stock', bg: 'bg-red-50', border: 'border-red-400' };
    if (quantity < minimum * 2) return { color: 'text-amber-600', label: 'Medium', bg: 'bg-amber-50', border: 'border-amber-400' };
    return { color: 'text-green-600', label: 'In Stock', bg: 'bg-green-50', border: 'border-green-400' };
  };

  const displayProducts = filteredProducts.length > 0 || searchQuery === '' ? filteredProducts : [];

  // Group Products by Material Type
  const groupedProducts = displayProducts.reduce((acc, product) => {
    const variant = product.variant || product.variantId || {};
    const productMaster = variant.productId || {};
    const type = productMaster.name || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(product);
    return acc;
  }, {});

  // Quick Summary Calculations
  const totalProducts = products.length;
  const totalUnits = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const lowStockCount = products.filter(p => (p.quantity || 0) < (p.minimumStockLevel || 50)).length;

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📦 Inventory Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Real-time view of stock levels and product details</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700">{error}</p>
            <p className="text-xs text-red-600 mt-1">Check browser console for details</p>
          </div>
        </div>
      )}

      {/* Quick Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Products</p>
            <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Units in Stock</p>
            <p className="text-2xl font-bold text-gray-900">{totalUnits.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Low Stock Alerts</p>
            <p className="text-2xl font-bold text-gray-900">{lowStockCount}</p>
          </div>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, size, GSM, or color..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <button
          onClick={() => fetchInventory(true)}
          disabled={loading}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Loading State */}
      {loading && products.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading inventory details...</p>
        </div>
      )}

      {/* Empty Search State */}
      {!loading && displayProducts.length === 0 && !error && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 font-medium">
            {searchQuery ? 'No products match your search.' : 'No products in inventory.'}
          </p>
        </div>
      )}

      {/* Main Card Grid Display */}
      {!loading && displayProducts.length > 0 && (
        <div className="space-y-8">
          {Object.entries(groupedProducts).map(([materialType, items]) => (
            <div key={materialType}>
              {/* Group Header */}
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-800">{materialType}</h2>
                <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2.5 py-0.5 border border-gray-300 rounded-full">
                  {items.length} variants
                </span>
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((product) => {
                  const variant = product.variant || product.variantId || {};
                  const minimum = product.minimumStockLevel || 50;
                  const qty = product.quantity || 0;
                  const status = getStockStatus(qty, minimum);

                  return (
                    <div 
                      key={product._id} 
                      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 border-l-4 ${status.border} p-5 flex flex-col justify-between h-full`}
                    >
                      {/* Card Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg sm:text-xl truncate pr-2">
                            {variant.displayName || 'Unnamed Variant'}
                          </h3>
                        </div>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold shrink-0 ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      {/* Card Details */}
                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {variant.size && (
                          <div className="flex flex-col">
                            <span className="text-xs uppercase font-semibold text-gray-400">Size</span>
                            <span className="font-medium text-gray-800">{variant.size}</span>
                          </div>
                        )}
                        {variant.gsm && (
                          <div className="flex flex-col">
                            <span className="text-xs uppercase font-semibold text-gray-400">GSM</span>
                            <span className="font-medium text-gray-800">{variant.gsm} GSM</span>
                          </div>
                        )}
                        {variant.color && (
                          <div className="flex flex-col">
                            <span className="text-xs uppercase font-semibold text-gray-400">Color</span>
                            <span className="font-medium text-gray-800">{variant.color}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer (Quantity and Price) */}
                      <div className="flex items-end justify-between mt-auto pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Stock Level</p>
                          <p className={`text-2xl font-black ${qty > 0 ? 'text-gray-900' : 'text-red-600'}`}>
                            {qty.toLocaleString()} <span className="text-sm font-medium text-gray-500">units</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Unit Price</p>
                          <p className="text-lg font-bold text-blue-600">
                            ₹{(product.price || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeInventory;
