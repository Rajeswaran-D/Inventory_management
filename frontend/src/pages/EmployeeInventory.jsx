import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, Search } from 'lucide-react';
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
    if (quantity < minimum) return { color: 'text-red-600', label: 'Low', bg: 'bg-red-50' };
    if (quantity < minimum * 2) return { color: 'text-amber-600', label: 'Medium', bg: 'bg-amber-50' };
    return { color: 'text-green-600', label: 'Good', bg: 'bg-green-50' };
  };

  const displayProducts = filteredProducts.length > 0 || searchQuery === '' ? filteredProducts : [];

  return (
    <div className="space-y-6 p-6 bg-white">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📦 Inventory Details</h1>
        <p className="text-sm text-gray-600 mt-1">View inventory stock levels and product details</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700">{error}</p>
            <p className="text-xs text-red-600 mt-1">Check browser console for details</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by size, material, GSM, color..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fetchInventory(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading && products.length === 0 && (
        <div className="bg-white rounded-lg p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory details...</p>
        </div>
      )}

      {!loading && displayProducts.length === 0 && !error && (
        <div className="bg-white rounded-lg p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">
            {searchQuery ? 'No products match your search' : 'No products in inventory'}
          </p>
        </div>
      )}

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
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Color</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Quantity</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Price (₹)</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
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
                      <td className="py-3 px-4"><span className="font-medium text-gray-900">{variant?.displayName || 'N/A'}</span></td>
                      <td className="py-3 px-4 text-gray-600">{productMaster?.name || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-600">{variant?.size || '-'}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{variant?.gsm || '-'}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{variant?.color || '-'}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">{product.quantity || 0}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">₹{(product.price || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${status.color} ${status.bg}`}>
                          {status.label} ({product.quantity || 0}/{minimum})
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeInventory;
