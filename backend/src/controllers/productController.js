const { run, get, all, query, withTransaction } = require('../lib/db');
const { createId } = require('../lib/ids');
const {
  buildVariantDisplayName,
  buildVariantKey,
  buildVariantSku,
  normalizeOptionalValue,
  toArray,
} = require('../lib/productUtils');

function mapProduct(row) {
  const parseJson = (val) => {
    if (!val) return [];
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return []; }
    }
    return val;
  };

  return {
    _id: row.id,
    name: row.name,
    hasGSM: Boolean(row.has_gsm),
    hasSize: Boolean(row.has_size),
    hasColor: Boolean(row.has_color),
    description: row.description,
    category: row.category,
    gsmOptions: parseJson(row.gsm_options),
    sizeOptions: parseJson(row.size_options),
    colorOptions: parseJson(row.color_options),
    isActive: Boolean(row.is_active),
    isManualProduct: Boolean(row.is_manual_product),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVariant(row) {
  return {
    _id: row.variant_id || row.id,
    productId: row.product_id && row.product_name ? {
      _id: row.product_id,
      name: row.product_name,
      hasGSM: Boolean(row.product_has_gsm),
      hasSize: Boolean(row.product_has_size),
      hasColor: Boolean(row.product_has_color),
    } : row.productId,
    gsm: row.gsm,
    size: row.size,
    color: row.color,
    hasSize: Boolean(row.has_size),
    hasGSM: Boolean(row.has_gsm),
    sku: row.sku,
    displayName: row.display_name,
    isActive: Boolean(row.variant_is_active ?? row.is_active),
    price: row.inventory_price !== undefined && row.inventory_price !== null ? Number(row.inventory_price) : Number(row.price || 0),
    quantity: row.inventory_quantity !== undefined && row.inventory_quantity !== null ? Number(row.inventory_quantity) : Number(row.quantity || 0),
    inventoryId: row.inventory_id || row.inventoryId || null,
    createdAt: row.variant_created_at || row.created_at,
    updatedAt: row.variant_updated_at || row.updated_at,
  };
}

async function getProductRecordById(id) {
  const result = await get(
    `
      SELECT
        id, name, has_gsm, has_size, has_color, description, category,
        gsm_options, size_options, color_options, is_active, is_manual_product,
        created_at, updated_at
      FROM product_masters
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );
  return result || null;
}

async function getVariantWithInventory(id) {
  const result = await get(
    `
      SELECT
        v.id AS variant_id,
        v.product_id,
        v.gsm,
        v.size,
        v.color,
        v.has_size,
        v.has_gsm,
        v.sku,
        v.display_name,
        v.is_active AS variant_is_active,
        v.created_at AS variant_created_at,
        v.updated_at AS variant_updated_at,
        p.name AS product_name,
        p.has_gsm AS product_has_gsm,
        p.has_size AS product_has_size,
        p.has_color AS product_has_color,
        i.id AS inventory_id,
        i.price AS inventory_price,
        i.quantity AS inventory_quantity
      FROM product_variants v
      JOIN product_masters p ON p.id = v.product_id
      LEFT JOIN inventory i ON i.variant_id = v.id
      WHERE v.id = ?
      LIMIT 1
    `,
    [id]
  );
  return result || null;
}

exports.getAllProducts = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const params = [];
    let where = '';

      if (isActive === 'all') {
      // do not filter
    } else if (isActive === 'false') {
      params.push(0);
      where = `WHERE is_active = ?`;
    } else {
      // Default to active only
      params.push(1);
      where = `WHERE is_active = ?`;
    }

    const products = await all(
      `
        SELECT
          id, name, has_gsm, has_size, has_color, description, category,
          gsm_options, size_options, color_options, is_active, is_manual_product,
          created_at, updated_at
        FROM product_masters
        ${where}
        ORDER BY name ASC
      `,
      params
    );

    res.status(200).json(products.map(mapProduct));
  } catch (err) {
    next(err);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await getProductRecordById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const variants = await all(
      `
        SELECT
          v.id AS variant_id,
          v.product_id,
          v.gsm,
          v.size,
          v.color,
          v.has_size,
          v.has_gsm,
          v.sku,
          v.display_name,
          v.is_active AS variant_is_active,
          v.created_at AS variant_created_at,
          v.updated_at AS variant_updated_at,
          i.id AS inventory_id,
          i.price AS inventory_price,
          i.quantity AS inventory_quantity
        FROM product_variants v
        LEFT JOIN inventory i ON i.variant_id = v.id
        WHERE v.product_id = ? AND v.is_active = 1
        ORDER BY v.display_name ASC
      `,
      [req.params.id]
    );

    res.status(200).json({
      ...mapProduct(product),
      variants: variants.map((row) =>
        mapVariant({
          ...row,
          product_id: product.id,
          product_name: product.name,
          product_has_gsm: product.has_gsm,
          product_has_size: product.has_size,
          product_has_color: product.has_color,
        })
      ),
    });
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { name, gsmOptions, sizeOptions, colorOptions, description, category } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Product name is required' });
    }

    const existing = await get('SELECT id, is_active FROM product_masters WHERE name = ? LIMIT 1', [name]);
    if (existing) {
      if (existing.is_active) {
        return res.status(400).json({ message: `Product '${name}' already exists` });
      } else {
        // Reactivate soft-deleted product and update its configuration
        await run(
          `
            UPDATE product_masters
            SET is_active = TRUE, has_gsm = ?, has_size = ?, has_color = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `,
          [!!req.body.hasGSM, !!req.body.hasSize, !!req.body.hasColor, existing.id]
        );
        const reactivated = await get(`SELECT * FROM product_masters WHERE id = ?`, [existing.id]);
        return res.status(201).json({
          message: 'Product reactivated successfully',
          product: mapProduct(reactivated),
        });
      }
    }

    const newId = createId();
    await run(
      `
        INSERT INTO product_masters (
          id, name, has_gsm, has_size, has_color, description, category,
          gsm_options, size_options, color_options, is_active, is_manual_product
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, FALSE)
      `,
      [
        newId,
        name,
        !!req.body.hasGSM,
        !!req.body.hasSize,
        !!req.body.hasColor,
        description || null,
        category || 'Standard Envelope',
        JSON.stringify(toArray(gsmOptions)),
        JSON.stringify(toArray(sizeOptions)),
        JSON.stringify(toArray(colorOptions)),
      ]
    );

    const createdProduct = await get(`SELECT * FROM product_masters WHERE id = ?`, [newId]);

    res.status(201).json({
      message: 'Product created successfully',
      product: mapProduct(createdProduct),
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const existing = await getProductRecordById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const nextName = req.body.name !== undefined ? req.body.name : existing.name;
    const nextDescription = req.body.description !== undefined ? req.body.description : existing.description;
    const nextHasGsm = req.body.hasGSM !== undefined ? req.body.hasGSM : existing.has_gsm;
    const nextHasSize = req.body.hasSize !== undefined ? req.body.hasSize : existing.has_size;
    const nextHasColor = req.body.hasColor !== undefined ? req.body.hasColor : existing.has_color;

    // Check for duplicate name
    if (nextName !== existing.name) {
      const nameCheck = await get('SELECT id, is_active FROM product_masters WHERE name = ? LIMIT 1', [nextName]);
      if (nameCheck) {
        if (nameCheck.is_active) {
          return res.status(400).json({ message: `A product with the name '${nextName}' already exists` });
        } else {
          // The conflicting product is inactive. Rename it to free up the name.
          const oldId = nameCheck.id;
          await run('UPDATE product_masters SET name = ? WHERE id = ?', [`${nextName}_deleted_${Date.now()}`, oldId]);
        }
      }
    }

    const mergedGsm = req.body.gsmOptions && Array.isArray(req.body.gsmOptions)
      ? [...new Set([...(existing.gsm_options || []), ...req.body.gsmOptions])].sort((a, b) => a - b)
      : existing.gsm_options || [];
    const mergedSizes = req.body.sizeOptions && Array.isArray(req.body.sizeOptions)
      ? [...new Set([...(existing.size_options || []), ...req.body.sizeOptions])]
      : existing.size_options || [];
    const mergedColors = req.body.colorOptions && Array.isArray(req.body.colorOptions)
      ? [...new Set([...(existing.color_options || []), ...req.body.colorOptions])]
      : existing.color_options || [];

    const updatedId = req.params.id;
    await withTransaction(async (client) => {
      await run(
        `
          UPDATE product_masters
          SET
          name = ?,
          description = ?,
          has_gsm = ?,
          has_size = ?,
          has_color = ?,
          gsm_options = ?,
          size_options = ?,
          color_options = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [nextName, nextDescription, nextHasGsm, nextHasSize, nextHasColor, JSON.stringify(mergedGsm), JSON.stringify(mergedSizes), JSON.stringify(mergedColors), req.params.id],
      client
    );

      if (nextName !== existing.name || nextHasGsm !== existing.has_gsm || nextHasSize !== existing.has_size || nextHasColor !== existing.has_color) {
        const variants = await all('SELECT id, gsm, size, color FROM product_variants WHERE product_id = ?', [req.params.id], client);
        for (const variant of variants) {
          const nextDisplayName = buildVariantDisplayName(
            { name: nextName, hasGSM: nextHasGsm, hasSize: nextHasSize, hasColor: nextHasColor },
            { gsm: variant.gsm, size: variant.size, color: variant.color }
          );
          const nextSku = buildVariantSku(nextName, variant.gsm, variant.size, variant.color);
          const nextKey = buildVariantKey(req.params.id, variant.gsm, variant.size, variant.color);
          
          await run(
            'UPDATE product_variants SET display_name = ?, sku = ?, variant_key = ? WHERE id = ?',
            [nextDisplayName, nextSku, nextKey, variant.id],
            client
          );
        }
      }
    });

    const finalProduct = await get(`SELECT * FROM product_masters WHERE id = ?`, [updatedId]);

    res.status(200).json({
      message: 'Product updated successfully',
      product: mapProduct(finalProduct),
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { changes } = await run(
      `
        UPDATE product_masters
        SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [req.params.id]
    );

    if (changes === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Also soft-delete all associated variants so they stop showing up
    await run(`UPDATE product_variants SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?`, [req.params.id]);

    const finalProduct = await get(`SELECT * FROM product_masters WHERE id = ?`, [req.params.id]);

    res.status(200).json({ message: 'Product deleted successfully', product: mapProduct(finalProduct) });
  } catch (err) {
    next(err);
  }
};

exports.getAllVariants = async (req, res, next) => {
  try {
    const { productId, isActive } = req.query;
    const params = [];
    const clauses = [];

    if (productId) {
      params.push(productId);
      clauses.push(`v.product_id = ?`);
    }
    if (isActive !== undefined) {
      params.push(isActive === 'true' ? 1 : 0);
      clauses.push(`v.is_active = ?`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const variants = await all(
      `
        SELECT
          v.id AS variant_id,
          v.product_id,
          v.gsm,
          v.size,
          v.color,
          v.has_size,
          v.has_gsm,
          v.sku,
          v.display_name,
          v.is_active AS variant_is_active,
          v.created_at AS variant_created_at,
          v.updated_at AS variant_updated_at,
          p.name AS product_name,
          p.has_gsm AS product_has_gsm,
          p.has_size AS product_has_size,
          p.has_color AS product_has_color,
          i.id AS inventory_id,
          i.price AS inventory_price,
          i.quantity AS inventory_quantity
        FROM product_variants v
        JOIN product_masters p ON p.id = v.product_id
        LEFT JOIN inventory i ON i.variant_id = v.id
        ${where}
        ORDER BY v.display_name ASC
      `,
      params
    );

    res.status(200).json(variants.map(mapVariant));
  } catch (err) {
    next(err);
  }
};

exports.getVariantById = async (req, res, next) => {
  try {
    const variant = await getVariantWithInventory(req.params.id);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }
    res.status(200).json(mapVariant(variant));
  } catch (err) {
    next(err);
  }
};

exports.createVariant = async (req, res, next) => {
  try {
    const { productId, productName, gsm, size, color, isManualProduct, price } = req.body;
    let product = null;

    if (isManualProduct && !productId) {
      const existingProduct = await get(
        `
          SELECT
            id, name, has_gsm, has_size, has_color, description, category,
            gsm_options, size_options, color_options, is_active, is_manual_product,
            created_at, updated_at
          FROM product_masters
          WHERE name = ?
          LIMIT 1
        `,
        [productName]
      );

      if (existingProduct) {
        product = existingProduct;
        if (!product.is_active) {
          // Reactivate the soft-deleted product
          await run('UPDATE product_masters SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [product.id]);
          product.is_active = true;
        }
      } else {
        const prodId = createId();
        await run(
          `
            INSERT INTO product_masters (
              id, name, has_gsm, has_size, has_color, description, category,
              gsm_options, size_options, color_options, is_active, is_manual_product
            )
            VALUES (?, ?, ?, ?, ?, NULL, 'Standard Envelope', '[]', '[]', '[]', TRUE, TRUE)
          `,
          [prodId, productName, !!gsm, !!size, !!color]
        );
        product = await get(`SELECT * FROM product_masters WHERE id = ?`, [prodId]);
      }
    } else {
      product = await getProductRecordById(productId);
      if (!product) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }
    }

    if (product.has_gsm && !gsm) {
      return res.status(400).json({ message: `GSM is required for ${product.name}` });
    }
    if (product.has_size && !size) {
      return res.status(400).json({ message: `Size is required for ${product.name}` });
    }

    const variantKey = buildVariantKey(product.id, normalizeOptionalValue(gsm), normalizeOptionalValue(size), normalizeOptionalValue(color));
    const duplicate = await get('SELECT id, is_active FROM product_variants WHERE variant_key = ? LIMIT 1', [variantKey]);
    
    if (duplicate) {
      const variantId = duplicate.id;

      if (duplicate.is_active) {
        // Variant is active. Check if inventory exists.
        const invCheck = await get('SELECT id, is_active FROM inventory WHERE variant_id = ? LIMIT 1', [variantId]);
        if (invCheck) {
          if (invCheck.is_active) {
            return res.status(400).json({ message: 'This variant already exists and has active inventory' });
          } else {
            // Inventory exists but inactive, reactivate it
            await run('UPDATE inventory SET is_active = TRUE, price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [Number(price || 0), invCheck.id]);
            const reactivated = await getVariantWithInventory(variantId);
            return res.status(201).json({ message: 'Inventory reactivated successfully', variant: mapVariant(reactivated) });
          }
        } else {
          // Variant exists but NO inventory record. Create it now!
          await run(
            'INSERT INTO inventory (id, variant_id, quantity, price, minimum_stock_level, is_active) VALUES (?, ?, 0, ?, 50, TRUE)',
            [createId(), variantId, Number(price || 0)]
          );
          const created = await getVariantWithInventory(variantId);
          return res.status(201).json({ message: 'Inventory created for existing variant', variant: mapVariant(created) });
        }
      } else {
        // Reactivate soft-deleted variant and inventory
        await withTransaction(async (client) => {
          await run(
            'UPDATE product_variants SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [variantId],
            client
          );
          
          await run(
            'UPDATE inventory SET is_active = TRUE, price = ?, updated_at = CURRENT_TIMESTAMP WHERE variant_id = ?',
            [Number(price || 0), variantId],
            client
          );
        });

        const reactivated = await getVariantWithInventory(variantId);
        return res.status(201).json({
          message: 'Variant and Inventory reactivated successfully',
          variant: mapVariant(reactivated),
        });
      }
    }

    const displayName = buildVariantDisplayName(
      { name: product.name, hasGSM: product.has_gsm, hasSize: product.has_size, hasColor: product.has_color },
      { gsm, size, color }
    );
    const variantId = createId();

    await withTransaction(async (client) => {
      await run(
        `
          INSERT INTO product_variants (
            id, product_id, gsm, size, color, has_size, has_gsm,
            sku, display_name, variant_key, is_active
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        `,
        [
          variantId,
          product.id,
          normalizeOptionalValue(gsm),
          normalizeOptionalValue(size),
          normalizeOptionalValue(color),
          product.has_size,
          product.has_gsm,
          buildVariantSku(product.name, gsm, size, color),
          displayName,
          variantKey,
        ],
        client
      );

      await run(
        `
          INSERT INTO inventory (id, variant_id, quantity, price, minimum_stock_level, is_active)
          VALUES (?, ?, 0, ?, 50, TRUE)
        `,
        [createId(), variantId, Number(price || 0)],
        client
      );
    });

    const created = await getVariantWithInventory(variantId);
    res.status(201).json({
      message: 'Variant and Inventory created successfully',
      variant: mapVariant(created),
    });
  } catch (err) {
    next(err);
  }
};

exports.updateVariant = async (req, res, next) => {
  try {
    const existing = await getVariantWithInventory(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    const product = await getProductRecordById(existing.product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product master not found' });
    }

    const nextGsm = req.body.gsm !== undefined ? normalizeOptionalValue(req.body.gsm) : existing.gsm;
    const nextSize = req.body.size !== undefined ? normalizeOptionalValue(req.body.size) : existing.size;
    const nextColor = req.body.color !== undefined ? normalizeOptionalValue(req.body.color) : existing.color;
    const nextKey = buildVariantKey(product.id, nextGsm, nextSize, nextColor);

    const duplicate = await get(
      'SELECT id FROM product_variants WHERE variant_key = ? AND id <> ? LIMIT 1',
      [nextKey, req.params.id]
    );
    if (duplicate) {
      return res.status(400).json({ message: 'Another variant with these specs already exists' });
    }

    const displayName = buildVariantDisplayName(
      { name: product.name, hasGSM: product.has_gsm, hasSize: product.has_size, hasColor: product.has_color },
      { gsm: nextGsm, size: nextSize, color: nextColor }
    );

    await withTransaction(async (client) => {
      await run(
        `
          UPDATE product_variants
          SET
            gsm = ?,
            size = ?,
            color = ?,
            display_name = ?,
            sku = ?,
            variant_key = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [
          nextGsm,
          nextSize,
          nextColor,
          displayName,
          buildVariantSku(product.name, nextGsm, nextSize, nextColor),
          nextKey,
          req.params.id,
        ],
        client
      );

      if (req.body.price !== undefined) {
        await run(
          `
            UPDATE inventory
            SET price = ?, updated_at = CURRENT_TIMESTAMP
            WHERE variant_id = ?
          `,
          [Number(req.body.price), req.params.id],
          client
        );
      }
    });

    const updated = await getVariantWithInventory(req.params.id);
    res.status(200).json({
      message: 'Variant updated successfully',
      variant: mapVariant(updated),
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteVariant = async (req, res, next) => {
  try {
    const variant = await getVariantWithInventory(req.params.id);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    await withTransaction(async (client) => {
      await run('DELETE FROM inventory WHERE variant_id = ?', [req.params.id], client);
      await run('DELETE FROM product_variants WHERE id = ?', [req.params.id], client);
    });

    const remaining = await get(
      'SELECT COUNT(*) AS count FROM product_variants WHERE product_id = ? AND is_active = 1',
      [variant.product_id]
    );

    if (remaining.count === 0) {
      // Auto-hide the product master if it has no more variants
      await run('UPDATE product_masters SET is_active = 0 WHERE id = ?', [variant.product_id]);
    }

    res.status(200).json({
      message: 'Variant and Inventory deleted successfully',
      variant: mapVariant(variant),
      inventoryDeleted: true,
      remainingVariants: remaining.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getMaterialOptions = async (req, res, next) => {
  try {
    const products = await all(
      'SELECT name FROM product_masters WHERE is_active = TRUE ORDER BY name ASC'
    );
    res.status(200).json(products.map((row) => row.name));
  } catch (err) {
    next(err);
  }
};

exports.getGSMOptions = async (req, res, next) => {
  try {
    const product = await getProductRecordById(req.query.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (!product.has_gsm) {
      return res.status(200).json([]);
    }
    res.status(200).json(product.gsm_options || []);
  } catch (err) {
    next(err);
  }
};

exports.getSizeOptions = async (req, res, next) => {
  try {
    const product = await getProductRecordById(req.query.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (!product.has_size) {
      return res.status(200).json([]);
    }
    res.status(200).json(product.size_options || []);
  } catch (err) {
    next(err);
  }
};

exports.getColorOptions = async (req, res, next) => {
  try {
    const product = await getProductRecordById(req.query.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (!product.has_color) {
      return res.status(200).json([]);
    }
    res.status(200).json(product.color_options || []);
  } catch (err) {
    next(err);
  }
};

exports.getProductConfiguration = async (req, res, next) => {
  try {
    const products = await all(
      `
        SELECT
          id, name, has_gsm, has_size, has_color, gsm_options, size_options, color_options
        FROM product_masters
        WHERE is_active = TRUE
      `
    );

    const config = {};
    for (const product of products) {
      config[product.name] = {
        hasGSM: product.has_gsm,
        hasSize: product.has_size,
        hasColor: product.has_color,
        gsmOptions: product.gsm_options || [],
        sizeOptions: product.size_options || [],
        colorOptions: product.color_options || [],
      };
    }

    res.status(200).json(config);
  } catch (err) {
    next(err);
  }
};
