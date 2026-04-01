/**
 * Frontend Product Data Configuration
 * Mirrors backend structure for UI components
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
 */
export const getGsmVariants = (material) => {
  return MATERIAL_CONFIG[material]?.gsm || null;
};

/**
 * Check if material requires color selection
 */
export const requiresColor = (material) => {
  return MATERIAL_CONFIG[material]?.requiresColor || false;
};

/**
 * Get color options for material
 */
export const getColorOptions = (material) => {
  return MATERIAL_CONFIG[material]?.colors || null;
};

/**
 * Get available sizes for material
 */
export const getAvailableSizes = (material) => {
  const config = MATERIAL_CONFIG[material];
  if (config?.sizeRestriction === "Standard") {
    return ["Standard"];
  }
  return ENVELOPE_SIZES;
};

/**
 * Format product display name
 */
export const formatProductName = (material, size, gsm, color) => {
  const parts = [size, material];
  if (gsm) parts.push(`${gsm} GSM`);
  if (color) parts.push(color);
  return parts.join(" | ");
};
