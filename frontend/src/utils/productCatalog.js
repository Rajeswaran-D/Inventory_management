/**
 * Frontend Product Catalog - Shared constants for UI
 */

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

/**
 * Extract GSM from material type string
 * @param {string} materialType - e.g., "Maplitho 80 GSM"
 * @returns {number|null} - GSM value or null
 */
export const extractGSM = (materialType) => {
  const gsmMatch = materialType.match(/(\d+)\s*GSM/i);
  return gsmMatch ? parseInt(gsmMatch[1], 10) : null;
};

/**
 * Get color from material type
 * @param {string} materialType - e.g., "Vibothi Cover White"
 * @returns {string|null} - "White", "Color", or null
 */
export const getColorFromMaterial = (materialType) => {
  if (materialType.includes("Vibothi")) {
    if (materialType.includes("White")) return "White";
    if (materialType.includes("Color")) return "Color";
  }
  return null;
};

/**
 * Format product display name
 * @param {string} size
 * @param {string} materialType
 * @returns {string} - e.g., "9x4 | Maplitho 80 GSM"
 */
export const getProductDisplayName = (size, materialType) => {
  return `${size} | ${materialType}`;
};

/**
 * Get a product identifier key
 * @param {string} size
 * @param {string} materialType
 * @returns {string}
 */
export const getProductKey = (size, materialType) => {
  return `${size}|${materialType}`;
};

export default {
  ENVELOPE_SIZES,
  MATERIAL_TYPES,
  extractGSM,
  getColorFromMaterial,
  getProductDisplayName,
  getProductKey
};
