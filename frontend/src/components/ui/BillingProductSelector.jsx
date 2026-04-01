/**
 * BillingProductSelector Component
 * Dynamic dropdown selection with conditional fields based on product type
 * Material → GSM (if applicable) → Size (if applicable) → Color (if applicable) → Quantity
 */

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { productService, inventoryService } from '../../services/api';

export const BillingProductSelector = ({ onAddToCart, isLoading }) => {
  const [material, setMaterial] = useState('');
  const [gsm, setGsm] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState('');
  const [color, setColor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [productConfig, setProductConfig] = useState({});
  const [materials, setMaterials] = useState([]);
  const [gsmOptions, setGsmOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [inventory, setInventory] = useState([]);

  // Load product configuration and variants on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('📦 Loading product configuration...');
        const [configRes, variantsRes, invRes] = await Promise.all([
          productService.getProductConfig(),
          productService.getAllVariants({ isActive: true }),
          inventoryService.getAll({ limit: 500 })
        ]);

        const config = configRes.data || {};
        setProductConfig(config);
        setMaterials(Object.keys(config));
        setVariants(variantsRes.data || []);
        setInventory(invRes.data || []);
        console.log('✅ Product configuration loaded');
        console.log('   Materials:', Object.keys(config));
        console.log('   Variants:', variantsRes.data?.length, 'items');
        console.log('   Inventory:', invRes.data?.length, 'items');
        if (variantsRes.data?.length > 0) {
          console.log('   Sample variant:', variantsRes.data[0]);
        }
        if (invRes.data?.length > 0) {
          console.log('   Sample inventory:', invRes.data[0]);
        }
      } catch (err) {
        console.error('Error loading product data:', err);
        toast.error('Failed to load products');
      }
    };
    loadData();
  }, []);

  // Update GSM options when material changes
  useEffect(() => {
    if (material && productConfig[material]) {
      setGsmOptions(productConfig[material].gsmOptions || []);
    }
    setGsm('');
    setSizeOptions([]);
    setColorOptions([]);
  }, [material, productConfig]);

  // Update Size and Color options when GSM changes
  useEffect(() => {
    if (material && productConfig[material]) {
      setSizeOptions(productConfig[material].sizeOptions || []);
      setColorOptions(productConfig[material].colorOptions || []);
    }
    setSize('');
    setColor('');
  }, [gsm, material, productConfig]);

  const handleMaterialChange = (newMaterial) => {
    setMaterial(newMaterial);
    setGsm('');
    setSize('');
    setColor('');
    setQuantity('');
  };

  const handleGsmChange = (newGsm) => {
    setGsm(newGsm);
    setSize('');
    setColor('');
  };

  const handleSizeChange = (newSize) => {
    setSize(newSize);
    setColor('');
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === '' || !isNaN(value)) {
      setQuantity(value);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();

    // Validation
    if (!material) {
      toast.error('Please select material');
      return;
    }

    const config = productConfig[material];
    if (config.hasGSM && !gsm) {
      toast.error('Please select GSM');
      return;
    }
    if (config.hasSize && !size) {
      toast.error('Please select size');
      return;
    }
    if (config.hasColor && !color) {
      toast.error('Please select color');
      return;
    }
    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
      toast.error('Please enter valid quantity');
      return;
    }

    setSubmitting(true);
    try {
      console.log('🔍 Searching for matching variant...');
      console.log('Material:', material, 'GSM:', gsm, 'Size:', size, 'Color:', color);
      
      const config = productConfig[material] || {};
      
      // Find matching variant
      const matchingVariant = variants.find(v => {
        const materialMatch = v.productId?.name === material;
        const gsmMatch = config.hasGSM ? (v.gsm === parseInt(gsm)) : true;
        const sizeMatch = config.hasSize ? (v.size === size) : true;
        const colorMatch = config.hasColor ? (v.color === color) : true;
        
        return materialMatch && gsmMatch && sizeMatch && colorMatch;
      });

      if (!matchingVariant) {
        console.error('❌ No matching variant found');
        console.error('Config for', material, ':', config);
        toast.error('Product variant not found. Please add it in Product Master.');
        return;
      }
      
      console.log('✅ Matching variant found:', matchingVariant);

      // Find matching inventory item
      const inventoryItem = inventory.find(inv => 
        inv.variantId?._id === matchingVariant._id || 
        (inv.variantId === matchingVariant._id)
      );
      
      if (!inventoryItem) {
        console.error('❌ Inventory match failed');
        console.error('Looking for variant ID:', matchingVariant._id);
        console.error('Variant data:', matchingVariant);
        console.error('Total inventory items:', inventory.length);
        if (inventory.length > 0) {
          console.error('Sample inventory item:', inventory[0]);
          console.error('Sample variantId:', inventory[0].variantId);
          console.error('Sample variantId._id:', inventory[0].variantId?._id);
        }
        toast.error('Product not found in inventory. Please check inventory setup.');
        return;
      }

      if (!inventoryItem.price || inventoryItem.price <= 0) {
        toast.error('Invalid product price');
        return;
      }

      if (inventoryItem.quantity <= 0) {
        toast.error('Out of stock');
        return;
      }

      // Create cart item from variant with price from inventory
      const qty = parseInt(quantity);
      onAddToCart({
        _id: matchingVariant._id,
        displayName: matchingVariant.displayName,
        sku: matchingVariant.sku,
        material: material,
        gsm: config.hasGSM ? gsm : null,
        size: config.hasSize ? size : null,
        color: config.hasColor ? color : null,
        cartQty: qty,
        price: inventoryItem.price,
        quantity: inventoryItem.quantity,
        variant: matchingVariant
      });

      // Reset form
      setMaterial('');
      setGsm('');
      setSize('');
      setQuantity('');
      setColor('');
      toast.success(`Added ${qty} units to cart`);
    } catch (err) {
      console.error('❌ Error adding to cart:', err);
      console.error('Error message:', err.message);
      toast.error(err.message || 'Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  // Determine what fields to show based on product config
  const currentConfig = productConfig[material] || {};
  const showGsm = material && currentConfig.hasGSM;
  const showSize = material && currentConfig.hasSize;
  const showColor = material && currentConfig.hasColor;

  return (
    <form onSubmit={handleAddToCart} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        {/* Material Dropdown */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Material <span className="text-red-500">*</span>
          </label>
          <select
            value={material}
            onChange={(e) => handleMaterialChange(e.target.value)}
            disabled={isLoading || submitting}
            className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 text-sm"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--primary)'
            }}
          >
            <option value="">Select Material</option>
            {materials.map(mat => (
              <option key={mat} value={mat}>{mat}</option>
            ))}
          </select>
        </div>

        {/* GSM/Quality Dropdown (Conditional) */}
        {showGsm && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              GSM <span className="text-red-500">*</span>
            </label>
            <select
              value={gsm}
              onChange={(e) => handleGsmChange(e.target.value)}
              disabled={isLoading || submitting || !material}
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 text-sm"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--primary)'
              }}
            >
              <option value="">Select GSM</option>
              {gsmOptions.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        )}

        {/* Size Dropdown (Conditional) */}
        {showSize && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Size <span className="text-red-500">*</span>
            </label>
            <select
              value={size}
              onChange={(e) => handleSizeChange(e.target.value)}
              disabled={isLoading || submitting || !material}
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 text-sm"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--primary)'
              }}
            >
              <option value="">Select Size</option>
              {sizeOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        {/* Color Dropdown (Conditional) */}
        {showColor && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Color <span className="text-red-500">*</span>
            </label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={isLoading || submitting || !material}
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 text-sm"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--primary)'
              }}
            >
              <option value="">Select Color</option>
              {colorOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Qty <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="1"
            value={quantity}
            onChange={handleQuantityChange}
            disabled={isLoading || submitting}
            className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 text-sm"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--primary)'
            }}
          />
        </div>

        {/* Add Button */}
        <button
          type="submit"
          disabled={submitting || isLoading || !material || !quantity || (showGsm && !gsm) || (showSize && !size) || (showColor && !color)}
          className="px-4 py-2 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
          style={{
            backgroundColor: 'var(--primary)',
            opacity: submitting || isLoading || !material || !quantity || (showGsm && !gsm) || (showSize && !size) || (showColor && !color) ? 0.6 : 1
          }}
          onMouseEnter={(e) => !submitting && (e.target.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.target.style.opacity = submitting || !material || !quantity || (showGsm && !gsm) || (showSize && !size) || (showColor && !color) ? '0.6' : '1')}
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add
            </>
          )}
        </button>
      </div>

      {/* Info Summary */}
      {material && (
        <div className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
          Selected: <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
            {material}
            {showGsm && gsm && ` | ${gsm} GSM`}
            {showSize && size && ` | ${size}`}
            {showColor && color && ` | ${color}`}
          </span>
        </div>
      )}
    </form>
  );
};

export default BillingProductSelector;
