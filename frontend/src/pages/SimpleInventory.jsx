import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Trash2, Search } from "lucide-react";
import "../styles/SimpleInventory.css";

const SimpleInventory = () => {
  const [items, setItems] = useState([]);
  const [productNames, setProductNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterVariantType, setFilterVariantType] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Product Master data
  const [productMaster, setProductMaster] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form state
  const [form, setForm] = useState({
    productName: "",
    price: "",
    stock: "",
    // Optional attributes
    quality: "",
    size: "",
    colour: ""
  });

  const [useCustomProduct, setUseCustomProduct] = useState(false);

  // Add Stock form state
  const [showAddStock, setShowAddStock] = useState(false);
  const [addStockForm, setAddStockForm] = useState({
    selectedItemId: "",
    addQuantity: ""
  });

  // Load inventory items
  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/simple-inventory/all");
      setItems(response.data.data || []);
    } catch (err) {
      console.error("Error loading inventory:", err);
      setError("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  // Load product names
  const loadProductNames = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/simple-inventory/products/names");
      setProductNames(response.data.data || []);
    } catch (err) {
      console.error("Error loading product names:", err);
    }
  };

  // Load on component mount
  useEffect(() => {
    loadInventory();
    loadProductNames();
    loadProductMaster();

    // Listen for Product Master updates
    window.addEventListener("productUpdated", loadProductMaster);

    return () => {
      window.removeEventListener("productUpdated", loadProductMaster);
    };
  }, []);

  // Load Product Master from localStorage
  const loadProductMaster = () => {
    try {
      console.log("PM:", localStorage.getItem("product_master"));
      const master = JSON.parse(localStorage.getItem("product_master")) || [];
      setProductMaster(master);
      console.log("✅ Product Master loaded in Inventory:", master);
    } catch (err) {
      console.error("Error loading product master:", err);
    }
  };

  // Handle form input change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Handle product name selection
  const handleProductSelection = (e) => {
    const productName = e.target.value;
    setForm({ ...form, productName, quality: "", size: "", colour: "" });
    
    // Find product in Product Master
    const product = productMaster.find(p => p.product_name === productName);
    setSelectedProduct(product || null);
    setUseCustomProduct(false);
  };

  // Handle custom product input
  const handleCustomProductInput = (e) => {
    const productName = e.target.value;
    setForm({ ...form, productName, quality: "", size: "", colour: "" });
    setSelectedProduct(null);
    if (productName) setUseCustomProduct(true);
  };

  // Handle add product with optional attributes
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // Validation
    if (!form.productName.trim()) {
      setError("Please enter a product name");
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      setError("Price must be greater than 0");
      return;
    }
    if (form.stock === "" || Number(form.stock) < 0) {
      setError("Stock cannot be negative");
      return;
    }

    // Build variant description from attributes (if any are filled)
    let variantValue = [];
    
    if (form.quality && form.quality.trim()) {
      variantValue.push(`Quality: ${form.quality}`);
    }
    if (form.size && form.size.trim()) {
      variantValue.push(`Size: ${form.size}`);
    }
    if (form.colour && form.colour.trim()) {
      variantValue.push(`Colour: ${form.colour}`);
    }

    const finalVariantValue = variantValue.length > 0 ? variantValue.join(' | ') : 'Standard';

    try {
      setLoading(true);
      const response = await axios.post("http://localhost:5000/api/simple-inventory/add", {
        productName: form.productName.trim(),
        variantType: "Attribute-Based",
        variantValue: finalVariantValue,
        price: Number(form.price),
        stock: Number(form.stock)
      });

      setMessage(`✅ ${form.productName} (${finalVariantValue}) added successfully!`);
      
      // Reset form
      setForm({
        productName: "",
        price: "",
        stock: "",
        quality: "",
        size: "",
        colour: ""
      });
      setSelectedProduct(null);
      setUseCustomProduct(false);

      // Reload inventory
      loadInventory();
      loadProductNames();
      loadProductMaster();

      // Clear message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add product");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id, productName, variantValue) => {
    if (!window.confirm(`Delete ${productName} - ${variantValue}?`)) return;

    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/api/simple-inventory/delete/${id}`);
      setMessage(`✅ Product deleted successfully!`);
      loadInventory();
      loadProductNames();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to delete product");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle add stock to existing product
  const handleAddStock = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!addStockForm.selectedItemId) {
      setError("Please select a product");
      return;
    }
    if (!addStockForm.addQuantity || Number(addStockForm.addQuantity) <= 0) {
      setError("Please enter a valid quantity to add");
      return;
    }

    try {
      setLoading(true);
      const item = items.find(i => i._id === addStockForm.selectedItemId);
      const newStock = item.stock + Number(addStockForm.addQuantity);

      await axios.put(`http://localhost:5000/api/simple-inventory/update/${addStockForm.selectedItemId}`, {
        stock: newStock
      });

      setMessage(`✅ Stock updated! ${item.productName} - ${item.variantValue} now has ${newStock} units`);
      
      // Reset form
      setAddStockForm({ selectedItemId: "", addQuantity: "" });
      setShowAddStock(false);

      // Reload inventory
      loadInventory();

      // Clear message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update stock");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Search and filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = !search || 
      item.product_name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = !filterVariantType || 
      item.variantType?.toLowerCase().includes(filterVariantType.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="simple-inventory">
      <div className="inventory-container">
        {/* Header */}
        <div className="inventory-header">
          <h1>📦 Simple Inventory Management</h1>
          <p>Add products with custom variants (size/GSM/weight) to your inventory</p>
        </div>

        {/* Messages */}
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        {/* Add Product Form */}
        <div className="add-product-section">
          <h2>Add New Product</h2>
          <form onSubmit={handleAddProduct} className="add-product-form">
            {/* Product Name Section */}
            <div className="form-group">
              <label>Product Name *</label>
              <div className="form-row">
                <select
                  value={form.productName}
                  onChange={handleProductSelection}
                  disabled={useCustomProduct}
                  className="form-select"
                >
                  <option value="">-- Select from Product Master --</option>
                  {productMaster.map(p => (
                    <option key={p.product_name} value={p.product_name}>
                      {p.product_name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Or type new product..."
                  value={useCustomProduct ? form.productName : ""}
                  onChange={handleCustomProductInput}
                  className="form-input"
                />
              </div>
            </div>

            {/* Dynamic Attribute Fields */}
            {(selectedProduct || useCustomProduct) && (
              <>
                {/* Quality Field */}
                {(selectedProduct?.attributes?.quality || useCustomProduct) && (
                  <div className="form-group">
                    <label>Quality {selectedProduct?.attributes?.quality ? "📌 Suggested:" : ""}</label>
                    <input
                      type="text"
                      name="quality"
                      placeholder={selectedProduct?.attributes?.quality ? `e.g., ${selectedProduct.attributes.quality}` : "e.g., 80 GSM, 70 GSM"}
                      value={form.quality}
                      onChange={handleFormChange}
                      className="form-input"
                    />
                  </div>
                )}

                {/* Size Field */}
                {(selectedProduct?.attributes?.size || useCustomProduct) && (
                  <div className="form-group">
                    <label>Size {selectedProduct?.attributes?.size ? "📌 Suggested:" : ""}</label>
                    <input
                      type="text"
                      name="size"
                      placeholder={selectedProduct?.attributes?.size ? `e.g., ${selectedProduct.attributes.size}` : "e.g., A4, A3, Letter"}
                      value={form.size}
                      onChange={handleFormChange}
                      className="form-input"
                    />
                  </div>
                )}

                {/* Colour Field */}
                {(selectedProduct?.attributes?.colour || useCustomProduct) && (
                  <div className="form-group">
                    <label>Colour {selectedProduct?.attributes?.colour ? "📌 Suggested:" : ""}</label>
                    <input
                      type="text"
                      name="colour"
                      placeholder={selectedProduct?.attributes?.colour ? `e.g., ${selectedProduct.attributes.colour}` : "e.g., White, Yellow, Blue"}
                      value={form.colour}
                      onChange={handleFormChange}
                      className="form-input"
                    />
                  </div>
                )}
              </>
            )}

            {/* Price & Stock */}
            <div className="form-row">
              <div className="form-group">
                <label>Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleFormChange}
                  placeholder="Enter price"
                  min="0.01"
                  step="0.01"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>Stock Quantity *</label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleFormChange}
                  placeholder="Enter stock"
                  min="0"
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn-add" disabled={loading}>
              <Plus size={20} />
              {loading ? "Adding..." : "Add to Inventory"}
            </button>
          </form>
        </div>

        {/* Add Stock Section */}
        <div className="add-stock-section">
          <div className="section-header">
            <h2>Add Stock to Existing Product</h2>
            <button
              className="btn-toggle"
              onClick={() => setShowAddStock(!showAddStock)}
            >
              {showAddStock ? "Hide" : "Show"}
            </button>
          </div>

          {showAddStock && (
            <form onSubmit={handleAddStock} className="add-stock-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Select Product & Variant *</label>
                  <select
                    value={addStockForm.selectedItemId}
                    onChange={(e) => setAddStockForm({ ...addStockForm, selectedItemId: e.target.value })}
                    className="form-select"
                  >
                    <option value="">-- Select Item --</option>
                    {items.map(item => (
                      <option key={item._id} value={item._id}>
                        {item.productName} ({item.variantValue}) | Stock: {item.stock}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Add Quantity *</label>
                  <input
                    type="number"
                    value={addStockForm.addQuantity}
                    onChange={(e) => setAddStockForm({ ...addStockForm, addQuantity: e.target.value })}
                    placeholder="Enter quantity to add"
                    min="1"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-add" disabled={loading}>
                <Plus size={20} />
                {loading ? "Updating..." : "Update Stock"}
              </button>
            </form>
          )}
        </div>

        {/* Search & Filter Section */}
        <div className="search-filter-section">
          <h2>Inventory Items ({filteredItems.length})</h2>
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-bar">
            <select
              value={filterVariantType}
              onChange={(e) => setFilterVariantType(e.target.value)}
              className="filter-select"
            >
              <option value="">All Variant Types</option>
              {variantTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Inventory Table */}
        {filteredItems.length > 0 ? (
          <div className="inventory-table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant Type</th>
                  <th>Variant Value</th>
                  <th className="text-right">Price (₹)</th>
                  <th className="text-right">Stock</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item._id}>
                    <td className="font-semibold">{item.productName}</td>
                    <td>{item.variantType}</td>
                    <td className="font-medium">{item.variantValue}</td>
                    <td className="text-right currency">₹{Number(item.price).toFixed(2)}</td>
                    <td className="text-right">
                      <span className={`stock-badge ${item.stock < 10 ? 'low' : 'adequate'}`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(item._id, item.productName, item.variantValue)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>📭 No products in inventory yet. Add your first product above!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleInventory;
