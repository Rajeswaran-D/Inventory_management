const { query, withTransaction } = require('../lib/db');
const { createId } = require('../lib/ids');
const {
  buildVariantDisplayName,
  buildVariantKey,
  buildVariantSku,
  normalizeOptionalValue,
  toArray,
} = require('../lib/productUtils');

function mapProduct(row) {
  return {
    _id: row.id,
    name: row.name,
    hasGSM: row.has_gsm,
    hasSize: row.has_size,
    hasColor: row.has_color,
    description: row.description,
    category: row.category,
    gsmOptions: row.gsm_options || [],
    sizeOptions: row.size_options || [],
    colorOptions: row.color_options || [],
    isActive: row.is_active,
    isManualProduct: row.is_manual_product,
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
      hasGSM: row.product_has_gsm,
      hasSize: row.product_has_size,
      hasColor: row.product_has_color,
    } : row.productId,
    gsm: row.gsm,
    size: row.size,
    color: row.color,
    hasSize: row.has_size,
    hasGSM: row.has_gsm,
    sku: row.sku,
    displayName: row.display_name,
    isActive: row.variant_is_active ?? row.is_active,
    price: row.inventory_price !== undefined ? Number(row.inventory_price) : Number(row.price || 0),
    quantity: row.inventory_quantity !== undefined ? Number(row.inventory_quantity) : Number(row.quantity || 0),
    inventoryId: row.inventory_id || row.inventoryId || null,
    createdAt: row.variant_created_at || row.created_at,
    updatedAt: row.variant_updated_at || row.updated_at,
  };
}

async function getProductRecordById(id) {
  const result = await query(
    `
      SELECT
        id, name, has_gsm, has_size, has_color, description, category,
        gsm_options, size_options, color_options, is_active, is_manual_product,
        created_at, updated_at
      FROM product_masters
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );
  return result.rows[0] || null;
}

async function getVariantWithInventory(id) {
  const result = await query(
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
      WHERE v.id = $1
      LIMIT 1
    `,
    [id]
  );
  return result.rows[0] || null;
}

exports.getAllProducts = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const params = [];
    let where = '';

    if (isActive === 'all') {
      // do not filter
    } else if (isActive === 'false') {
      params.push(false);
      where = `WHERE is_active = $1`;
    } else {
      // Default to active only
      params.push(true);
      where = `WHERE is_active = $1`;
    }

    const products = await query(
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

    res.status(200).json(products.rows.map(mapProduct));
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

    const variants = await query(
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
        WHERE v.product_id = $1 AND v.is_active = TRUE
        ORDER BY v.display_name ASC
      `,
      [req.params.id]
    );

    res.status(200).json({
      ...mapProduct(product),
      variants: variants.rows.map((row) =>
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

    const existing = await query('SELECT id, is_active FROM product_masters WHERE name = $1 LIMIT 1', [name]);
    if (existing.rowCount > 0) {
      if (existing.rows[0].is_active) {
        return res.status(400).json({ message: `Product '${name}' already exists` });
      } else {
        // Reactivate soft-deleted product and update its configuration
        const reactivated = await query(
          `
            UPDATE product_masters
            SET is_active = TRUE, has_gsm = $2, has_size = $3, has_color = $4, updated_at = NOW()
            WHERE id = $1
            RETURNING
              id, name, has_gsm, has_size, has_color, description, category,
              gsm_options, size_options, color_options, is_active, is_manual_product,
              created_at, updated_at
          `,
          [existing.rows[0].id, !!req.body.hasGSM, !!req.body.hasSize, !!req.body.hasColor]
        );
        return res.status(201).json({
          message: 'Product reactivated successfully',
          product: mapProduct(reactivated.rows[0]),
        });
      }
    }

    const created = await query(
      `
        INSERT INTO product_masters (
          id, name, has_gsm, has_size, has_color, description, category,
          gsm_options, size_options, color_options, is_active, is_manual_product
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, TRUE, FALSE)
        RETURNING
          id, name, has_gsm, has_size, has_color, description, category,
          gsm_options, size_options, color_options, is_active, is_manual_product,
          created_at, updated_at
      `,
      [
        createId(),
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

    res.status(201).json({
      message: 'Product created successfully',
      product: mapProduct(created.rows[0]),
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
      const nameCheck = await query('SELECT id, is_active FROM product_masters WHERE name = $1 LIMIT 1', [nextName]);
      if (nameCheck.rowCount > 0) {
        if (nameCheck.rows[0].is_active) {
          return res.status(400).json({ message: `A product with the name '${nextName}' already exists` });
        } else {
          // The conflicting product is inactive. Rename it to free up the name.
          const oldId = nameCheck.rows[0].id;
          await query('UPDATE product_masters SET name = $1 WHERE id = $2', [`${nextName}_deleted_${Date.now()}`, oldId]);
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

    const updated = await withTransaction(async (client) => {
      const updatedProduct = await query(
        `
          UPDATE product_masters
          SET
          name = $1,
          description = $2,
          has_gsm = $3,
          has_size = $4,
          has_color = $5,
          gsm_options = $6::jsonb,
          size_options = $7::jsonb,
          color_options = $8::jsonb,
          updated_at = NOW()
        WHERE id = $9
        RETURNING
          id, name, has_gsm, has_size, has_color, description, category,
          gsm_options, size_options, color_options, is_active, is_manual_product,
          created_at, updated_at
      `,
      [nextName, nextDescription, nextHasGsm, nextHasSize, nextHasColor, JSON.stringify(mergedGsm), JSON.stringify(mergedSizes), JSON.stringify(mergedColors), req.params.id],
      client
    );

      if (nextName !== existing.name || nextHasGsm !== existing.has_gsm || nextHasSize !== existing.has_size || nextHasColor !== existing.has_color) {
        const variants = await query('SELECT id, gsm, size, color FROM product_variants WHERE product_id = $1', [req.params.id], client);
        for (const variant of variants.rows) {
          const nextDisplayName = buildVariantDisplayName(
            { name: nextName, hasGSM: nextHasGsm, hasSize: nextHasSize, hasColor: nextHasColor },
            { gsm: variant.gsm, size: variant.size, color: variant.color }
          );
          const nextSku = buildVariantSku(nextName, variant.gsm, variant.size, variant.color);
          const nextKey = buildVariantKey(req.params.id, variant.gsm, variant.size, variant.color);
          
          await query(
            'UPDATE product_variants SET display_name = $1, sku = $2, variant_key = $3 WHERE id = $4',
            [nextDisplayName, nextSku, nextKey, variant.id],
            client
          );
        }
      }

      return updatedProduct;
    });

    res.status(200).json({
      message: 'Product updated successfully',
      product: mapProduct(updated.rows[0]),
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const deleted = await query(
      `
        UPDATE product_masters
        SET is_active = FALSE, updated_at = NOW()
        WHERE id = $1
        RETURNING
          id, name, has_gsm, has_size, has_color, description, category,
          gsm_options, size_options, color_options, is_active, is_manual_product,
          created_at, updated_at
      `,
      [req.params.id]
    );

    if (deleted.rowCount === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Also soft-delete all associated variants so they stop showing up
    await query(`UPDATE product_variants SET is_active = FALSE, updated_at = NOW() WHERE product_id = $1`, [req.params.id]);

    res.status(200).json({ message: 'Product deleted successfully', product: mapProduct(deleted.rows[0]) });
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
      clauses.push(`v.product_id = $${params.length}`);
    }
    if (isActive !== undefined) {
      params.push(isActive === 'true');
      clauses.push(`v.is_active = $${params.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const variants = await query(
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

    res.status(200).json(variants.rows.map(mapVariant));
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
      const existingProduct = await query(
        `
          SELECT
            id, name, has_gsm, has_size, has_color, description, category,
            gsm_options, size_options, color_options, is_active, is_manual_product,
            created_at, updated_at
          FROM product_masters
          WHERE name = $1
          LIMIT 1
        `,
        [productName]
      );

      if (existingProduct.rowCount > 0) {
        product = existingProduct.rows[0];
        if (!product.is_active) {
          // Reactivate the soft-deleted product
          await query('UPDATE product_masters SET is_active = TRUE, updated_at = NOW() WHERE id = $1', [product.id]);
          product.is_active = true;
        }
      } else {
        const createdProduct = await query(
          `
            INSERT INTO product_masters (
              id, name, has_gsm, has_size, has_color, description, category,
              gsm_options, size_options, color_options, is_active, is_manual_product
            )
            VALUES ($1, $2, $3, $4, $5, NULL, 'Standard Envelope', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, TRUE, TRUE)
            RETURNING
              id, name, has_gsm, has_size, has_color, description, category,
              gsm_options, size_options, color_options, is_active, is_manual_product,
              created_at, updated_at
          `,
          [createId(), productName, !!gsm, !!size, !!color]
        );
        product = createdProduct.rows[0];
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
    const duplicate = await query('SELECT id, is_active FROM product_variants WHERE variant_key = $1 LIMIT 1', [variantKey]);
    
    if (duplicate.rowCount > 0) {
      const variantId = duplicate.rows[0].id;

      if (duplicate.rows[0].is_active) {
        // Variant is active. Check if inventory exists.
        const invCheck = await query('SELECT id, is_active FROM inventory WHERE variant_id = $1 LIMIT 1', [variantId]);
        if (invCheck.rowCount > 0) {
          if (invCheck.rows[0].is_active) {
            return res.status(400).json({ message: 'This variant already exists and has active inventory' });
          } else {
            // Inventory exists but inactive, reactivate it
            await query('UPDATE inventory SET is_active = TRUE, price = $1, updated_at = NOW() WHERE id = $2', [Number(price || 0), invCheck.rows[0].id]);
            const reactivated = await getVariantWithInventory(variantId);
            return res.status(201).json({ message: 'Inventory reactivated successfully', variant: mapVariant(reactivated) });
          }
        } else {
          // Variant exists but NO inventory record. Create it now!
          await query(
            'INSERT INTO inventory (id, variant_id, quantity, price, minimum_stock_level, is_active) VALUES ($1, $2, 0, $3, 50, TRUE)',
            [createId(), variantId, Number(price || 0)]
          );
          const created = await getVariantWithInventory(variantId);
          return res.status(201).json({ message: 'Inventory created for existing variant', variant: mapVariant(created) });
        }
      } else {
        // Reactivate soft-deleted variant and inventory
        await withTransaction(async (client) => {
          await query(
            'UPDATE product_variants SET is_active = TRUE, updated_at = NOW() WHERE id = $1',
            [variantId],
            client
          );
          
          await query(
            'UPDATE inventory SET is_active = TRUE, price = $1, updated_at = NOW() WHERE variant_id = $2',
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
      await query(
        `
          INSERT INTO product_variants (
            id, product_id, gsm, size, color, has_size, has_gsm,
            sku, display_name, variant_key, is_active
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)
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

      await query(
        `
          INSERT INTO inventory (id, variant_id, quantity, price, minimum_stock_level, is_active)
          VALUES ($1, $2, 0, $3, 50, TRUE)
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

    const duplicate = await query(
      'SELECT id FROM product_variants WHERE variant_key = $1 AND id <> $2 LIMIT 1',
      [nextKey, req.params.id]
    );
    if (duplicate.rowCount > 0) {
      return res.status(400).json({ message: 'Another variant with these specs already exists' });
    }

    const displayName = buildVariantDisplayName(
      { name: product.name, hasGSM: product.has_gsm, hasSize: product.has_size, hasColor: product.has_color },
      { gsm: nextGsm, size: nextSize, color: nextColor }
    );

    await withTransaction(async (client) => {
      await query(
        `
          UPDATE product_variants
          SET
            gsm = $1,
            size = $2,
            color = $3,
            display_name = $4,
            sku = $5,
            variant_key = $6,
            updated_at = NOW()
          WHERE id = $7
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
        await query(
          `
            UPDATE inventory
            SET price = $1, updated_at = NOW()
            WHERE variant_id = $2
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
      await query('DELETE FROM inventory WHERE variant_id = $1', [req.params.id], client);
      await query('DELETE FROM product_variants WHERE id = $1', [req.params.id], client);
    });

    const remaining = await query(
      'SELECT COUNT(*)::int AS count FROM product_variants WHERE product_id = $1 AND is_active = TRUE',
      [variant.product_id]
    );

    if (remaining.rows[0].count === 0) {
      // Auto-hide the product master if it has no more variants
      await query('UPDATE product_masters SET is_active = FALSE WHERE id = $1', [variant.product_id]);
    }

    res.status(200).json({
      message: 'Variant and Inventory deleted successfully',
      variant: mapVariant(variant),
      inventoryDeleted: true,
      remainingVariants: remaining.rows[0].count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getMaterialOptions = async (req, res, next) => {
  try {
    const products = await query(
      'SELECT name FROM product_masters WHERE is_active = TRUE ORDER BY name ASC'
    );
    res.status(200).json(products.rows.map((row) => row.name));
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
    const products = await query(
      `
        SELECT
          id, name, has_gsm, has_size, has_color, gsm_options, size_options, color_options
        FROM product_masters
        WHERE is_active = TRUE
      `
    );

    const config = {};
    for (const product of products.rows) {
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
