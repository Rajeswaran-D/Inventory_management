/**
 * Product Data Configuration
 * Structured product data with materials, GSM variants, and sizes
 */

// Envelope sizes (all materials can use these)
export const ENVELOPE_SIZES = [
  "6.25x4.25",
  "7.5x4.5",
  "7.25x5.25",
  "9x4",
  "9.5x4.25",
  "10.5x4.5",
  "11x5",
  "9x6",
  "12x5",
  "9x7",
  "9x6.5",
  "10x8",
  "10.25x8.25",
  "11.5x8.75",
  "12x9.5",
  "12x10",
  "13x10",
  "15x11",
  "16x12",
  "18x14",
  "20x16"
];

// Material types with their GSM variants
export const MATERIAL_CONFIG = {
  Maplitho: { gsm: [80, 90, 120], requiresColor: false },
  Buff: { gsm: [80, 100], requiresColor: false },
  Kraft: { gsm: [50], requiresColor: false },
  "Cloth Covers": { gsm: null, requiresColor: false },
  "Vibhoothi Covers": { gsm: null, requiresColor: true, colors: ["White", "Colour"], sizeRestriction: "Standard" }
};

// All material type names
export const MATERIAL_TYPES = Object.keys(MATERIAL_CONFIG);

/**
 * Get GSM variants for a specific material
 * @param {string} material - Material type name
 * @returns {array|null} - Array of GSM values or null
 */
export const getGsmVariants = (material) => {
  return MATERIAL_CONFIG[material]?.gsm || null;
};

/**
 * Check if material requires color selection
 * @param {string} material - Material type name
 * @returns {boolean}
 */
export const requiresColor = (material) => {
  return MATERIAL_CONFIG[material]?.requiresColor || false;
};

/**
 * Get color options for material
 * @param {string} material - Material type name
 * @returns {array|null} - Array of color options or null
 */
export const getColorOptions = (material) => {
  return MATERIAL_CONFIG[material]?.colors || null;
};

/**
 * Get available sizes for material
 * @param {string} material - Material type name
 * @returns {array} - Array of available sizes
 */
export const getAvailableSizes = (material) => {
  const config = MATERIAL_CONFIG[material];
  if (config?.sizeRestriction === "Standard") {
    return ["Standard"];
  }
  return ENVELOPE_SIZES;
};

/**
 * Generate product key for unique identification
 * @param {object} product - Product object with size, material, gsm, color
 * @returns {string} - Unique product key
 */
export const generateProductKey = (product) => {
  const parts = [product.size, product.materialType];
  if (product.gsm) parts.push(`${product.gsm}GSM`);
  if (product.color) parts.push(product.color);
  return parts.join("|");
};

/**
 * Generate all product combinations
 * Used by seed script
 */
export const generateAllProducts = () => {
  const products = [];
  const seen = new Set();

  MATERIAL_TYPES.forEach((material) => {
    const config = MATERIAL_CONFIG[material];
    const sizes = getAvailableSizes(material);
    
    if (requiresColor(material)) {
      // Vibhoothi with colors
      const colors = getColorOptions(material);
      colors?.forEach((color) => {
        sizes.forEach((size) => {
          const key = `${size}|${material}|${color}`;
          if (!seen.has(key)) {
            products.push({
              size,
              materialType: material,
              gsm: null,
              color,
              price: 0,
              quantity: 0,
              isActive: true
            });
            seen.add(key);
          }
        });
      });
    } else if (config.gsm) {
      // Materials with GSM variants
      config.gsm.forEach((gsm) => {
        sizes.forEach((size) => {
          const key = `${size}|${material}|${gsm}GSM`;
          if (!seen.has(key)) {
            products.push({
              size,
              materialType: material,
              gsm,
              color: null,
              price: 0,
              quantity: 0,
              isActive: true
            });
            seen.add(key);
          }
        });
      });
    } else {
      // Cloth and others without GSM
      sizes.forEach((size) => {
        const key = `${size}|${material}`;
        if (!seen.has(key)) {
          products.push({
            size,
            materialType: material,
            gsm: null,
            color: null,
            price: 0,
            quantity: 0,
            isActive: true
          });
          seen.add(key);
        }
      });
    }
  });

  return products;
};

/**
 * Format product display name
 * @param {object} product - Product object
 * @returns {string} - Formatted display name
 */
export const formatProductName = (product) => {
  const parts = [product.size, product.materialType];
  if (product.gsm) parts.push(`${product.gsm} GSM`);
  if (product.color) parts.push(product.color);
  return parts.join(" | ");
};
