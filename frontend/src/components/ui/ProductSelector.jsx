import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { ENVELOPE_SIZES, MATERIAL_TYPES, getProductDisplayName, extractGSM, getColorFromMaterial } from '../../utils/productCatalog';

/**
 * ProductSelector Component
 * Dropdown-based product selection with related fields auto-filled
 * 
 * Props:
 *   - onProductSelect: (product) => void - Called when product is selected
 *   - disabled: boolean - Disable the selector
 *   - allowCustom: boolean - Allow creating new products (default: false)
 *   - selectedSize: string - Pre-selected size
 *   - selectedMaterial: string - Pre-selected material
 */
export const ProductSelector = ({ 
  onProductSelect, 
  disabled = false,
  allowCustom = false,
  selectedSize = '',
  selectedMaterial = '',
  label = 'Select Product'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Generate product list
  const products = ENVELOPE_SIZES.flatMap(size =>
    MATERIAL_TYPES.map(material => ({
      size,
      material,
      gsm: extractGSM(material),
      color: getColorFromMaterial(material),
      displayName: getProductDisplayName(size, material)
    }))
  );

  // Filter products based on search
  const filteredProducts = products.filter(p =>
    p.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (product) => {
    const selectedData = {
      size: product.size,
      materialType: product.material,
      gsm: product.gsm,
      color: product.color
    };
    setSelectedProduct(selectedData);
    onProductSelect(selectedData);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          {label}
        </label>
      )}

      <div className="relative">
        {/* Main Button / Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full px-4 py-2 text-left rounded-lg border flex items-center justify-between transition-all"
          style={{
            backgroundColor: disabled ? 'var(--bg-card)' : 'var(--bg-card)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
            opacity: disabled ? 0.6 : 1
          }}
        >
          <span>
            {selectedProduct ? selectedProduct.size + ' | ' + selectedProduct.materialType : 'Choose a product...'}
          </span>
          <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
            style={{ borderColor: 'var(--border)' }}
          >
            {/* Search Input */}
            <div className="sticky top-0 p-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  '--tw-ring-color': 'var(--primary)'
                }}
              />
            </div>

            {/* Product List */}
            {filteredProducts.length > 0 ? (
              <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {filteredProducts.map((product, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => handleSelect(product)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <div className="font-medium">{product.displayName}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {product.gsm && `GSM: ${product.gsm}`}
                        {product.color && ` | Color: ${product.color}`}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-6 text-center" style={{ color: 'var(--text-secondary)' }}>
                No products found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Display selected product details */}
      {selectedProduct && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm" style={{ color: 'var(--text-primary)' }}>
          <div className="font-medium">Selected Product:</div>
          <div className="mt-1">
            <div>Size: <span className="font-semibold">{selectedProduct.size}</span></div>
            <div>Material: <span className="font-semibold">{selectedProduct.materialType}</span></div>
            {selectedProduct.gsm && <div>GSM: <span className="font-semibold">{selectedProduct.gsm}</span></div>}
            {selectedProduct.color && <div>Color: <span className="font-semibold">{selectedProduct.color}</span></div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSelector;
