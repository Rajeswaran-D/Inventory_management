import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Trash2, Plus, Minus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { envelopeService, customerService, saleService, stockService } from '../services/api';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';

export const Billing = () => {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Search products
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length < 1) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await envelopeService.getAll({ search: searchTerm });
        setSearchResults(res.data || []);
      } catch (err) {
        console.error('Search error:', err);
      }
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const addToCart = (product) => {
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
      setCart([...cart, { ...product, cartQty: 1 }]);
    }
    setSearchTerm('');
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

    setIsProcessing(true);
    try {
      // Get or create customer
      const customerRes = await customerService.getOrCreate({
        name: customerName,
        phone: customerPhone
      });

      // Create sale
      const saleRes = await saleService.create({
        customerId: customerRes.data._id,
        items: cart.map(item => ({
          envelopeId: item._id,
          quantity: item.cartQty,
          price: item.price
        })),
        total: grandTotal
      });

      // Update stock for each item
      for (const item of cart) {
        await stockService.recordOut({
          envelopeId: item._id,
          quantity: item.cartQty
        });
      }

      toast.success('Sale completed successfully!');
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-8 h-8" />
            Billing System
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Create invoice and process sales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Search & Customer Info (Left) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Info */}
          <Card>
            <CardContent>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Customer Information</h3>
              <div className="space-y-3">
                <Input
                  label="Customer Name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  autoFocus
                />
                <Input
                  label="Phone (Optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Search */}
          <Card>
            <CardContent>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Add Products</h3>
              <div className="relative">
                <Input
                  icon={Search}
                  placeholder="Search products (size, material, GSM)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                    {searchResults.map(product => (
                      <button
                        key={product._id}
                        onClick={() => addToCart(product)}
                        disabled={product.quantity === 0}
                        className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors ${
                          product.quantity === 0
                            ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900'
                            : 'hover:bg-blue-50 dark:hover:bg-blue-900'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{product.size}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{product.materialType} • GSM {product.gsm}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white">₹{product.price}</p>
                            <p className={`text-xs font-medium ${
                              product.quantity < 50 
                                ? 'text-red-600' 
                                : product.quantity < 200 
                                  ? 'text-yellow-600' 
                                  : 'text-green-600'
                            }`}>
                              Stock: {product.quantity}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {searchTerm && searchResults.length === 0 && (
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No products found</p>
              )}
            </CardContent>
          </Card>

          {/* Items in Cart */}
          <Card>
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
                      className="flex items-center justify-between bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 p-4 rounded-lg transition-colors"
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
                          className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold text-gray-900 dark:text-white">{item.cartQty}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.cartQty + 1, item.quantity)}
                          className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors"
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

              <button
                onClick={() => {
                  setCart([]);
                  setCustomerName('');
                  setCustomerPhone('');
                  setSearchTerm('');
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
    </div>
  );
};
