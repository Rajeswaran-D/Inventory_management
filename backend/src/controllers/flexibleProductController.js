/**
 * FLEXIBLE PRODUCT CONTROLLER
 * Handles product and variant CRUD operations
 */

const FlexibleProduct = require('../models/FlexibleProduct');

// ==================== PRODUCT OPERATIONS ====================

/**
 * Get all products
 */
exports.getAllProducts = async (req, res) => {
  try {
    const products = await FlexibleProduct.find().sort({ created_at: -1 });

    res.json({
      data: products,
      count: products.length,
      message: 'Products retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      data: [],
      message: `Error fetching products: ${error.message}`
    });
  }
};

/**
 * Get product by ID
 */
exports.getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await FlexibleProduct.findById(productId);

    if (!product) {
      return res.status(404).json({
        data: null,
        message: 'Product not found'
      });
    }

    res.json({
      data: product,
      message: 'Product retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      data: null,
      message: `Error fetching product: ${error.message}`
    });
  }
};

/**
 * Create new product
 */
exports.createProduct = async (req, res) => {
  try {
    const { name, displayName, description, variants } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        data: null,
        message: 'Product name is required'
      });
    }

    if (!displayName || !displayName.trim()) {
      return res.status(400).json({
        data: null,
        message: 'Display name is required'
      });
    }

    // Check for duplicate product (case-insensitive)
    const normalizedName = name.trim().toLowerCase();
    const existingProduct = await FlexibleProduct.findOne({
      name: normalizedName
    });

    if (existingProduct) {
      return res.status(400).json({
        data: null,
        message: 'Product already exists'
      });
    }

    // Create product
    const newProduct = new FlexibleProduct({
      name: normalizedName,
      displayName: displayName.trim(),
      description,
      variants: variants || []
    });

    await newProduct.save();

    res.status(201).json({
      data: newProduct,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      data: null,
      message: `Error creating product: ${error.message}`
    });
  }
};

/**
 * Update product (name, description)
 */
exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { displayName, description } = req.body;

    const product = await FlexibleProduct.findById(productId);

    if (!product) {
      return res.status(404).json({
        data: null,
        message: 'Product not found'
      });
    }

    if (displayName) product.displayName = displayName.trim();
    if (description !== undefined) product.description = description;

    await product.save();

    res.json({
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      data: null,
      message: `Error updating product: ${error.message}`
    });
  }
};

/**
 * Delete product
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await FlexibleProduct.findByIdAndDelete(productId);

    if (!product) {
      return res.status(404).json({
        data: null,
        message: 'Product not found'
      });
    }

    res.json({
      data: product,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      data: null,
      message: `Error deleting product: ${error.message}`
    });
  }
};

// ==================== VARIANT OPERATIONS ====================

/**
 * Add variant to product
 */
exports.addVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const { type, value, price, stock, unit } = req.body;

    // Validation
    if (!type || !type.trim()) {
      return res.status(400).json({
        data: null,
        message: 'Variant type is required'
      });
    }

    if (!value || !value.trim()) {
      return res.status(400).json({
        data: null,
        message: 'Variant value is required'
      });
    }

    if (price === undefined || price < 0) {
      return res.status(400).json({
        data: null,
        message: 'Valid price is required (>= 0)'
      });
    }

    if (stock === undefined || stock < 0) {
      return res.status(400).json({
        data: null,
        message: 'Valid stock is required (>= 0)'
      });
    }

    const product = await FlexibleProduct.findById(productId);

    if (!product) {
      return res.status(404).json({
        data: null,
        message: 'Product not found'
      });
    }

    // Check for duplicate variant (same type + value)
    const normalizedType = type.trim().toLowerCase();
    const normalizedValue = value.trim();

    const variantExists = product.variants.some(
      v =>
        v.type.toLowerCase() === normalizedType &&
        v.value === normalizedValue
    );

    if (variantExists) {
      return res.status(400).json({
        data: null,
        message: 'This variant already exists for this product'
      });
    }

    // Add variant
    product.variants.push({
      type: normalizedType,
      value: normalizedValue,
      price: Number(price),
      stock: Number(stock),
      unit: unit || 'pcs'
    });

    await product.save();

    res.status(201).json({
      data: product,
      message: 'Variant added successfully'
    });
  } catch (error) {
    console.error('Error adding variant:', error);
    res.status(500).json({
      data: null,
      message: `Error adding variant: ${error.message}`
    });
  }
};

/**
 * Update variant
 */
exports.updateVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { type, value, price, stock, unit } = req.body;

    const product = await FlexibleProduct.findById(productId);

    if (!product) {
      return res.status(404).json({
        data: null,
        message: 'Product not found'
      });
    }

    const variant = product.variants.id(variantId);

    if (!variant) {
      return res.status(404).json({
        data: null,
        message: 'Variant not found'
      });
    }

    // Update fields
    if (type) variant.type = type.trim().toLowerCase();
    if (value) variant.value = value.trim();
    if (price !== undefined) variant.price = Number(price);
    if (stock !== undefined) variant.stock = Number(stock);
    if (unit) variant.unit = unit;

    await product.save();

    res.json({
      data: product,
      message: 'Variant updated successfully'
    });
  } catch (error) {
    console.error('Error updating variant:', error);
    res.status(500).json({
      data: null,
      message: `Error updating variant: ${error.message}`
    });
  }
};

/**
 * Delete variant
 */
exports.deleteVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;

    const product = await FlexibleProduct.findById(productId);

    if (!product) {
      return res.status(404).json({
        data: null,
        message: 'Product not found'
      });
    }

    const variant = product.variants.id(variantId);

    if (!variant) {
      return res.status(404).json({
        data: null,
        message: 'Variant not found'
      });
    }

    variant.deleteOne();
    await product.save();

    res.json({
      data: product,
      message: 'Variant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting variant:', error);
    res.status(500).json({
      data: null,
      message: `Error deleting variant: ${error.message}`
    });
  }
};

/**
 * Update variant stock (after sale)
 */
exports.reduceVariantStock = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        data: null,
        message: 'Valid quantity is required'
      });
    }

    const product = await FlexibleProduct.findById(productId);

    if (!product) {
      return res.status(404).json({
        data: null,
        message: 'Product not found'
      });
    }

    const variant = product.variants.id(variantId);

    if (!variant) {
      return res.status(404).json({
        data: null,
        message: 'Variant not found'
      });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({
        data: null,
        message: 'Insufficient stock'
      });
    }

    variant.stock -= quantity;
    await product.save();

    res.json({
      data: product,
      message: `Stock reduced by ${quantity}`
    });
  } catch (error) {
    console.error('Error reducing stock:', error);
    res.status(500).json({
      data: null,
      message: `Error reducing stock: ${error.message}`
    });
  }
};

/**
 * Get all variants for a product
 */
exports.getVariants = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await FlexibleProduct.findById(productId);

    if (!product) {
      return res.status(404).json({
        data: [],
        message: 'Product not found'
      });
    }

    res.json({
      data: product.variants,
      count: product.variants.length,
      message: 'Variants retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching variants:', error);
    res.status(500).json({
      data: [],
      message: `Error fetching variants: ${error.message}`
    });
  }
};

/**
 * Get low stock variants
 */
exports.getLowStockVariants = async (req, res) => {
  try {
    const { threshold = 10 } = req.query;

    const products = await FlexibleProduct.find();

    const lowStockVariants = [];

    products.forEach(product => {
      product.variants.forEach(variant => {
        if (variant.stock <= Number(threshold)) {
          lowStockVariants.push({
            productId: product._id,
            productName: product.displayName,
            variant: variant,
            stock: variant.stock
          });
        }
      });
    });

    res.json({
      data: lowStockVariants,
      count: lowStockVariants.length,
      message: 'Low stock variants retrieved'
    });
  } catch (error) {
    console.error('Error fetching low stock variants:', error);
    res.status(500).json({
      data: [],
      message: `Error fetching low stock variants: ${error.message}`
    });
  }
};

/**
 * Search products by name
 */
exports.searchProducts = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({
        data: [],
        message: 'Search query is required'
      });
    }

    const products = await FlexibleProduct.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } }
      ]
    });

    res.json({
      data: products,
      count: products.length,
      message: 'Products found'
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      data: [],
      message: `Error searching products: ${error.message}`
    });
  }
};
