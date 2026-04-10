const mongoose = require('mongoose');
const ProductMaster = require('../models/ProductMaster');
const ProductVariant = require('../models/ProductVariant');
const Inventory = require('../models/Inventory');

// ===== PRODUCT MASTER ENDPOINTS =====

/**
 * GET /api/products/master
 * Get all products (with filtering)
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    console.log('📦 Fetching all products...');
    const { isActive } = req.query;
    
    let query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const products = await ProductMaster.find(query).sort({ name: 1 });
    console.log(`✅ Found ${products.length} products`);
    
    res.status(200).json(products);
  } catch (err) {
    console.error('❌ Error fetching products:', err.message);
    next(err);
  }
};

/**
 * GET /api/products/master/:id
 * Get product by ID with all variants
 */
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Fetching product: ${id}`);

    const product = await ProductMaster.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get all variants for this product
    const variants = await ProductVariant.find({ productId: id, isActive: true }).lean();
    console.log(`  ✅ Found ${variants.length} variants`);

    const variantIds = variants.map(v => v._id);
    const inventories = await Inventory.find({ variantId: { $in: variantIds } }).lean();

    const mergedVariants = variants.map(variant => {
      const inv = inventories.find(i => i.variantId.toString() === variant._id.toString());
      return {
        ...variant,
        price: inv ? inv.price : 0,
        quantity: inv ? inv.quantity : 0,
        inventoryId: inv ? inv._id : null
      };
    });

    res.status(200).json({
      ...product.toObject(),
      variants: mergedVariants
    });
  } catch (err) {
    console.error('❌ Error fetching product:', err.message);
    next(err);
  }
};

/**
 * POST /api/products/master
 * Create new product master
 */
exports.createProduct = async (req, res, next) => {
  try {
    const { name, gsmOptions, sizeOptions, colorOptions, description, category } = req.body;
    
    console.log(`📝 Creating new product: ${name}`);

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Product name is required' });
    }

    // Check if product already exists
    const existing = await ProductMaster.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: `Product '${name}' already exists` });
    }

    const product = new ProductMaster({
      name,
      gsmOptions: gsmOptions || [],
      sizeOptions: sizeOptions || [],
      colorOptions: colorOptions || [],
      description,
      category
    });

    await product.save();
    console.log(`✅ Product created: ${product._id}`);

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (err) {
    console.error('❌ Error creating product:', err.message);
    next(err);
  }
};

/**
 * PUT /api/products/master/:id
 * Update product master (add GSM/Size/Color options)
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { gsmOptions, sizeOptions, colorOptions } = req.body;

    console.log(`✏️  Updating product: ${id}`);

    const product = await ProductMaster.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update options (merge with existing to avoid duplicates)
    if (gsmOptions && Array.isArray(gsmOptions)) {
      product.gsmOptions = [...new Set([...product.gsmOptions, ...gsmOptions])].sort((a, b) => a - b);
    }
    if (sizeOptions && Array.isArray(sizeOptions)) {
      product.sizeOptions = [...new Set([...product.sizeOptions, ...sizeOptions])];
    }
    if (colorOptions && Array.isArray(colorOptions)) {
      product.colorOptions = [...new Set([...product.colorOptions, ...colorOptions])];
    }

    await product.save();
    console.log(`✅ Product updated: ${id}`);

    res.status(200).json({
      message: 'Product updated successfully',
      product
    });
  } catch (err) {
    console.error('❌ Error updating product:', err.message);
    next(err);
  }
};

/**
 * DELETE /api/products/master/:id
 * Soft delete product (mark inactive)
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`🗑️  Deleting product: ${id}`);

    const product = await ProductMaster.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log(`✅ Product marked inactive: ${id}`);
    res.status(200).json({ message: 'Product deleted successfully', product });
  } catch (err) {
    console.error('❌ Error deleting product:', err.message);
    next(err);
  }
};

// ===== PRODUCT VARIANT ENDPOINTS =====

/**
 * GET /api/products/variants
 * Get all variants (with filtering)
 */
exports.getAllVariants = async (req, res, next) => {
  try {
    const { productId, isActive } = req.query;
    console.log('📋 Fetching variants...');

    let query = {};
    if (productId) query.productId = productId;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const variants = await ProductVariant.find(query)
      .populate('productId')
      .sort({ displayName: 1 })
      .lean();

    const variantIds = variants.map(v => v._id);
    const inventories = await Inventory.find({ variantId: { $in: variantIds } }).lean();

    const mergedVariants = variants.map(variant => {
      const inv = inventories.find(i => i.variantId.toString() === variant._id.toString());
      return {
        ...variant,
        price: inv ? inv.price : 0,
        quantity: inv ? inv.quantity : 0,
        inventoryId: inv ? inv._id : null
      };
    });

    console.log(`✅ Found ${mergedVariants.length} variants`);
    res.status(200).json(mergedVariants);
  } catch (err) {
    console.error('❌ Error fetching variants:', err.message);
    next(err);
  }
};

/**
 * GET /api/products/variants/:id
 * Get variant by ID
 */
exports.getVariantById = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Fetching variant: ${id}`);

    const variant = await ProductVariant.findById(id).populate('productId');
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    console.log(`✅ Found variant: ${variant.displayName}`);
    res.status(200).json(variant);
  } catch (err) {
    console.error('❌ Error fetching variant:', err.message);
    next(err);
  }
};

/**
 * POST /api/products/variants
 * Create new product variant
 * CRITICAL: Auto-creates corresponding Inventory entry
 * NOTE: Transactions removed (requires MongoDB replica set)
 */
exports.createVariant = async (req, res, next) => {
  try {
    const { productId, productName, gsm, size, color, isManualProduct, price } = req.body;
    
    console.log(`📝 Creating variant: ${productName || productId}`);

    let product;
    let useProductId = productId;

    // Handle manual product entry
    if (isManualProduct && !productId) {
      console.log(`📌 Manual product entry: ${productName}`);
      
      // Check if this manual product name already exists
      product = await ProductMaster.findOne({ name: productName });
      
      if (!product) {
        // Create new product master on the fly for manual entry
        product = new ProductMaster({
          name: productName,
          hasGSM: !!gsm,
          hasSize: !!size,
          hasColor: !!color,
          isManualProduct: true
        });
        await product.save();
        console.log(`✅ Manual product created: ${product._id}`);
      }
      useProductId = product._id;
    } else {
      // Validate product exists for standard entry
      product = await ProductMaster.findById(productId);
      if (!product) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }
    }

    // Validate required fields based on product type
    if (product.hasGSM && !gsm) {
      return res.status(400).json({ message: `GSM is required for ${product.name}` });
    }
    if (product.hasSize && !size) {
      return res.status(400).json({ message: `Size is required for ${product.name}` });
    }

    // Check for duplicate variant
    let duplicateQuery = { productId: useProductId };
    if (product.hasGSM) duplicateQuery.gsm = gsm;
    if (product.hasSize) duplicateQuery.size = size;
    if (product.hasColor) duplicateQuery.color = color || null;

    const existing = await ProductVariant.findOne(duplicateQuery);
    if (existing) {
      return res.status(400).json({ message: 'This variant already exists' });
    }

    // Create variant
    const variant = new ProductVariant({
      productId: useProductId,
      gsm: product.hasGSM ? gsm : null,
      size: product.hasSize ? size : null,
      color: product.hasColor ? color : null,
      hasSize: product.hasSize,
      hasGSM: product.hasGSM
    });

    await variant.save();
    console.log(`✅ Variant created: ${variant._id} (${variant.displayName})`);

    // AUTO-CREATE corresponding Inventory entry
    const inventory = new Inventory({
      variantId: variant._id,
      productName: product.name,
      quantity: 0,
      price: price !== undefined ? parseFloat(price) : 0,
      minimumStockLevel: 50
    });

    await inventory.save();
    console.log(`✅ Inventory auto-created: ${inventory._id} for variant ${variant._id}`);

    res.status(201).json({
      message: 'Variant and Inventory created successfully',
      variant: {...variant.toObject(), inventoryId: inventory._id}
    });
  } catch (err) {
    console.error('❌ Error creating variant:', err.message);
    next(err);
  }
};

/**
 * PUT /api/products/variants/:id
 * Update existing product variant
 * CRITICAL: Updates variantData and corresponding inventory price
 */
exports.updateVariant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { gsm, size, color, price } = req.body;

    console.log(`✏️  Updating variant: ${id}`);

    // Find variant
    const variant = await ProductVariant.findById(id);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    // Get product master to check constraints
    const product = await ProductMaster.findById(variant.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product master not found' });
    }

    // Check for duplicate (if size/gsm/color changed)
    const updates = {};
    if (gsm !== undefined && product.hasGSM) updates.gsm = gsm;
    if (size !== undefined && product.hasSize) updates.size = size;
    if (color !== undefined && product.hasColor) updates.color = color;

    if (Object.keys(updates).length > 0) {
      const duplicateQuery = { 
        productId: variant.productId, 
        _id: { $ne: id }, // Exclude current variant
        ...updates 
      };
      
      const existing = await ProductVariant.findOne(duplicateQuery);
      if (existing) {
        return res.status(400).json({ message: 'Another variant with these specs already exists' });
      }
    }

    // Update variant
    Object.assign(variant, updates);
    await variant.save();

    console.log(`  ✅ Variant updated: ${variant.displayName}`);

    // Update inventory price if provided
    if (price !== undefined && price >= 0) {
      const inventory = await Inventory.findOneAndUpdate(
        { variantId: id },
        { price: parseFloat(price) },
        { new: true }
      );
      console.log(`  ✅ Inventory price updated to ₹${price}`);
    }

    res.status(200).json({
      message: 'Variant updated successfully',
      variant
    });
  } catch (err) {
    console.error('❌ Error updating variant:', err.message);
    next(err);
  }
};

/**
 * DELETE /api/products/variants/:id
 * Delete variant AND corresponding inventory entry
 * CRITICAL: Also deletes if ProductMaster has no more variants
 */
exports.deleteVariant = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`🗑️  Deleting variant: ${id}`);

    // Find variant
    const variant = await ProductVariant.findById(id);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    // Delete inventory entry
    const inventory = await Inventory.findOneAndDelete({ variantId: id });
    console.log(`  ✅ Inventory deleted: ${inventory?._id || 'N/A'}`);

    // Delete variant
    await ProductVariant.findByIdAndDelete(id);
    console.log(`  ✅ Variant deleted: ${id}`);

    // Check if product master has any more active variants
    const remainingVariants = await ProductVariant.countDocuments({
      productId: variant.productId,
      isActive: true
    });

    console.log(`  📊 Remaining active variants for product: ${remainingVariants}`);

    res.status(200).json({
      message: 'Variant and Inventory deleted successfully',
      variant,
      inventoryDeleted: !!inventory,
      remainingVariants
    });
  } catch (err) {
    console.error('❌ Error deleting variant:', err.message);
    next(err);
  }
};

// ===== DROPDOWN DATA ENDPOINTS (for dynamic UI) =====

/**
 * GET /api/products/dropdowns/materials
 * Get all product names for material dropdown
 */
exports.getMaterialOptions = async (req, res, next) => {
  try {
    console.log('📊 Fetching material options...');
    
    const products = await ProductMaster.find({ isActive: true }).select('name');
    const materials = products.map(p => p.name);
    
    console.log(`✅ Found ${materials.length} materials`);
    res.status(200).json(materials);
  } catch (err) {
    console.error('❌ Error fetching materials:', err.message);
    next(err);
  }
};

/**
 * GET /api/products/dropdowns/gsm?productId=:id
 * Get GSM options for a product
 */
exports.getGSMOptions = async (req, res, next) => {
  try {
    const { productId } = req.query;
    console.log(`📊 Fetching GSM options for product: ${productId}`);

    const product = await ProductMaster.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.hasGSM) {
      return res.status(200).json([]);
    }

    console.log(`✅ Found ${product.gsmOptions.length} GSM options`);
    res.status(200).json(product.gsmOptions);
  } catch (err) {
    console.error('❌ Error fetching GSM options:', err.message);
    next(err);
  }
};

/**
 * GET /api/products/dropdowns/sizes?productId=:id
 * Get size options for a product
 */
exports.getSizeOptions = async (req, res, next) => {
  try {
    const { productId } = req.query;
    console.log(`📊 Fetching size options for product: ${productId}`);

    const product = await ProductMaster.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.hasSize) {
      return res.status(200).json([]);
    }

    console.log(`✅ Found ${product.sizeOptions.length} size options`);
    res.status(200).json(product.sizeOptions);
  } catch (err) {
    console.error('❌ Error fetching size options:', err.message);
    next(err);
  }
};

/**
 * GET /api/products/dropdowns/colors?productId=:id
 * Get color options for a product
 */
exports.getColorOptions = async (req, res, next) => {
  try {
    const { productId } = req.query;
    console.log(`📊 Fetching color options for product: ${productId}`);

    const product = await ProductMaster.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.hasColor) {
      return res.status(200).json([]);
    }

    console.log(`✅ Found ${product.colorOptions.length} color options`);
    res.status(200).json(product.colorOptions);
  } catch (err) {
    console.error('❌ Error fetching color options:', err.message);
    next(err);
  }
};

/**
 * GET /api/products/config
 * Get product configuration (field requirements for all products)
 * Used by frontend to determine conditional rendering
 */
exports.getProductConfiguration = async (req, res, next) => {
  try {
    console.log('🔧 Fetching product configuration...');

    const products = await ProductMaster.find({ isActive: true });
    
    const config = {};
    products.forEach(product => {
      config[product.name] = {
        hasGSM: product.hasGSM,
        hasSize: product.hasSize,
        hasColor: product.hasColor,
        gsmOptions: product.gsmOptions,
        sizeOptions: product.sizeOptions,
        colorOptions: product.colorOptions
      };
    });

    console.log(`✅ Configuration fetched for ${products.length} products`);
    res.status(200).json(config);
  } catch (err) {
    console.error('❌ Error fetching configuration:', err.message);
    next(err);
  }
};
