/**
 * Product Catalog - Predefined sizes and material types for Swamy Envelope
 * All products will be seeded with quantity: 0 and price: 0 (to be updated later)
 */

// All predefined envelope sizes
export const ENVELOPE_SIZES = [
  "6.25x4.25",
  "7.25x5.25",
  "7.25x4.25",
  "9x4",
  "9.25x4.25",
  "10.25x4.25",
  "11x5",
  "9x6",
  "12x5",
  "9x7",
  "9x6.25",
  "10x8",
  "10.25x8.25",
  "11.25x8.25",
  "12x9.25",
  "12x10",
  "13x10",
  "15x11",
  "16x12",
  "18x14",
  "20x16"
];

// All predefined material types with GSM
export const MATERIAL_TYPES = [
  "Maplitho 80 GSM",
  "Maplitho 90 GSM",
  "Maplitho 120 GSM",
  "Buff 80 GSM",
  "Buff 100 GSM",
  "Kraft 90 GSM",
  "Colour 80 GSM",
  "Cloth Cover",
  "Vibothi Cover White",
  "Vibothi Cover Color"
];

// Helper function to extract GSM from material type
export const extractGSM = (materialType) => {
  const gsmMatch = materialType.match(/(\d+)\s*GSM/i);
  return gsmMatch ? parseInt(gsmMatch[1], 10) : null;
};

// Helper function to determine color from material type
export const getColorFromMaterial = (materialType) => {
  if (materialType.includes("Vibothi")) {
    if (materialType.includes("White")) return "White";
    if (materialType.includes("Color")) return "Color";
  }
  return null;
};

// Helper function to get display name for product
export const getProductDisplayName = (size, materialType) => {
  return `${size} | ${materialType}`;
};

// Helper function to extract material base name (without GSM/Color)
export const getMaterialBaseName = (materialType) => {
  return materialType
    .replace(/\s*\d+\s*GSM/i, '')
    .replace(/\s+Cover\s+(White|Color)$/i, '')
    .trim();
};

// Export all as object for backend
export const PRODUCT_CATALOG = {
  ENVELOPE_SIZES,
  MATERIAL_TYPES,
  extractGSM,
  getColorFromMaterial,
  getProductDisplayName,
  getMaterialBaseName
};

export default PRODUCT_CATALOG;
