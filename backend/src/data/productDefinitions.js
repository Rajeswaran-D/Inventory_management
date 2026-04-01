/**
 * FIXED PRODUCT DEFINITIONS
 * 
 * All product types and their specifications are defined here.
 * This is the single source of truth for product logic - NO dynamic schemas.
 */

// ============================================================================
// PRODUCT CATALOG
// ============================================================================

const PRODUCTS = {
  MAPLITHO: {
    id: 'maplitho',
    name: 'Maplitho',
    category: 'Paper',
    hasGSM: true,
    hasSize: true,
    hasColor: false,
    gsmOptions: [80, 90, 120],
    sizeOptions: [
      '6.25x4.25', '7.5x4.5', '7.25x5.25', '9x4', '9.5x4.25',
      '10.5x4.5', '11x5', '9x6', '12x5', '9x7', '9x6.5',
      '10x8', '10.25x8.25', '11.5x8.75', '12x9.5', '12x10',
      '13x10', '15x11', '16x12', '18x14', '20x16'
    ],
    colorOptions: []
  },

  BUFF: {
    id: 'buff',
    name: 'Buff',
    category: 'Paper',
    hasGSM: true,
    hasSize: true,
    hasColor: false,
    gsmOptions: [80, 100],
    sizeOptions: [
      '6.25x4.25', '7.5x4.5', '7.25x5.25', '9x4', '9.5x4.25',
      '10.5x4.5', '11x5', '9x6', '12x5', '9x7', '9x6.5',
      '10x8', '10.25x8.25', '11.5x8.75', '12x9.5', '12x10',
      '13x10', '15x11', '16x12', '18x14', '20x16'
    ],
    colorOptions: []
  },

  KRAFT: {
    id: 'kraft',
    name: 'Kraft',
    category: 'Paper',
    hasGSM: true,
    hasSize: true,
    hasColor: false,
    gsmOptions: [50],
    sizeOptions: [
      '6.25x4.25', '7.5x4.5', '9x4', '9x6', '10x8',
      '12x9.5', '15x11', '18x14', '20x16'
    ],
    colorOptions: []
  },

  CLOTH_COVER: {
    id: 'cloth_cover',
    name: 'Cloth Cover',
    category: 'Cover',
    hasGSM: false,
    hasSize: true,
    hasColor: false,
    gsmOptions: [],
    sizeOptions: ['10x8', '12x9', '15x11', '18x14'],
    colorOptions: []
  },

  VIBHOOTHI: {
    id: 'vibhoothi',
    name: 'Vibhoothi Cover',
    category: 'Specialty',
    hasGSM: false,
    hasSize: false,
    hasColor: true,
    gsmOptions: [],
    sizeOptions: ['Standard'],
    colorOptions: ['White', 'Colour']
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all product types as array
 */
const getAllProducts = () => Object.values(PRODUCTS);

/**
 * Get product by ID
 */
const getProductById = (id) => {
  return Object.values(PRODUCTS).find(p => p.id === id);
};

/**
 * Get product by name
 */
const getProductByName = (name) => {
  return Object.values(PRODUCTS).find(p => p.name === name);
};

/**
 * Generate all product combinations
 * Returns array of { productId, gsm, size, color }
 */
const generateAllCombinations = () => {
  const combinations = [];

  for (const product of getAllProducts()) {
    const gsms = product.hasGSM ? product.gsmOptions : [null];
    const sizes = product.hasSize ? product.sizeOptions : [null];
    const colors = product.hasColor ? product.colorOptions : [null];

    for (const gsm of gsms) {
      for (const size of sizes) {
        for (const color of colors) {
          combinations.push({
            productId: product.id,
            productName: product.name,
            gsm: product.hasGSM ? gsm : null,
            size: product.hasSize ? size : null,
            color: product.hasColor ? color : null,
            displayName: generateDisplayName(product, gsm, size, color)
          });
        }
      }
    }
  }

  return combinations;
};

/**
 * Generate display name for a product variant
 */
const generateDisplayName = (product, gsm, size, color) => {
  const parts = [product.name];
  
  if (product.hasGSM && gsm) parts.push(`${gsm}GSM`);
  if (product.hasSize && size) parts.push(size);
  if (product.hasColor && color) parts.push(color);
  
  return parts.join(' | ');
};

/**
 * Validate product selection
 */
const validateSelection = (productId, gsm, size, color) => {
  const product = getProductById(productId);
  if (!product) return { valid: false, error: 'Product not found' };

  if (product.hasGSM && !gsm) {
    return { valid: false, error: 'GSM is required' };
  }
  if (product.hasGSM && !product.gsmOptions.includes(gsm)) {
    return { valid: false, error: 'Invalid GSM option' };
  }

  if (product.hasSize && !size) {
    return { valid: false, error: 'Size is required' };
  }
  if (product.hasSize && !product.sizeOptions.includes(size)) {
    return { valid: false, error: 'Invalid size option' };
  }

  if (product.hasColor && !color) {
    return { valid: false, error: 'Color is required' };
  }
  if (product.hasColor && !product.colorOptions.includes(color)) {
    return { valid: false, error: 'Invalid color option' };
  }

  return { valid: true };
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  PRODUCTS,
  getAllProducts,
  getProductById,
  getProductByName,
  generateAllCombinations,
  generateDisplayName,
  validateSelection
};
