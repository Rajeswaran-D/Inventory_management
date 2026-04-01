/**
 * ProductSelector3Step Component
 * 3-step dropdown for Material → GSM → Size selection
 */

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  MATERIAL_TYPES,
  getGsmVariants,
  getColorOptions,
  requiresColor,
  getAvailableSizes,
  formatProductName
} from '../../utils/productData';

export const ProductSelector3Step = ({ 
  onSelect, 
  disabled = false,
  showSummary = true,
  label = "Select Product"
}) => {
  const [material, setMaterial] = useState('');
  const [gsm, setGsm] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');

  // Get available options
  const gsmOptions = material ? getGsmVariants(material) : [];
  const colorOptions = material && requiresColor(material) ? getColorOptions(material) : [];
  const sizeOptions = material ? getAvailableSizes(material) : [];

  // Handle material change
  const handleMaterialChange = (e) => {
    const newMaterial = e.target.value;
    setMaterial(newMaterial);
    setGsm(''); // Reset GSM
    setSize(''); // Reset Size
    setColor(''); // Reset Color
  };

  // Handle GSM change
  const handleGsmChange = (e) => {
    setGsm(e.target.value);
  };

  // Handle size change
  const handleSizeChange = (e) => {
    const newSize = e.target.value;
    setSize(newSize);
    
    // Trigger callback when all required fields are filled
    if (newSize && material && (!gsmOptions || !gsmOptions.length || gsm) && (!colorOptions || !colorOptions.length || color)) {
      const selected = {
        material,
        gsm: gsmOptions && gsmOptions.length ? parseInt(gsm) : null,
        size: newSize,
        color: colorOptions && colorOptions.length ? color : null
      };
      onSelect(selected);
    }
  };

  // Handle color change
  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setColor(newColor);
    
    // Trigger callback when all fields are filled
    if (material && size && (!gsmOptions || !gsmOptions.length || gsm) && (!colorOptions || !colorOptions.length || newColor)) {
      const selected = {
        material,
        gsm: gsmOptions && gsmOptions.length ? parseInt(gsm) : null,
        size,
        color: colorOptions && colorOptions.length ? newColor : null
      };
      onSelect(selected);
    }
  };

  const isComplete = material && size && 
    (!gsmOptions || !gsmOptions.length || gsm) && 
    (!colorOptions || !colorOptions.length || color);

  const displayName = isComplete 
    ? formatProductName(material, size, gsm || null, color || null)
    : null;

  return (
    <div className="space-y-4">
      {label && (
        <label className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {label}
        </label>
      )}

      {/* Step 1: Material Selection */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          Step 1: Material Type
        </label>
        <select
          value={material}
          onChange={handleMaterialChange}
          disabled={disabled}
          className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-offset-0 appearance-none"
          style={{
            borderColor: material ? 'var(--primary)' : 'var(--border)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
            paddingRight: '32px',
            opacity: disabled ? 0.5 : 1
          }}
        >
          <option value="">Choose Material...</option>
          {MATERIAL_TYPES.map((mat) => (
            <option key={mat} value={mat}>
              {mat}
            </option>
          ))}
        </select>
      </div>

      {/* Step 2: GSM Selection (if applicable) */}
      {material && gsmOptions && gsmOptions.length > 0 && (
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Step 2: GSM
          </label>
          <select
            value={gsm}
            onChange={handleGsmChange}
            disabled={disabled}
            className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-offset-0 appearance-none"
            style={{
              borderColor: gsm ? 'var(--primary)' : 'var(--border)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              paddingRight: '32px',
              opacity: disabled ? 0.5 : 1
            }}
          >
            <option value="">Choose GSM...</option>
            {gsmOptions.map((g) => (
              <option key={g} value={g}>
                {g} GSM
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Step 2b: Color Selection (if applicable) */}
      {material && colorOptions && colorOptions.length > 0 && (
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Step 2: Color
          </label>
          <select
            value={color}
            onChange={handleColorChange}
            disabled={disabled}
            className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-offset-0 appearance-none"
            style={{
              borderColor: color ? 'var(--primary)' : 'var(--border)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              paddingRight: '32px',
              opacity: disabled ? 0.5 : 1
            }}
          >
            <option value="">Choose Color...</option>
            {colorOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Step 3: Size Selection */}
      {material && (
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Step {gsmOptions?.length ? 3 : colorOptions?.length ? 3 : 2}: Size
          </label>
          <select
            value={size}
            onChange={handleSizeChange}
            disabled={disabled}
            className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-offset-0 appearance-none"
            style={{
              borderColor: size ? 'var(--primary)' : 'var(--border)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              paddingRight: '32px',
              opacity: disabled ? 0.5 : 1
            }}
          >
            <option value="">Choose Size...</option>
            {sizeOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Summary */}
      {showSummary && isComplete && displayName && (
        <div
          className="p-4 rounded-lg border-2"
          style={{
            backgroundColor: 'var(--primary)',
            borderColor: 'var(--primary)',
            opacity: 0.15
          }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
            ✅ Selected: {displayName}
          </p>
        </div>
      )}
    </div>
  );
};
