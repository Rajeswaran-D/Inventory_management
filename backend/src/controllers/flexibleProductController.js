const { query } = require('../lib/db');
const { createId } = require('../lib/ids');

function mapVariant(row) {
  return {
    variant_id: row.variant_id,
    type: row.type,
    value: row.value,
    price: Number(row.price),
    stock: Number(row.stock),
    unit: row.unit,
    created_at: row.variant_created_at,
  };
}

async function getProduct(productId) {
  const product = await query(
    `
      SELECT id, name, display_name, description, created_at, updated_at
      FROM flexible_products
      WHERE id = $1
      LIMIT 1
    `,
    [productId]
  );
  return product.rows[0] || null;
}

async function getProductWithVariants(productId) {
  const product = await getProduct(productId);
  if (!product) {
    return null;
  }

  const variants = await query(
    `
      SELECT
        id AS variant_id,
        type,
        value,
        price,
        stock,
        unit,
        created_at AS variant_created_at
      FROM flexible_product_variants
      WHERE product_id = $1
      ORDER BY created_at ASC
    `,
    [productId]
  );

  return {
    _id: product.id,
    name: product.name,
    displayName: product.display_name,
    description: product.description,
    created_at: product.created_at,
    updated_at: product.updated_at,
    variants: variants.rows.map(mapVariant),
    totalStock: variants.rows.reduce((sum, variant) => sum + Number(variant.stock), 0),
  };
}

exports.getAllProducts = async (req, res) => {
  try {
    const products = await query(
      `
        SELECT id
        FROM flexible_products
        ORDER BY created_at DESC
      `
    );

    const data = [];
    for (const row of products.rows) {
      const product = await getProductWithVariants(row.id);
      if (product) {
        data.push(product);
      }
    }

    res.json({ data, count: data.length, message: 'Products retrieved successfully' });
  } catch (error) {
    res.status(500).json({ data: [], message: `Error fetching products: ${error.message}` });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await getProductWithVariants(req.params.productId);
    if (!product) {
      return res.status(404).json({ data: null, message: 'Product not found' });
    }
    res.json({ data: product, message: 'Product retrieved successfully' });
  } catch (error) {
    res.status(500).json({ data: null, message: `Error fetching product: ${error.message}` });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, displayName, description, variants = [] } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ data: null, message: 'Product name is required' });
    }
    if (!displayName || !displayName.trim()) {
      return res.status(400).json({ data: null, message: 'Display name is required' });
    }

    const normalizedName = name.trim().toLowerCase();
    const existing = await query('SELECT id FROM flexible_products WHERE name = $1 LIMIT 1', [normalizedName]);
    if (existing.rowCount > 0) {
      return res.status(400).json({ data: null, message: 'Product already exists' });
    }

    const productId = createId();
    await query(
      `
        INSERT INTO flexible_products (id, name, display_name, description)
        VALUES ($1, $2, $3, $4)
      `,
      [productId, normalizedName, displayName.trim(), description || null]
    );

    for (const variant of variants) {
      await query(
        `
          INSERT INTO flexible_product_variants (id, product_id, type, value, price, stock, unit)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [createId(), productId, String(variant.type).trim().toLowerCase(), String(variant.value).trim(), Number(variant.price || 0), Number(variant.stock || 0), variant.unit || 'pcs']
      );
    }

    res.status(201).json({ data: await getProductWithVariants(productId), message: 'Product created successfully' });
  } catch (error) {
    res.status(500).json({ data: null, message: `Error creating product: ${error.message}` });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const updated = await query(
      `
        UPDATE flexible_products
        SET
          display_name = COALESCE($1, display_name),
          description = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING id
      `,
      [req.body.displayName ? req.body.displayName.trim() : null, req.body.description ?? null, req.params.productId]
    );

    if (updated.rowCount === 0) {
      return res.status(404).json({ data: null, message: 'Product not found' });
    }

    res.json({ data: await getProductWithVariants(req.params.productId), message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ data: null, message: `Error updating product: ${error.message}` });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await getProductWithVariants(req.params.productId);
    if (!product) {
      return res.status(404).json({ data: null, message: 'Product not found' });
    }

    await query('DELETE FROM flexible_products WHERE id = $1', [req.params.productId]);
    res.json({ data: product, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ data: null, message: `Error deleting product: ${error.message}` });
  }
};

exports.addVariant = async (req, res) => {
  try {
    const { type, value, price, stock, unit } = req.body;
    if (!type || !type.trim()) {
      return res.status(400).json({ data: null, message: 'Variant type is required' });
    }
    if (!value || !value.trim()) {
      return res.status(400).json({ data: null, message: 'Variant value is required' });
    }
    if (price === undefined || Number(price) < 0) {
      return res.status(400).json({ data: null, message: 'Valid price is required (>= 0)' });
    }
    if (stock === undefined || Number(stock) < 0) {
      return res.status(400).json({ data: null, message: 'Valid stock is required (>= 0)' });
    }

    const product = await getProduct(req.params.productId);
    if (!product) {
      return res.status(404).json({ data: null, message: 'Product not found' });
    }

    await query(
      `
        INSERT INTO flexible_product_variants (id, product_id, type, value, price, stock, unit)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [createId(), req.params.productId, type.trim().toLowerCase(), value.trim(), Number(price), Number(stock), unit || 'pcs']
    );

    res.status(201).json({ data: await getProductWithVariants(req.params.productId), message: 'Variant added successfully' });
  } catch (error) {
    res.status(500).json({ data: null, message: `Error adding variant: ${error.message}` });
  }
};

exports.updateVariant = async (req, res) => {
  try {
    const updated = await query(
      `
        UPDATE flexible_product_variants
        SET
          type = COALESCE($1, type),
          value = COALESCE($2, value),
          price = COALESCE($3, price),
          stock = COALESCE($4, stock),
          unit = COALESCE($5, unit),
          updated_at = NOW()
        WHERE id = $6 AND product_id = $7
        RETURNING id
      `,
      [
        req.body.type ? req.body.type.trim().toLowerCase() : null,
        req.body.value ? req.body.value.trim() : null,
        req.body.price !== undefined ? Number(req.body.price) : null,
        req.body.stock !== undefined ? Number(req.body.stock) : null,
        req.body.unit || null,
        req.params.variantId,
        req.params.productId,
      ]
    );

    if (updated.rowCount === 0) {
      return res.status(404).json({ data: null, message: 'Variant not found' });
    }

    res.json({ data: await getProductWithVariants(req.params.productId), message: 'Variant updated successfully' });
  } catch (error) {
    res.status(500).json({ data: null, message: `Error updating variant: ${error.message}` });
  }
};

exports.deleteVariant = async (req, res) => {
  try {
    const deleted = await query(
      `
        DELETE FROM flexible_product_variants
        WHERE id = $1 AND product_id = $2
        RETURNING id
      `,
      [req.params.variantId, req.params.productId]
    );

    if (deleted.rowCount === 0) {
      return res.status(404).json({ data: null, message: 'Variant not found' });
    }

    res.json({ data: await getProductWithVariants(req.params.productId), message: 'Variant deleted successfully' });
  } catch (error) {
    res.status(500).json({ data: null, message: `Error deleting variant: ${error.message}` });
  }
};

exports.reduceVariantStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || Number(quantity) <= 0) {
      return res.status(400).json({ data: null, message: 'Valid quantity is required' });
    }

    const variant = await query(
      `
        SELECT stock
        FROM flexible_product_variants
        WHERE id = $1 AND product_id = $2
        LIMIT 1
      `,
      [req.params.variantId, req.params.productId]
    );

    if (variant.rowCount === 0) {
      return res.status(404).json({ data: null, message: 'Variant not found' });
    }
    if (Number(variant.rows[0].stock) < Number(quantity)) {
      return res.status(400).json({ data: null, message: 'Insufficient stock' });
    }

    await query(
      `
        UPDATE flexible_product_variants
        SET stock = stock - $1, updated_at = NOW()
        WHERE id = $2 AND product_id = $3
      `,
      [Number(quantity), req.params.variantId, req.params.productId]
    );

    res.json({ data: await getProductWithVariants(req.params.productId), message: `Stock reduced by ${quantity}` });
  } catch (error) {
    res.status(500).json({ data: null, message: `Error reducing stock: ${error.message}` });
  }
};

exports.getVariants = async (req, res) => {
  try {
    const product = await getProductWithVariants(req.params.productId);
    if (!product) {
      return res.status(404).json({ data: [], message: 'Product not found' });
    }
    res.json({ data: product.variants, count: product.variants.length, message: 'Variants retrieved successfully' });
  } catch (error) {
    res.status(500).json({ data: [], message: `Error fetching variants: ${error.message}` });
  }
};

exports.getLowStockVariants = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold || 10);
    const result = await query(
      `
        SELECT
          p.id AS product_id,
          p.display_name,
          v.id AS variant_id,
          v.type,
          v.value,
          v.price,
          v.stock,
          v.unit,
          v.created_at AS variant_created_at
        FROM flexible_products p
        JOIN flexible_product_variants v ON v.product_id = p.id
        WHERE v.stock <= $1
        ORDER BY v.stock ASC
      `,
      [threshold]
    );

    const data = result.rows.map((row) => ({
      productId: row.product_id,
      productName: row.display_name,
      variant: mapVariant(row),
      stock: Number(row.stock),
    }));

    res.json({ data, count: data.length, message: 'Low stock variants retrieved' });
  } catch (error) {
    res.status(500).json({ data: [], message: `Error fetching low stock variants: ${error.message}` });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const search = req.query.query;
    if (!search || !search.trim()) {
      return res.status(400).json({ data: [], message: 'Search query is required' });
    }

    const result = await query(
      `
        SELECT id
        FROM flexible_products
        WHERE LOWER(name) LIKE $1 OR LOWER(display_name) LIKE $1
        ORDER BY created_at DESC
      `,
      [`%${search.trim().toLowerCase()}%`]
    );

    const data = [];
    for (const row of result.rows) {
      const product = await getProductWithVariants(row.id);
      if (product) {
        data.push(product);
      }
    }

    res.json({ data, count: data.length, message: 'Products found' });
  } catch (error) {
    res.status(500).json({ data: [], message: `Error searching products: ${error.message}` });
  }
};
