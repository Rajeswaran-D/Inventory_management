/**
 * Product Business Rules & Constants
 */

// 1. Material Types & Conditional Rules Map
export const PRODUCT_RULES = {
  'Maplitho': { hasGSM: true, hasSize: true, hasColor: false, gsmOptions: [80, 90, 120] },
  'Buff': { hasGSM: true, hasSize: true, hasColor: false, gsmOptions: [80, 100] },
  'Kraft': { hasGSM: true, hasSize: true, hasColor: false, gsmOptions: [90] },
  'Colour Covers': { hasGSM: true, hasSize: true, hasColor: true, gsmOptions: [80] },
  'Cloth Covers': { hasGSM: false, hasSize: true, hasColor: false, gsmOptions: [] },
  'Vibuthi Covers': { hasGSM: false, hasSize: false, hasColor: true, gsmOptions: [] }
};

// 2. Predefined Sizes
export const PREDEFINED_SIZES = [
  "6\u00BCx4\u00BC", "7\u00BCx5\u00BC", "7\u00BCx4\u00BC", "9x4", "9\u00BCx4\u00BC", "10\u00BCx4\u00BC", 
  "11x5", "9x6", "12x5", "9x7", "9x6\u00BC", "10x8", "10\u00BCx8\u00BC", "11\u00BCx8\u00BC", 
  "12x9\u00BC", "12x10", "13x10", "15x11", "16x12", "18x14", "20x16"
];

// 3. Color Options
export const COLOR_OPTIONS = ['White', 'Color', 'Blue', 'Green', 'Pink', 'Yellow'];

/**
 * Generate Variant Display Name
 * Rules:
 * - Maplitho 80 gsm 9x6
 * - Cloth Cover 16x12
 * - Vibuthi Cover White
 */
export const generateDisplayName = (productName, size, gsm, color) => {
  const parts = [productName];
  
  if (gsm) parts.push(`${gsm} gsm`);
  if (size) parts.push(size);
  if (color) parts.push(color);
  
  return parts.filter(Boolean).join(' ');
};

/**
 * Validate Variant Data based on Material Rules (Optional)
 */
export const validateVariantData = (materialType, data) => {
  if (!materialType) return; // Skip validation for custom products without a type
  
  const rule = PRODUCT_RULES[materialType];
  if (!rule) return; // Silently skip if rule doesn't exist for the type

  const { size, gsm, color } = data;

  if (rule.hasSize && !size) throw new Error(`${materialType} requires a size.`);
  if (rule.hasGSM && !gsm) throw new Error(`${materialType} requires a GSM value.`);
  if (rule.hasColor && !color) throw new Error(`${materialType} requires a color selection.`);
};
