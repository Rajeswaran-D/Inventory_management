const prisma = require('../utils/prismaClient');

// ==================== PRODUCT OPERATIONS ====================

/**
 * Get all products
 */
exports.getAllProducts = async (req, res) => {
  try {
    const products = await prisma.flexibleProduct.findMany({
      orderBy: { created_at: 'desc' },
      include: { variants: true }
    });

    const transformedProducts = products.map(p => ({
      ...p,
      _id: p.id,
      variants: p.variants.map(v => ({ ...v, _id: v.id }))
    }));

    res.json({
      data: transformedProducts,
      count: transformedProducts.length,
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
    const product = await prisma.flexibleProduct.findUnique({
      where: { id: productId },
      include: { variants: true }
    });

    if (!product) {
      return res.status(404).json({
        data: null,
        message: 'Product not found'
      });
    }

    const transformedProduct = {
      ...product,
      _id: product.id,
      variants: product.variants.map(v => ({ ...v, _id: v.id }))
    };

    res.json({
      data: transformedProduct,
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

    const normalizedName = name.trim().toLowerCase();
    const existingProduct = await prisma.flexibleProduct.findUnique({
      where: { name: normalizedName }
    });

    if (existingProduct) {
      return res.status(400).json({
        data: null,
        message: 'Product already exists'
      });
    }

    // Use transaction if variants are provided
    const newProduct = await prisma.flexibleProduct.create({
      data: {
        name: normalizedName,
        displayName: displayName.trim(),
        description: description || '',
        variants: variants && variants.length > 0 ? {
          create: variants.map(v => ({
            type: v.type,
            value: v.value,
            price: Number(v.price),
            stock: Number(v.stock),
            unit: v.unit || 'pcs'
          }))
        } : undefined
      },
      include: { variants: true }
    });

    res.status(201).json({
      data: {
        ...newProduct,
        _id: newProduct.id,
        variants: newProduct.variants.map(v => ({ ...v, _id: v.id }))
      },
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

    const updatedProduct = await prisma.flexibleProduct.update({
      where: { id: productId },
      data: {
        displayName: displayName ? displayName.trim() : undefined,
        description: description !== undefined ? description : undefined
      },
      include: { variants: true }
    });

    res.json({
      data: {
        ...updatedProduct,
        _id: updatedProduct.id,
        variants: updatedProduct.variants.map(v => ({ ...v, _id: v.id }))
      },
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
    
    // We can just call delete if it exists
    const product = await prisma.flexibleProduct.delete({
      where: { id: productId },
      include: { variants: true }
    });

    res.json({
      data: {
        ...product,
        _id: product.id,
        variants: product.variants.map(v => ({ ...v, _id: v.id }))
      },
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(404).json({
      data: null,
      message: 'Product not found or already deleted'
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

    const normalizedType = type.trim().toLowerCase();
    const normalizedValue = value.trim();

    // Check if duplicate variant exists
    const duplicate = await prisma.flexibleProductVariant.findFirst({
      where: {
        flexibleProductId: productId,
        type: normalizedType,
        value: normalizedValue
      }
    });

    if (duplicate) {
      return res.status(400).json({
        data: null,
        message: 'This variant already exists for this product'
      });
    }

    const variant = await prisma.flexibleProductVariant.create({
      data: {
        flexibleProductId: productId,
        type: normalizedType,
        value: normalizedValue,
        price: Number(price),
        stock: Number(stock || 0),
        unit: unit || 'pcs'
      }
    });

    const product = await prisma.flexibleProduct.findUnique({
      where: { id: productId },
      include: { variants: true }
    });

    res.status(201).json({
      data: {
        ...product,
        _id: product.id,
        variants: product.variants.map(v => ({ ...v, _id: v.id }))
      },
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

    await prisma.flexibleProductVariant.update({
      where: { id: variantId },
      data: {
        type: type ? type.trim().toLowerCase() : undefined,
        value: value ? value.trim() : undefined,
        price: price !== undefined ? Number(price) : undefined,
        stock: stock !== undefined ? Number(stock) : undefined,
        unit: unit || undefined
      }
    });

    const product = await prisma.flexibleProduct.findUnique({
      where: { id: productId },
      include: { variants: true }
    });

    res.json({
      data: {
        ...product,
        _id: product.id,
        variants: product.variants.map(v => ({ ...v, _id: v.id }))
      },
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

    await prisma.flexibleProductVariant.delete({
      where: { id: variantId }
    });

    const product = await prisma.flexibleProduct.findUnique({
      where: { id: productId },
      include: { variants: true }
    });

    res.json({
      data: {
        ...product,
        _id: product.id,
        variants: product.variants.map(v => ({ ...v, _id: v.id }))
      },
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

    const variant = await prisma.flexibleProductVariant.findUnique({
      where: { id: variantId }
    });

    if (!variant || variant.stock < quantity) {
      return res.status(400).json({
        data: null,
        message: 'Insufficient stock or variant not found'
      });
    }

    await prisma.flexibleProductVariant.update({
      where: { id: variantId },
      data: {
        stock: { decrement: Number(quantity) }
      }
    });

    const product = await prisma.flexibleProduct.findUnique({
      where: { id: productId },
      include: { variants: true }
    });

    res.json({
      data: {
        ...product,
        _id: product.id,
        variants: product.variants.map(v => ({ ...v, _id: v.id }))
      },
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

    const variants = await prisma.flexibleProductVariant.findMany({
      where: { flexibleProductId: productId }
    });

    const transformedVariants = variants.map(v => ({ ...v, _id: v.id }));

    res.json({
      data: transformedVariants,
      count: transformedVariants.length,
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

    const variants = await prisma.flexibleProductVariant.findMany({
      where: {
        stock: { lte: Number(threshold) }
      },
      include: { product: true }
    });

    const lowStockVariants = variants.map(variant => ({
      productId: variant.product.id,
      _id: variant.product.id,
      productName: variant.product.displayName,
      variant: { ...variant, _id: variant.id },
      stock: variant.stock
    }));

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

    const searchTerm = query.trim();

    const products = await prisma.flexibleProduct.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { displayName: { contains: searchTerm } }
        ]
      },
      include: { variants: true }
    });

    const transformedProducts = products.map(p => ({
      ...p,
      _id: p.id,
      variants: p.variants.map(v => ({ ...v, _id: v.id }))
    }));

    res.json({
      data: transformedProducts,
      count: transformedProducts.length,
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
