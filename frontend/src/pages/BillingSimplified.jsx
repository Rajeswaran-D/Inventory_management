import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, FileText, AlertCircle, CheckCircle, Search, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { Invoice } from '../components/ui/Invoice';
import '../styles/print.css';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

export const Billing = () => {
  // ========================================================================
  // INVENTORY STATE (Single Source of Truth)
  // ========================================================================
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const res = await API.get('/inventory?limit=1000');
      setInventory(res.data.data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      toast.error('Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // ========================================================================
  // FORM SELECTION STATE
  // ========================================================================
  const [material, setMaterial] = useState('');
  const [gsm, setGsm] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState('');

  // Cart & UI State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerGSTIN, setCustomerGSTIN] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  // ========================================================================
  // SMART FILTERING & ATTRIBUTE RESOLUTION
  // ========================================================================
  const materials = useMemo(() => {
    const opts = new Set(inventory.map(i => i.variant?.productId?.name).filter(Boolean));
    return [...opts].sort();
  }, [inventory]);

  // Alias for populated variant data
  const getVariant = (inv) => inv.variantId || inv.variant;
  const getProduct = (inv) => {
    const v = getVariant(inv);
    return v?.productId || null;
  };

  const activeProduct = useMemo(() => {
    if (!material) return null;
    for (const inv of inventory) {
      const product = getProduct(inv);
      if (product?.name === material) return product;
    }
    return null;
  }, [inventory, material]);

  const shouldShowGSM = activeProduct?.hasGSM || false;
  const shouldShowSize = activeProduct?.hasSize || false;
  const shouldShowColor = activeProduct?.hasColor || false;

  const filteredInventory = useMemo(() => {
    let items = inventory;
    if (material) items = items.filter(i => getProduct(i)?.name === material);
    if (gsm) items = items.filter(i => getVariant(i)?.gsm === parseInt(gsm));
    if (size) items = items.filter(i => getVariant(i)?.size === size);
    if (color) items = items.filter(i => getVariant(i)?.color === color);
    return items;
  }, [inventory, material, gsm, size, color]);

  const gsmOptions = useMemo(() => {
    const items = inventory.filter(i => getProduct(i)?.name === material);
    return [...new Set(items.map(i => getVariant(i)?.gsm).filter(Boolean))].sort((a, b) => a - b);
  }, [inventory, material]);

  const sizeOptions = useMemo(() => {
    const items = inventory.filter(i => 
      getProduct(i)?.name === material && 
      (!shouldShowGSM || !gsm || getVariant(i)?.gsm === parseInt(gsm))
    );
    return [...new Set(items.map(i => getVariant(i)?.size).filter(Boolean))].sort();
  }, [inventory, material, gsm, shouldShowGSM]);

  const colorOptions = useMemo(() => {
    const items = inventory.filter(i => 
      getProduct(i)?.name === material && 
      (!shouldShowGSM || !gsm || getVariant(i)?.gsm === parseInt(gsm)) &&
      (!shouldShowSize || !size || getVariant(i)?.size === size)
    );
    return [...new Set(items.map(i => getVariant(i)?.color).filter(Boolean))].sort();
  }, [inventory, material, gsm, size, shouldShowGSM, shouldShowSize]);

  // Determine Exact Match
  const isSelectionComplete = material && 
    (!shouldShowGSM || gsm) && 
    (!shouldShowSize || size) && 
    (!shouldShowColor || color);

  const exactMatch = useMemo(() => {
    if (!isSelectionComplete) return null;
    return filteredInventory[0] || null;
  }, [filteredInventory, isSelectionComplete]);

  // ========================================================================
  // SEARCH FILTERED INVENTORY (for search box)
  // ========================================================================
  const searchedInventory = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return inventory.filter(inv => {
      const variant = getVariant(inv);
      const product = getProduct(inv);
      const displayName = variant?.displayName || '';
      const productName = product?.name || '';
      return displayName.toLowerCase().includes(term) || 
             productName.toLowerCase().includes(term);
    }).slice(0, 10);
  }, [inventory, searchTerm]);

  // ========================================================================
  // HANDLERS
  // ========================================================================
  const handleMaterialChange = (val) => { setMaterial(val); setGsm(''); setSize(''); setColor(''); setQuantity(''); };
  const handleGsmChange = (val) => { setGsm(val); setSize(''); setColor(''); setQuantity(''); };
  const handleSizeChange = (val) => { setSize(val); setColor(''); setQuantity(''); };
  const handleColorChange = (val) => { setColor(val); setQuantity(''); };

  // Quick-add from search results
  const handleQuickSelect = (inv) => {
    const variant = getVariant(inv);
    const product = getProduct(inv);
    if (!product || !variant) return;

    setMaterial(product.name);
    if (variant.gsm) setGsm(String(variant.gsm));
    if (variant.size) setSize(variant.size);
    if (variant.color) setColor(variant.color);
    setSearchTerm('');
  };

  // ========================================================================
  // CART OPERATIONS
  // ========================================================================
  const handleAddToCart = () => {
    if (!isSelectionComplete || !exactMatch) {
      toast.error('Please complete all selection steps.');
      return;
    }

    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      toast.error('Please enter a valid quantity.');
      return;
    }

    if (exactMatch.quantity < qty) {
      toast.error(`Out of stock! Only ${exactMatch.quantity} units available.`);
      return;
    }

    const price = exactMatch.price;
    if (!price || price <= 0) {
      toast.error(`Price is missing or 0 for this item. Update inventory pricing.`);
      return;
    }

    const variant = getVariant(exactMatch);
    const product = getProduct(exactMatch);
    
    // Check if item already exists in cart
    const existingIndex = cart.findIndex(c => c.variantId === variant._id);
    let newCart = [...cart];
    
    if (existingIndex >= 0) {
      const existingItem = newCart[existingIndex];
      const potentialQty = existingItem.quantity + qty;
      if (exactMatch.quantity < potentialQty) {
        toast.error(`Cannot add. Combined cart quantity exceeds stock (${exactMatch.quantity} max).`);
        return;
      }
      existingItem.quantity = potentialQty;
      existingItem.itemTotal = potentialQty * existingItem.price;
      toast.success(`Updated quantity for ${variant.displayName}`);
    } else {
      const cartItem = {
        id: `${variant._id}-${Date.now()}`,
        variantId: variant._id,
        productId: product?._id || null,
        productName: product?.name || 'Product',
        gsm: variant.gsm || null,
        size: variant.size || null,
        color: variant.color || null,
        displayName: variant.displayName,
        quantity: qty,
        price: price,
        itemTotal: qty * price,
        availableStock: exactMatch.quantity
      };
      newCart.push(cartItem);
      toast.success(`✅ Added ${qty}× ${variant.displayName} to cart`);
    }

    setCart(newCart);
    setQuantity('');
  };

  const removeFromCart = (cartItemId) => {
    setCart(cart.filter(item => item.id !== cartItemId));
    toast.success('Removed from cart');
  };

  const updateCartQuantity = (cartItemId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(cart.map(item => {
      if (item.id === cartItemId) {
        if (newQty > item.availableStock) {
          toast.error(`Exceeds maximum available stock (${item.availableStock})`);
          return item;
        }
        return { ...item, quantity: newQty, itemTotal: newQty * item.price };
      }
      return item;
    }));
  };

  const getTotalQuantity = () => cart.reduce((sum, item) => sum + item.quantity, 0);
  const getSubtotal = () => cart.reduce((sum, item) => sum + (item.itemTotal || 0), 0);
  
  // GST Calculations for cart display
  const cartTax = useMemo(() => {
    const subtotal = getSubtotal();
    const cgst = parseFloat(((subtotal * 9) / 100).toFixed(2));
    const sgst = parseFloat(((subtotal * 9) / 100).toFixed(2));
    const totalBeforeRound = subtotal + cgst + sgst;
    const grandTotal = Math.round(totalBeforeRound);
    const roundOff = parseFloat((grandTotal - totalBeforeRound).toFixed(2));
    return { subtotal, cgst, sgst, roundOff, grandTotal };
  }, [cart]);

  // ========================================================================
  // CHECKOUT — Production-ready with full error handling
  // ========================================================================
  const handleCheckout = async () => {
    // Validate cart
    if (cart.length === 0) {
      toast.error('Cart is empty. Add items before checkout.');
      return;
    }

    // Validate each cart item
    for (const item of cart) {
      if (!item.quantity || item.quantity <= 0) {
        toast.error(`Invalid quantity for ${item.displayName}`);
        return;
      }
      if (!item.price || item.price < 0) {
        toast.error(`Invalid price for ${item.displayName}`);
        return;
      }
    }

    try {
      setIsCheckingOut(true);
      
      const saleData = {
        customerName: customerName.trim() || "Walk-in Customer",
        customerPhone: customerPhone.trim(),
        customerGSTIN: customerGSTIN.trim(),
        items: cart.map(item => ({
          variantId: item.variantId,
          productId: item.productId,
          productName: item.productName,
          size: item.size,
          gsm: item.gsm,
          color: item.color,
          displayName: item.displayName,
          price: item.price,
          quantity: item.quantity,
          itemTotal: item.itemTotal
        })),
        grandTotal: cartTax.grandTotal,
        date: new Date().toISOString()
      };

      console.log('📤 Sending checkout request:', {
        customer: saleData.customerName,
        items: saleData.items.length,
        grandTotal: saleData.grandTotal
      });

      const saleRes = await API.post('/sales', saleData);
      
      console.log('✅ Checkout response:', saleRes.data);

      if (!saleRes.data.success) {
        throw new Error(saleRes.data.message || 'Checkout failed');
      }

      // Update local inventory state to instantly reflect reduced stock
      setInventory(prev => prev.map(inv => {
        const variant = getVariant(inv);
        const cartItem = cart.find(c => c.variantId === variant?._id);
        if (cartItem) {
          return { ...inv, quantity: Math.max(0, inv.quantity - cartItem.quantity) };
        }
        return inv;
      }));

      // Store sale and show invoice
      setLastSale(saleRes.data.data);
      setShowInvoice(true);
      
      toast.success(`✅ Bill ${saleRes.data.data?.billNumber || ''} generated successfully!`);
      
      // Reset form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerGSTIN('');
      handleMaterialChange('');

    } catch (err) {
      console.error('❌ Checkout error:', err);
      
      // Extract the most useful error message
      const errorMsg = err.response?.data?.message 
        || err.response?.data?.error 
        || err.message 
        || 'Checkout failed. Please try again.';
      
      toast.error(errorMsg);
      
      // Log full details for debugging
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 lg:p-8 bg-gray-50 min-h-screen">
      {/* ===================================================================== */}
      {/* LEFT: SMART PRODUCT SELECTOR */}
      {/* ===================================================================== */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* SEARCH BAR */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Quick search products... (e.g., Maplitho 100 GSM)"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          {/* Search Results Dropdown */}
          {searchedInventory.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
              {searchedInventory.map((inv, idx) => {
                const variant = getVariant(inv);
                return (
                  <button
                    key={idx}
                    onClick={() => handleQuickSelect(inv)}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex justify-between items-center"
                  >
                    <span className="text-sm font-medium text-gray-800">{variant?.displayName || 'Product'}</span>
                    <span className="text-xs text-gray-500">
                      Stock: {inv.quantity} | ₹{inv.price}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* PRODUCT SELECTOR */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-2xl font-bold text-gray-900">Product Selection</h2>
             {isLoading && <span className="text-sm text-blue-500 flex items-center gap-2"><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> Syncing Inventory...</span>}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* STEP 1: MATERIAL TYPE */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                1. Select Product Type
              </label>
              <select
                value={material}
                onChange={(e) => handleMaterialChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              >
                <option value="">Choose Material...</option>
                {materials.map(mat => (
                  <option key={mat} value={mat}>{mat}</option>
                ))}
              </select>
            </div>

            {/* STEP 2: GSM */}
            {shouldShowGSM && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  2. Select GSM
                </label>
                <select
                  value={gsm}
                  onChange={(e) => handleGsmChange(e.target.value)}
                  disabled={!material}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:bg-gray-50 disabled:opacity-50"
                >
                  <option value="">Choose GSM...</option>
                  {gsmOptions.map(g => (
                    <option key={g} value={g}>{g} GSM</option>
                  ))}
                </select>
              </div>
            )}

            {/* STEP 3: SIZE */}
            {shouldShowSize && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  {shouldShowGSM ? '3' : '2'}. Select Size
                </label>
                <select
                  value={size}
                  onChange={(e) => handleSizeChange(e.target.value)}
                  disabled={!material || (shouldShowGSM && !gsm)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:bg-gray-50 disabled:opacity-50"
                >
                  <option value="">Choose Size...</option>
                  {sizeOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {/* STEP 4: COLOR */}
            {shouldShowColor && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  {shouldShowGSM && shouldShowSize ? '4' : (shouldShowGSM || shouldShowSize ? '3' : '2')}. Select Color
                </label>
                <select
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  disabled={!material || (shouldShowGSM && !gsm) || (shouldShowSize && !size)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:bg-gray-50 disabled:opacity-50"
                >
                  <option value="">Choose Color...</option>
                  {colorOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* EXACT MATCH DISPLAY */}
            {isSelectionComplete && (
              <div className={`p-4 mt-2 rounded-xl border ${exactMatch ? (exactMatch.quantity > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200') : 'bg-orange-50 border-orange-200'}`}>
                {exactMatch ? (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                           <h4 className="font-bold text-gray-900">{getVariant(exactMatch)?.displayName}</h4>
                           <span className="font-bold text-lg">₹{exactMatch.price}</span>
                        </div>
                        {exactMatch.quantity > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                <CheckCircle className="w-4 h-4" /> Available In Stock: {exactMatch.quantity} units
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                                <AlertCircle className="w-4 h-4" /> Out of Stock
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-orange-700 font-medium flex items-center gap-2">
                        <AlertCircle className="w-5 h-5"/> This variant configuration does not exist in inventory.
                    </span>
                )}
              </div>
            )}

            {/* STEP 5: QUANTITY & SUBMIT */}
            <div className="pt-4 border-t border-gray-100 flex items-end gap-4 mt-2">
              <div className="flex-1">
                 <label className="block text-sm font-semibold mb-2 text-gray-700">Quantity</label>
                 <input
                   type="number"
                   value={quantity}
                   onChange={(e) => setQuantity(e.target.value)}
                   disabled={!exactMatch || exactMatch.quantity === 0}
                   placeholder="Enter quantity"
                   min="1"
                   max={exactMatch ? exactMatch.quantity : undefined}
                   className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:opacity-50 font-medium"
                 />
              </div>
              <button
                onClick={handleAddToCart}
                disabled={!quantity || !exactMatch || exactMatch.quantity <= 0}
                className="w-48 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus size={20} /> Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* CUSTOMER INFO */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
             Customer Details <span className="text-sm font-normal text-gray-400">(Optional)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer"
                className="w-full px-3 py-2 border border-gray-200 rounded bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+91..."
                className="w-full px-3 py-2 border border-gray-200 rounded bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">GSTIN</label>
              <input
                type="text"
                value={customerGSTIN}
                onChange={(e) => setCustomerGSTIN(e.target.value)}
                placeholder="Customer GSTIN (optional)"
                className="w-full px-3 py-2 border border-gray-200 rounded bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* RIGHT: CART SUMMARY */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-fit sticky top-24">
        <div className="p-6 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <ShoppingCart size={24} className="text-blue-600" />
            Current Bill
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {cart.length} {cart.length === 1 ? 'item' : 'items'} in cart
          </p>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[400px] p-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
              <ShoppingCart size={48} className="mb-4 opacity-20" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{item.displayName}</h4>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">₹{item.price} per unit</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded hover:bg-gray-50 text-gray-600"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-semibold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.availableStock}
                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="font-bold text-gray-900">
                      ₹{item.itemTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TOTALS WITH GST BREAKDOWN */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Items</span>
              <span className="font-semibold">{getTotalQuantity()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="font-semibold">₹{cartTax.subtotal.toFixed(2)}</span>
            </div>
            {cart.length > 0 && (
              <>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>CGST (9%)</span>
                  <span>₹{cartTax.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>SGST (9%)</span>
                  <span>₹{cartTax.sgst.toFixed(2)}</span>
                </div>
                {cartTax.roundOff !== 0 && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Round Off</span>
                    <span>₹{cartTax.roundOff.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between text-xl border-t border-gray-200 pt-3">
              <span className="font-bold text-gray-900">Grand Total</span>
              <span className="font-bold text-blue-600">₹{cartTax.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isCheckingOut}
            className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 hover:shadow-none active:bg-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isCheckingOut ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
            ) : (
                <><FileText size={20} /> Generate Final Bill</>
            )}
          </button>
        </div>
      </div>

      {showInvoice && lastSale && (
        <Invoice 
          sale={lastSale} 
          onClose={() => {
            setShowInvoice(false);
            setLastSale(null);
          }} 
        />
      )}
    </div>
  );
};
