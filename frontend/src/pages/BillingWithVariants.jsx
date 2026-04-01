/**
 * ENHANCED BILLING COMPONENT WITH FLEXIBLE PRODUCTS & VARIANTS
 * Supports dynamic product/variant selection
 */

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, AlertCircle, RefreshCw } from "lucide-react";
import axios from 'axios';
import realTimeSyncService from '../services/realTimeSync';
import '../styles/BillingWithVariants.css';

const API_BASE = 'http://localhost:5000/api/flexible-products';
const SALES_API = 'http://localhost:5000/api/sales';

export function BillingWithVariants() {
  // ==================== STATE ====================

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ==================== LOAD PRODUCTS ====================

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_BASE);
      setProducts(response.data.data || []);
      setError('');
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // ==================== CART FUNCTIONS ====================

  const addToCart = () => {
    setError('');
    setSuccess('');

    // Validation
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    if (!selectedVariant) {
      setError('Please select a variant');
      return;
    }

    if (!quantity || quantity <= 0) {
      setError('Enter valid quantity');
      return;
    }

    if (selectedVariant.stock < quantity) {
      setError(`Insufficient stock. Available: ${selectedVariant.stock}`);
      return;
    }

    // Create cart item
    const cartItem = {
      id: `${selectedProduct._id}-${selectedVariant.variant_id}-${Date.now()}`,
      productId: selectedProduct._id,
      productName: selectedProduct.displayName,
      variantId: selectedVariant.variant_id,
      variantType: selectedVariant.type,
      variantValue: selectedVariant.value,
      price: Number(selectedVariant.price),
      quantity: Number(quantity),
      stock: selectedVariant.stock,
      itemTotal: Number(selectedVariant.price) * Number(quantity)
    };

    setCart(prev => [...prev, cartItem]);
    setSuccess(`Added ${cartItem.quantity} x ${cartItem.productName} (${cartItem.variantValue})`);

    // Reset form
    setSelectedProduct(null);
    setSelectedVariant(null);
    setQuantity(1);

    setTimeout(() => setSuccess(''), 3000);
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }

    setCart(prev =>
      prev.map(item => {
        if (item.id === id) {
          if (newQty > item.stock) {
            setError(`Max stock available: ${item.stock}`);
            return item;
          }
          return {
            ...item,
            quantity: newQty,
            itemTotal: item.price * newQty
          };
        }
        return item;
      })
    );
  };

  // ==================== CHECKOUT ====================

  const calculateTotals = () => {
    let totalItems = 0;
    let totalAmount = 0;

    cart.forEach(item => {
      totalItems += item.quantity;
      totalAmount += item.itemTotal;
    });

    return {
      totalItems,
      totalAmount: Number(totalAmount.toFixed(2))
    };
  };

  const { totalItems, totalAmount } = calculateTotals();

  const completeBill = async () => {
    setError('');
    setSuccess('');

    // Validation
    if (cart.length === 0) {
      setError('❌ Cart is empty. Add items before generating bill.');
      return;
    }

    if (totalAmount <= 0) {
      setError('❌ Bill amount cannot be ₹0. Please check cart.');
      return;
    }

    try {
      setLoading(true);

      // Prepare bill data
      const billData = {
        customerName: customerName.trim() || 'N/A',
        customerPhone: customerPhone.trim() || '',
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          variantType: item.variantType,
          variantValue: item.variantValue,
          price: item.price,
          quantity: item.quantity,
          itemTotal: item.itemTotal
        })),
        grandTotal: totalAmount
      };

      // Create sale
      const response = await axios.post(`${SALES_API}/create`, billData);

      if (response.data?.data) {
        setSuccess(`✅ Bill #${response.data.data._id?.toString().slice(-6)} generated successfully!`);
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');

        // Emit real-time sync event
        realTimeSyncService.emit('saleCreated', response.data.data);

        // Clear success after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error creating bill:', err);
      setError(err.response?.data?.message || 'Failed to create bill');
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="billing-with-variants-container">
      <h1>💳 Smart Billing with Variants</h1>

      <div className="billing-content">
        {/* Left Section - Product Selection */}
        <div className="billing-left">
          <div className="form-card">
            <h2>📦 Select Product & Variant</h2>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Product Selection */}
            <div className="form-group">
              <label>Product *</label>
              <select
                value={selectedProduct?._id || ''}
                onChange={e => {
                  const prod = products.find(p => p._id === e.target.value);
                  setSelectedProduct(prod);
                  setSelectedVariant(null);
                }}
                className="form-control"
              >
                <option value="">-- Select Product --</option>
                {products.map(prod => (
                  <option key={prod._id} value={prod._id}>
                    {prod.displayName} ({prod.variants.length} variants)
                  </option>
                ))}
              </select>
            </div>

            {/* Variant Selection */}
            {selectedProduct && selectedProduct.variants.length > 0 && (
              <div className="form-group">
                <label>Variant *</label>
                <select
                  value={selectedVariant?.variant_id || ''}
                  onChange={e => {
                    const variant = selectedProduct.variants.find(
                      v => v.variant_id === e.target.value
                    );
                    setSelectedVariant(variant);
                  }}
                  className="form-control"
                >
                  <option value="">-- Select Variant --</option>
                  {selectedProduct.variants.map(variant => (
                    <option
                      key={variant.variant_id}
                      value={variant.variant_id}
                      disabled={variant.stock === 0}
                    >
                      {variant.type.toUpperCase()}: {variant.value} (₹{variant.price.toFixed(2)} | Stock: {variant.stock})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quantity */}
            <div className="form-group">
              <label>Quantity *</label>
              <div className="quantity-input">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="form-control"
                  min="1"
                />
                <button onClick={() => setQuantity(quantity + 1)}>
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Display Price & Stock */}
            {selectedVariant && (
              <div className="variant-info">
                <div className="info-row">
                  <span>💰 Unit Price:</span>
                  <strong>₹{selectedVariant.price.toFixed(2)}</strong>
                </div>
                <div className="info-row">
                  <span>📦 Available Stock:</span>
                  <strong className={selectedVariant.stock <= 10 ? 'low-stock' : ''}>
                    {selectedVariant.stock} {selectedVariant.unit} {selectedVariant.stock <= 10 ? '⚠️ Low' : ''}
                  </strong>
                </div>
                <div className="info-row">
                  <span>💵 Item Total:</span>
                  <strong className="item-total">
                    ₹{(selectedVariant.price * quantity).toFixed(2)}
                  </strong>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={addToCart}
              disabled={!selectedProduct || !selectedVariant || loading}
              className="btn btn-primary btn-block"
            >
              <ShoppingCart size={18} /> Add to Cart
            </button>
          </div>

          {/* Customer Info */}
          <div className="form-card">
            <h3>👤 Customer Information</h3>
            <div className="form-group">
              <label>Name (Optional)</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Customer name or leave empty for 'N/A'"
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Phone (Optional)</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="Customer phone number"
                className="form-control"
              />
            </div>
          </div>
        </div>

        {/* Right Section - Cart Summary */}
        <div className="billing-right">
          <div className="cart-card">
            <h2>
              <ShoppingCart size={20} /> Cart Items ({cart.length})
            </h2>

            {cart.length === 0 ? (
              <p className="empty-cart">🛒 Cart is empty. Add items from the left.</p>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="item-header">
                        <strong>{item.productName}</strong>
                        <button
                          className="btn-remove"
                          onClick={() => removeFromCart(item.id)}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="item-details">
                        <span className="variant-badge">
                          {item.variantType}: {item.variantValue}
                        </span>
                        <span className="price">₹{item.price.toFixed(2)}</span>
                      </div>

                      <div className="item-quantity">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="qty-btn"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="qty-input"
                          min="1"
                          max={item.stock}
                        />
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="qty-btn"
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="item-total">
                        Total: <strong>₹{item.itemTotal.toFixed(2)}</strong>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bill Summary */}
                <div className="bill-summary">
                  <div className="summary-row">
                    <span>Total Items:</span>
                    <strong>{totalItems}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <strong>₹{totalAmount.toFixed(2)}</strong>
                  </div>
                  <div className="summary-row final-total">
                    <span>Final Total:</span>
                    <strong>₹{totalAmount.toFixed(2)}</strong>
                  </div>

                  {totalAmount === 0 && (
                    <div className="warning-box">
                      <AlertCircle size={16} />
                      Total amount is ₹0. Please check cart.
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                  <button
                    onClick={completeBill}
                    disabled={cart.length === 0 || totalAmount <= 0 || loading}
                    className="btn btn-success btn-block"
                  >
                    ✅ Generate Bill (₹{totalAmount.toFixed(2)})
                  </button>
                  <button
                    onClick={() => setCart([])}
                    className="btn btn-secondary btn-block"
                  >
                    🗑️ Clear Cart
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
