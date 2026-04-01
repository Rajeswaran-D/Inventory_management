/**
 * SIMPLIFIED BILLING COMPONENT
 * 
 * Clean, step-by-step product selection:
 * Step 1: Material Type
 * Step 2: GSM (if applicable)
 * Step 3: Size (if applicable)
 * Step 4: Color (if applicable - Vibhoothi only)
 * Step 5: Quantity
 * 
 * Then add to cart with actual inventory price
 * Generates professional invoices with GST calculations
 */

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { Invoice } from '../components/ui/Invoice';
import { PRODUCT_CONFIG, generateDisplayName, validateSelection, getAllProducts } from '../utils/productConfig';
import '../styles/print.css';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

export const Billing = () => {
  // ========================================================================
  // STATE - PRODUCT SELECTION
  // ========================================================================

  const [material, setMaterial] = useState('');
  const [gsm, setGsm] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState('');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Cart State
  const [cart, setCart] = useState([]);

  // Customer Info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Invoice Modal
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  // ========================================================================
  // EFFECTS - FORM VALIDATION & DEBUGGING
  // ========================================================================

  useEffect(() => {
    // Debug log whenever selection changes
    if (material) {
      const product = PRODUCT_CONFIG[material];
      console.log('🛍️ Product Selection Debug:', {
        material,
        productName: product?.name,
        gsm: gsm || 'N/A',
        size: size || 'N/A',
        color: color || 'N/A',
        quantity: quantity || 'N/A',
        canAdd: canAddToCart()
      });
    }
  }, [material, gsm, size, color, quantity]);

  // ========================================================================
  // GET PAGE REFERENCES
  // ========================================================================

  const getProductDef = () => {
    return material ? PRODUCT_CONFIG[material] : null;
  };

  const productDef = getProductDef();
  const shouldShowGSM = productDef?.hasGSM === true;
  const shouldShowSize = productDef?.hasSize === true;
  const shouldShowColor = productDef?.hasColor === true;

  // ========================================================================
  // HANDLE MATERIAL CHANGE
  // ========================================================================

  const handleMaterialChange = (productId) => {
    console.log(`📦 Material selected: ${productId}`);
    setMaterial(productId);

    // Reset dependent fields
    setGsm('');
    setSize('');
    setColor('');
    setQuantity('');

    const product = PRODUCT_CONFIG[productId];
    if (product) {
      console.log(`  Product: ${product.name}`);
      console.log(`  Has GSM: ${product.hasGSM}`);
      console.log(`  Has Size: ${product.hasSize}`);
      console.log(`  Has Color: ${product.hasColor}`);
    }
  };

  // ========================================================================
  // VALIDATE SELECTION
  // ========================================================================

  const canAddToCart = () => {
    if (!material) return false;
    if (!quantity || parseInt(quantity) <= 0) return false;

    const product = PRODUCT_CONFIG[material];
    if (!product) return false;

    if (product.hasGSM && !gsm) return false;
    if (product.hasSize && !size) return false;
    if (product.hasColor && !color) return false;

    return true;
  };

  // ========================================================================
  // ADD TO CART
  // ========================================================================

  const handleAddToCart = async () => {
    if (!canAddToCart()) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsAdding(true);
    try {
      const product = PRODUCT_CONFIG[material];
      const qty = parseInt(quantity);

      console.log(`🔍 Searching inventory: ${product.name}, GSM: ${gsm || 'N/A'}, Size: ${size || 'N/A'}, Color: ${color || 'N/A'}`);

      // Build search params
      const searchParams = new URLSearchParams({
        productName: product.name,
        gsm: gsm || '',
        size: size || '',
        color: color || ''
      });

      const inventoryRes = await API.get(`/inventory/search?${searchParams}`);
      const inventoryItems = inventoryRes.data.data || [];

      if (inventoryItems.length === 0) {
        toast.error('Product not found in inventory');
        console.warn('❌ No inventory items found matching:', { productName: product.name, gsm, size, color });
        setIsAdding(false);
        return;
      }

      const inventoryItem = inventoryItems[0];
      const price = inventoryItem.price || 0;
      const availableStock = inventoryItem.quantity || 0;

      // Validate price
      if (price <= 0) {
        toast.error(`❌ Price not set for ${product.name}. Please update pricing in inventory.`);
        console.warn('❌ Invalid price:', price, 'for item:', inventoryItem);
        setIsAdding(false);
        return;
      }

      // Validate stock
      if (availableStock < qty) {
        toast.error(`❌ Insufficient stock. Available: ${availableStock}, Requested: ${qty}`);
        console.warn(`❌ Stock mismatch for ${product.name}: available=${availableStock}, requested=${qty}`);
        setIsAdding(false);
        return;
      }

      const itemTotal = qty * price;

      // Create cart item
      const cartItem = {
        id: `${material}-${gsm || 'X'}-${size || 'X'}-${color || 'X'}-${Date.now()}`,
        productId: material,
        productName: product.name,
        gsm: gsm || null,
        size: size || null,
        color: color || null,
        displayName: generateDisplayName(material, gsm, size, color),
        quantity: qty,
        price: price,
        itemTotal: itemTotal,
        inventoryId: inventoryItem._id,
        availableStock: availableStock
      };

      console.log('✅ Adding to cart:', cartItem);
      setCart([...cart, cartItem]);
      toast.success(`✅ Added ${qty}x ${product.name} @ ₹${price}/unit = ₹${itemTotal}`);

      // Reset form
      setMaterial('');
      setGsm('');
      setSize('');
      setColor('');
      setQuantity('');
    } catch (err) {
      console.error('❌ Error adding to cart:', err.response?.data || err.message);
      toast.error(err.response?.data?.error || 'Failed to add product');
    } finally {
      setIsAdding(false);
    }
  };

  // ========================================================================
  // CART MANAGEMENT
  // ========================================================================

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
        return { ...item, quantity: newQty, itemTotal: newQty * item.price };
      }
      return item;
    }));
  };

  const getTotalQuantity = () => cart.reduce((sum, item) => sum + item.quantity, 0);
  const getGrandTotal = () => cart.reduce((sum, item) => sum + (item.itemTotal || 0), 0);

  // ========================================================================
  // CHECKOUT
  // ========================================================================

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      setIsCheckingOut(true);
      console.log('📦 Processing checkout for:', customerName);

      const grandTotal = getGrandTotal();
      const saleData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: cart.map(item => ({
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
        grandTotal: grandTotal,
        date: new Date().toISOString()
      };

      console.log('📤 Sale data:', saleData);

      const saleRes = await API.post('/sales', saleData);
      const billId = saleRes.data.data._id;

      console.log('✅ Bill generated:', billId);
      console.log('📊 Inventory has been updated for all items');

      // Store sale and show invoice
      setLastSale(saleRes.data.data);
      setShowInvoice(true);
      
      // Show success toast
      toast.success(
        `✅ Bill #${billId.toString().slice(-6).toUpperCase()}\n` +
        `Customer: ${customerName}\n` +
        `Total: ₹${grandTotal.toFixed(2)}\n` +
        `📊 Inventory Updated!`
      );

      // Reset form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
    } catch (err) {
      console.error('❌ Checkout error:', err);
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  const materials = getAllProducts();

  return (
    <div className="grid grid-cols-3 gap-6 p-8 bg-gray-50 min-h-screen">
      {/* ===================================================================== */}
      {/* LEFT: PRODUCT SELECTOR */}
      {/* ===================================================================== */}
      <div className="col-span-2">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Product Selection</h2>

          {/* STEP 1: MATERIAL TYPE */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Step 1: Material Type <span className="text-red-500">*</span>
            </label>
            <select
              value={material}
              onChange={(e) => handleMaterialChange(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select Material...</option>
              {materials.map(prod => (
                <option key={prod.id} value={prod.id}>
                  {prod.name}
                </option>
              ))}
            </select>
            {materials.length === 0 && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">No products available</p>
              </div>
            )}
          </div>

          {/* STEP 2: GSM (if applicable) */}
          {shouldShowGSM && (
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Step 2: GSM <span className="text-red-500">*</span>
              </label>
              <select
                value={gsm}
                onChange={(e) => setGsm(e.target.value)}
                disabled={!material}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
              >
                <option value="">Select GSM...</option>
                {productDef?.gsmOptions?.map(g => (
                  <option key={g} value={g}>
                    {g} GSM
                  </option>
                ))}
              </select>
              {material && productDef?.gsmOptions?.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">No GSM options available</p>
              )}
            </div>
          )}

          {/* STEP 3: SIZE (if applicable) */}
          {shouldShowSize && (
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Step {shouldShowGSM ? 3 : 2}: Size <span className="text-red-500">*</span>
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                disabled={!material || (shouldShowGSM && !gsm)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
              >
                <option value="">Select Size...</option>
                {productDef?.sizeOptions?.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {material && productDef?.sizeOptions?.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">No size options available</p>
              )}
            </div>
          )}

          {/* STEP 4: COLOR (if applicable - Vibhoothi only) */}
          {shouldShowColor && (
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Step {shouldShowGSM && shouldShowSize ? 4 : shouldShowGSM || shouldShowSize ? 3 : 2}: Color{' '}
                <span className="text-red-500">*</span>
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={!material}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
              >
                <option value="">Select Color...</option>
                {productDef?.colorOptions?.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {material && productDef?.colorOptions?.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">No color options available</p>
              )}
            </div>
          )}

          {/* FINAL STEP: QUANTITY */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Step {(shouldShowGSM ? 1 : 0) + (shouldShowSize ? 1 : 0) + (shouldShowColor ? 1 : 0) + 1}: Quantity{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={!material}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            />
          </div>

          {/* ADD TO CART BUTTON */}
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart() || isAdding}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
              canAddToCart() && !isAdding
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isAdding ? '⏳ Adding...' : '+ Add to Cart'}
          </button>

          {/* SELECTION SUMMARY */}
          {material && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Selected:</p>
              <p className="text-lg font-bold text-gray-900">
                {generateDisplayName(material, gsm, size, color)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* RIGHT: CART & CHECKOUT */}
      {/* ===================================================================== */}
      <div className="col-span-1">
        {/* CUSTOMER INFO */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">Customer Info</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Name *</label>
              <input
                type="text"
                placeholder="Customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Phone</label>
              <input
                type="tel"
                placeholder="(Optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* CART SUMMARY */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Cart ({cart.length})
          </h3>

          {cart.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>Cart is empty</p>
            </div>
          ) : (
            <>
              {/* CART ITEMS */}
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-sm text-gray-900">{item.displayName}</p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">₹{item.price}/unit</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-300 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-300 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* SUMMARY */}
              <div className="border-t-2 border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Items:</span>
                  <span className="font-semibold">{cart.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Qty:</span>
                  <span className="font-semibold">{getTotalQuantity()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t">
                  <span>Total:</span>
                  <span className="text-green-600">₹{getGrandTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* CHECKOUT BUTTON */}
              <button
                onClick={handleCheckout}
                disabled={!customerName.trim() || isCheckingOut}
                className={`w-full mt-4 py-2 px-4 rounded-lg font-semibold transition-all ${
                  customerName.trim() && !isCheckingOut
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isCheckingOut ? '⏳ Processing...' : 'Checkout'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* INVOICE MODAL */}
      {showInvoice && (
        <Invoice 
          sale={lastSale}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </div>
  );
};

export default Billing;
