/**
 * Product Management Page
 * Flexible product and variant creation, editing, and deletion
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { flexibleProductService } from '../services/api';
import '../styles/ProductManagement.css';

const VARIANT_TYPES = ['size', 'gsm', 'weight', 'custom'];

const VARIANT_VALUES = {
  size: ['S', 'M', 'L', 'XL', 'XXL'],
  gsm: ['70 GSM', '80 GSM', '90 GSM', '100 GSM', '120 GSM', 'Custom'],
  weight: ['500g', '1kg', '2kg', '5kg', '10kg', 'Custom'],
  custom: []
};

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form state for new product
  const [formData, setFormData] = useState({
    productInputType: 'select', // 'select' or 'type'
    selectedProduct: '',
    newProductName: '',
    newProductDisplay: '',
    newProductDescription: '',
    variantType: '',
    variantTypeInput: '',
    variantValue: '',
    variantValueInput: '',
    price: '',
    stock: '',
    unit: 'pcs'
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await flexibleProductService.getAll();
      setProducts(response.data.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      productInputType: 'select',
      selectedProduct: '',
      newProductName: '',
      newProductDisplay: '',
      newProductDescription: '',
      variantType: '',
      variantTypeInput: '',
      variantValue: '',
      variantValueInput: '',
      price: '',
      stock: '',
      unit: 'pcs'
    });
    setError('');
  };

  const validateForm = () => {
    // Validate product
    if (formData.productInputType === 'select') {
      if (!formData.selectedProduct) {
        setError('Please select a product');
        return false;
      }
    } else {
      if (!formData.newProductName || !formData.newProductName.trim()) {
        setError('Please enter a product name');
        return false;
      }
      if (!formData.newProductDisplay || !formData.newProductDisplay.trim()) {
        setError('Please enter a display name');
        return false;
      }
    }

    // Validate variant type
    const variantType =
      formData.variantType || (formData.variantTypeInput && formData.variantTypeInput.trim());
    if (!variantType) {
      setError('Please select or enter a variant type');
      return false;
    }

    // Validate variant value
    const variantValue =
      formData.variantValue || (formData.variantValueInput && formData.variantValueInput.trim());
    if (!variantValue) {
      setError('Please select or enter a variant value');
      return false;
    }

    // Validate price
    if (!formData.price || Number(formData.price) <= 0) {
      setError('Please enter a valid price (> 0)');
      return false;
    }

    // Validate stock
    if (formData.stock === '' || Number(formData.stock) < 0) {
      setError('Please enter valid stock (>= 0)');
      return false;
    }

    return true;
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    try {
      const variantType =
        formData.variantType || formData.variantTypeInput.trim().toLowerCase();
      const variantValue = formData.variantValue || formData.variantValueInput.trim();

      if (formData.productInputType === 'select') {
        // Add variant to existing product
        const product = products.find(p => (p._id || p.id) === formData.selectedProduct);

        const response = await flexibleProductService.addVariant(formData.selectedProduct, {
          type: variantType,
          value: variantValue,
          price: Number(formData.price),
          stock: Number(formData.stock),
          unit: formData.unit
        });

        setProducts(prev =>
          prev.map(p => ((p._id || p.id) === (response.data.data._id || response.data.data.id) ? response.data.data : p))
        );

        setSuccess(
          `Variant added to "${product.displayName}" successfully!`
        );
      } else {
        // Create new product with variant
        const response = await flexibleProductService.create({
          name: formData.newProductName.trim().toLowerCase(),
          displayName: formData.newProductDisplay.trim(),
          description: formData.newProductDescription,
          variants: [
            {
              type: variantType,
              value: variantValue,
              price: Number(formData.price),
              stock: Number(formData.stock),
              unit: formData.unit
            }
          ]
        });

        setProducts(prev => [response.data.data, ...prev]);
        setSuccess('Product and variant created successfully!');
      }

      resetForm();
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err.response?.data?.message || 'Error adding product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product and all its variants?')) {
      return;
    }

    try {
      await flexibleProductService.delete(productId);
      setProducts(prev => prev.filter(p => (p._id !== productId && p.id !== productId)));
      setSuccess('Product deleted successfully');
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
    }
  };

  const handleDeleteVariant = async (productId, variantId) => {
    if (!window.confirm('Are you sure you want to delete this variant?')) {
      return;
    }

    try {
      const response = await flexibleProductService.deleteVariant(productId, variantId);
      setProducts(prev =>
        prev.map(p => ((p._id || p.id) === (response.data.data._id || response.data.data.id) ? response.data.data : p))
      );
      setSuccess('Variant deleted successfully');
    } catch (err) {
      console.error('Error deleting variant:', err);
      setError('Failed to delete variant');
    }
  };

  const getVariantValueOptions = () => {
    const selectedType = formData.variantType || formData.variantTypeInput;
    return VARIANT_VALUES[selectedType] || [];
  };

  return (
    <div className="product-management-container">
      <h1>📦 Product Management System</h1>

      {/* Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Add Product Form */}
      <div className="add-product-form-card">
        <h2>➕ Add Product & Variant</h2>

        <form onSubmit={handleAddProduct}>
          {/* Product Selection */}
          <div className="form-section">
            <label>Product Name</label>
            <div className="dual-input">
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="productInputType"
                    value="select"
                    checked={formData.productInputType === 'select'}
                    onChange={handleInputChange}
                  />
                  Select Existing
                </label>
                <label>
                  <input
                    type="radio"
                    name="productInputType"
                    value="type"
                    checked={formData.productInputType === 'type'}
                    onChange={handleInputChange}
                  />
                  New Product
                </label>
              </div>

              {formData.productInputType === 'select' ? (
                <select
                  name="selectedProduct"
                  value={formData.selectedProduct}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="">-- Select Product --</option>
                  {products.map(p => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.displayName}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input
                    type="text"
                    name="newProductName"
                    placeholder="Product Name (e.g., Rice, Paper)"
                    value={formData.newProductName}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                  <input
                    type="text"
                    name="newProductDisplay"
                    placeholder="Display Name"
                    value={formData.newProductDisplay}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                  <textarea
                    name="newProductDescription"
                    placeholder="Description (optional)"
                    value={formData.newProductDescription}
                    onChange={handleInputChange}
                    className="form-control"
                    rows="2"
                  />
                </>
              )}
            </div>
          </div>

          {/* Variant Type Selection */}
          <div className="form-section">
            <label>Variant Type</label>
            <div className="dual-input">
              <select
                name="variantType"
                value={formData.variantType}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="">-- Select Type --</option>
                {VARIANT_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              <span className="or-divider">OR</span>
              <input
                type="text"
                name="variantTypeInput"
                placeholder="Type custom variant type"
                value={formData.variantTypeInput}
                onChange={handleInputChange}
                className="form-control"
                disabled={!!formData.variantType}
              />
            </div>
          </div>

          {/* Variant Value Selection */}
          <div className="form-section">
            <label>Variant Value</label>
            <div className="dual-input">
              {getVariantValueOptions().length > 0 ? (
                <select
                  name="variantValue"
                  value={formData.variantValue}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="">-- Select Value --</option>
                  {getVariantValueOptions().map(value => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="form-control" style={{ backgroundColor: '#f5f5f5' }}>
                  No predefined values
                </div>
              )}
              <span className="or-divider">OR</span>
              <input
                type="text"
                name="variantValueInput"
                placeholder="Type custom value (e.g., 750ml, 32 GSM)"
                value={formData.variantValueInput}
                onChange={handleInputChange}
                className="form-control"
                disabled={!!formData.variantValue}
              />
            </div>
          </div>

          {/* Price & Stock */}
          <div className="form-row">
            <div className="form-group">
              <label>Price (₹)</label>
              <input
                type="number"
                name="price"
                placeholder="0.00"
                value={formData.price}
                onChange={handleInputChange}
                className="form-control"
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Stock</label>
              <input
                type="number"
                name="stock"
                placeholder="0"
                value={formData.stock}
                onChange={handleInputChange}
                className="form-control"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Unit</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="pcs">Pieces</option>
                <option value="kg">Kg</option>
                <option value="g">Grams</option>
                <option value="L">Liters</option>
                <option value="ml">ML</option>
                <option value="box">Box</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <Plus /> Add Product & Variant
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Products List */}
      <div className="products-list-card">
        <h2>📋 Products & Variants</h2>

        {loading ? (
          <p className="loading">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="no-data">No products found. Create your first product above!</p>
        ) : (
          <div className="products-table">
            {products.map(product => (
              <div key={product._id || product.id} className="product-card">
                <div className="product-header">
                  <h3>{product.displayName}</h3>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteProduct(product._id || product.id)}
                    title="Delete product"
                  >
                    <Trash2 /> Delete Product
                  </button>
                </div>

                {product.description && (
                  <p className="product-description">{product.description}</p>
                )}

                {product.variants && product.variants.length > 0 ? (
                  <div className="variants-list">
                    <h4>Variants ({product.variants.length}):</h4>
                    {product.variants.map(variant => (
                      <div key={variant._id || variant.id} className="variant-item">
                        <div className="variant-info">
                          <strong>
                            {variant.type.charAt(0).toUpperCase() + variant.type.slice(1)}:
                          </strong>{' '}
                          {variant.value}
                        </div>
                        <div className="variant-details">
                          <span className="detail">💰 ₹{variant.price ? variant.price.toFixed(2) : '0.00'}</span>
                          <span className="detail">
                            📦 {variant.stock} {variant.unit}
                          </span>
                          {variant.stock <= 10 && (
                            <span className="detail low-stock">⚠️ Low Stock!</span>
                          )}
                        </div>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            handleDeleteVariant(product._id || product.id, variant._id || variant.id)
                          }
                          title="Delete variant"
                        >
                          <Trash2 /> Delete
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-variants">No variants added yet</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
