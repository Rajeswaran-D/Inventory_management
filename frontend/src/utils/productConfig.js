/**
 * PRODUCT CONFIGURATION & HELPERS
 * Defines all product types with their dropdown options and conditional logic
 */

export const PRODUCT_CONFIG = {
  maplitho: {
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

  buff: {
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

  kraft: {
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

  cloth_cover: {
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

  vibhoothi: {
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

/**
 * Get product details by ID
 */
export const getProductByID = (productId) => {
  return PRODUCT_CONFIG[productId?.toLowerCase()] || null;
};

/**
 * Get all products as array
 */
export const getAllProducts = () => {
  return Object.values(PRODUCT_CONFIG);
};

/**
 * Generate display name for a product variant
 */
export const generateDisplayName = (productId, gsm, size, color) => {
  const product = getProductByID(productId);
  if (!product) return '';

  const parts = [product.name];
  
  if (product.hasGSM && gsm) parts.push(`${gsm}GSM`);
  if (product.hasSize && size) parts.push(size);
  if (product.hasColor && color) parts.push(color);
  
  return parts.join(' | ');
};

/**
 * Validate product selection is complete
 */
export const validateSelection = (productId, gsm, size, color) => {
  const product = getProductByID(productId);
  
  if (!product) {
    return { valid: false, error: 'Product not selected' };
  }

  if (product.hasGSM && !gsm) {
    return { valid: false, error: 'GSM is required' };
  }

  if (product.hasGSM && !product.gsmOptions.includes(parseInt(gsm))) {
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

/**
 * Get step labels for the selected product
 */
export const getStepLabels = (productId) => {
  const product = getProductByID(productId);
  if (!product) return [];

  const steps = [];
  let stepNum = 1;

  if (product.hasGSM) steps.push({ num: stepNum++, name: 'GSM' });
  if (product.hasSize) steps.push({ num: stepNum++, name: 'Size' });
  if (product.hasColor) steps.push({ num: stepNum++, name: 'Color' });
  steps.push({ num: stepNum, name: 'Quantity' });

  return steps;
};
