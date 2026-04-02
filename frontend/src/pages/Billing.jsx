import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, FileText, Eye, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { envelopeService, customerService, saleService, stockService } from '../services/api';
import { realTimeSyncService } from '../services/realTimeSync';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { InvoiceBill } from '../components/ui/InvoiceBill';
import { ViewBillModal } from '../components/ui/ViewBillModal';
import { BillingProductSelector } from '../components/ui/BillingProductSelector';

export const Billing = () => {
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [sales, setSales] = useState([]);
  const [lastSale, setLastSale] = useState(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isViewBillModalOpen, setIsViewBillModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  // Fetch sales history
  useEffect(() => {
    const fetchSales = async () => {
      try {
        console.log('🔄 Fetching sales...');
        const res = await saleService.getAll({ limit: 100 });
        console.log('📦 API Response:', res);
        
        // Handle different response structures
        let salesData = [];
        if (Array.isArray(res.data)) {
          salesData = res.data;
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          salesData = res.data.data;
        } else if (res.data?.success && Array.isArray(res.data)) {
          salesData = res.data;
        }
        
        console.log('✅ Bills History fetched:', salesData.length, 'bills');
        setSales(salesData);
      } catch (err) {
        console.error('❌ Error fetching sales:', err);
        setSales([]);
      }
    };
    fetchSales();
    
    // Subscribe to real-time updates
    const handleSaleUpdate = () => {
      console.log('🔄 Sale updated, refreshing bills...');
      setTimeout(() => fetchSales(), 500);
    };
    
    const unsubscribe = realTimeSyncService.on('sale', handleSaleUpdate);
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const addToCart = (product) => {
    if (!product.price || product.price <= 0) {
      toast.error('Invalid product price');
      return;
    }
    
    if (product.quantity <= 0) {
      toast.error('Out of stock');
      return;
    }

    const existing = cart.find(item => item._id === product._id);
    if (existing) {
      if (existing.cartQty >= product.quantity) {
        toast.error('Stock limit reached');
        return;
      }
      setCart(cart.map(item =>
        item._id === product._id ? { ...item, cartQty: item.cartQty + 1 } : item
      ));
    } else {
      setCart([...cart, { 
        ...product, 
        cartQty: product.cartQty || 1,
        price: product.price 
      }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item._id !== id));
  };

  const updateQuantity = (id, newQty, maxQty) => {
    if (newQty < 1) {
      removeFromCart(id);
      return;
    }
    if (newQty > maxQty) {
      toast.error('Maximum stock exceeded');
      return;
    }
    setCart(cart.map(item =>
      item._id === id ? { ...item, cartQty: newQty } : item
    ));
  };

  const grandTotal = cart.reduce((sum, item) => sum + (item.price * item.cartQty), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Enter customer name');
      return;
    }

    console.log('🛒 Starting checkout...');
    console.log('Cart items:', cart);
    console.log('Customer:', customerName, customerPhone);
    console.log('Grand Total:', grandTotal);

    setIsProcessing(true);
    try {
      // Step 1: Get or create customer
      console.log('📝 Getting or creating customer...');
      const customerRes = await customerService.getOrCreate({
        name: customerName,
        phone: customerPhone || ''  // Empty string if no phone
      });
      console.log('✅ Customer created/retrieved:', customerRes.data);

      // Step 2: Prepare sale items
      const saleItems = cart.map(item => ({
        envelopeId: item._id,
        quantity: item.cartQty,
        price: item.price,
        total: item.price * item.cartQty,
        size: item.size,
        materialType: item.materialType,
        gsm: item.gsm,
        color: item.color,
        rate: item.price
      }));
      console.log('📦 Sale items prepared:', saleItems);

      // Step 3: Create sale
      console.log('💾 Creating sale...');
      const salePayload = {
        customerId: customerRes.data._id,
        items: saleItems,
        grandTotal: grandTotal
      };
      console.log('📤 Sale payload:', salePayload);
      
      const saleRes = await saleService.create(salePayload);
      console.log('✅ Sale created:', saleRes.data);

      // Trigger real-time sync for all modules
      realTimeSyncService.emit('sale', saleRes.data);
      realTimeSyncService.emit('inventory', { type: 'stock_updated', sale: saleRes.data });
      realTimeSyncService.emit('dashboard', { type: 'refresh' });
      realTimeSyncService.emit('reports', { type: 'new_sale', sale: saleRes.data });
      
      console.log('🔄 Real-time sync triggered across all modules');
      
      // Step 5: Set last sale for invoice generation
      const saleWithCustomer = {
        ...saleRes.data,
        customerName: customerName,
        customerPhone: customerPhone,
        items: cart.map(item => ({
          ...item,
          rate: item.price,
          quantity: item.cartQty
        }))
      };
      setLastSale(saleWithCustomer);

      toast.success('Sale completed! Ready to generate invoice.');
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');

      // Refresh sales list
      const refreshRes = await saleService.getAll({ limit: 100 });
      let updatedSales = [];
      if (Array.isArray(refreshRes.data)) {
        updatedSales = refreshRes.data;
      } else if (refreshRes.data?.data && Array.isArray(refreshRes.data.data)) {
        updatedSales = refreshRes.data.data;
      }
      setSales(updatedSales);
      console.log('🎉 Checkout completed successfully, sales updated:', updatedSales.length);
    } catch (err) {
      console.error('❌ Checkout error full details:', err);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Checkout failed';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <ShoppingCart className="w-8 h-8" style={{ color: 'var(--primary)' }} />
            Billing System
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Create invoice and process sales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Search & Customer Info (Left) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Info */}
          <Card className="bg-white dark:bg-gray-800\">
            <CardContent>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">Customer Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Name</label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone (Optional)</label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Selector */}
          <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <CardContent>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Add Products</h3>
              <BillingProductSelector 
                onAddToCart={addToCart}
                isLoading={isLoadingProducts}
              />
            </CardContent>
          </Card>

          {/* Items in Cart */}
          <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <CardContent>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Shopping Cart ({cart.length} items)
              </h3>
              {cart.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">Your cart is empty. Search and add products.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, idx) => (
                    <div 
                      key={item._id} 
                      className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 p-4 rounded-lg transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white">{item.size}</p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">({item.materialType})</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          ₹{item.price} × <span className="font-semibold">{item.cartQty}</span> = <span className="font-bold text-gray-900 dark:text-white">₹{(item.price * item.cartQty).toLocaleString()}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => updateQuantity(item._id, item.cartQty - 1, item.quantity)}
                          className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold text-gray-900 dark:text-white">{item.cartQty}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.cartQty + 1, item.quantity)}
                          className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="ml-2 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                          title="Remove from cart"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bill Summary (Right) */}
        <div>
          <Card className="sticky top-24 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-2 border-green-200 dark:border-green-800">
            <CardContent>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Bill Summary
              </h3>

              <div className="space-y-3 pb-4 border-b-2 border-green-200 dark:border-green-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Items in Cart:</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-base">{cart.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Total Quantity:</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-base">{cart.reduce((sum, item) => sum + item.cartQty, 0)}</span>
                </div>
              </div>

              <div className="py-4 border-b-2 border-green-200 dark:border-green-800">
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Grand Total:</span>
                  <span className="text-3xl font-black text-green-600 dark:text-green-400">
                    ₹{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isProcessing || cart.length === 0 || !customerName.trim()}
                className={`w-full mt-4 px-4 py-3 font-semibold rounded-lg transition-all ${
                  isProcessing || cart.length === 0 || !customerName.trim()
                    ? 'opacity-50 cursor-not-allowed bg-gray-400 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                    : 'bg-green-600 dark:bg-green-600 text-white hover:bg-green-700 dark:hover:bg-green-700 active:scale-95'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </span>
                ) : (
                  '✓ Complete Sale'
                )}
              </button>

              {lastSale && (
                <button
                  onClick={() => {
                    setSelectedSale(lastSale);
                    setIsInvoiceOpen(true);
                  }}
                  className="w-full mt-2 px-4 py-2 flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors font-medium"
                >
                  <FileText className="w-4 h-4" />
                  Generate Invoice
                </button>
              )}

              <button
                onClick={() => {
                  setCart([]);
                  setCustomerName('');
                  setCustomerPhone('');
                }}
                className="w-full mt-2 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Clear Cart
              </button>

              {cart.length > 0 && customerName.trim() && (
                <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg">
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    ✓ Ready to process sale for <span className="font-semibold">{customerName}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bills History Section */}
      {sales && sales.length > 0 ? (
        <div className="mt-8 pt-8 border-t-2 border-gray-200 dark:border-slate-700">
          <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <CardContent>
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Bills ({sales.length})</h3>
              </div>
            
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Items</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.slice(0, 5).map((sale) => (
                      <tr 
                        key={sale._id} 
                        className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-900 dark:text-white font-semibold">
                          {sale.customerName || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {sale.items?.length || 0} item(s)
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">
                          ₹{(sale.grandTotal || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                          {new Date(sale.createdAt).toLocaleDateString('en-IN')} {new Date(sale.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedBill(sale);
                              setIsViewBillModalOpen(true);
                            }}
                            className="inline-flex items-center justify-center p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="View Bill"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {sales.length > 5 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing 5 of {sales.length} bills • 
                    <a href="/bill-history" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold ml-1">View all</a>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="mt-8 text-center py-6 text-gray-500 dark:text-gray-400">
          <p>No bills yet. Create your first sale to see the history here.</p>
        </div>
      )}

      {/* View Bill Modal */}
      {isViewBillModalOpen && selectedBill && (
        <ViewBillModal
          bill={selectedBill}
          onClose={() => {
            setIsViewBillModalOpen(false);
            setSelectedBill(null);
          }}
        />
      )}

      {/* Invoice Modal */}
      <InvoiceBill 
        isOpen={isInvoiceOpen} 
        onClose={() => setIsInvoiceOpen(false)} 
        saleData={selectedSale}
      />
    </div>
  );
};
