/**
 * GST CALCULATION UTILITIES
 * Handles CGST, SGST, IGST calculations for invoices
 */

/**
 * Calculate CGST (Central Goods and Services Tax) - 9%
 */
export const calculateCGST = (subtotal, cgstRate = 9) => {
  return parseFloat(((subtotal * cgstRate) / 100).toFixed(2));
};

/**
 * Calculate SGST (State Goods and Services Tax) - 9%
 */
export const calculateSGST = (subtotal, sgstRate = 9) => {
  return parseFloat(((subtotal * sgstRate) / 100).toFixed(2));
};

/**
 * Calculate total tax (CGST + SGST)
 */
export const calculateTotalTax = (subtotal, cgstRate = 9, sgstRate = 9) => {
  const cgst = calculateCGST(subtotal, cgstRate);
  const sgst = calculateSGST(subtotal, sgstRate);
  return parseFloat((cgst + sgst).toFixed(2));
};

/**
 * Calculate grand total with taxes
 */
export const calculateGrandTotal = (subtotal, cgstRate = 9, sgstRate = 9, roundOff = 0) => {
  const cgst = calculateCGST(subtotal, cgstRate);
  const sgst = calculateSGST(subtotal, sgstRate);
  const total = parseFloat((subtotal + cgst + sgst + roundOff).toFixed(2));
  return total;
};

/**
 * Calculate round-off amount to nearest rupee
 * If total is 1234.45, round off will adjust to 1234.00, 1235.00, etc
 */
export const calculateRoundOff = (subtotal, cgstRate = 9, sgstRate = 9) => {
  const cgst = calculateCGST(subtotal, cgstRate);
  const sgst = calculateSGST(subtotal, sgstRate);
  const total = subtotal + cgst + sgst;
  const rounded = Math.round(total);
  const roundOff = parseFloat((rounded - total).toFixed(2));
  return roundOff;
};

/**
 * Complete tax breakdown
 */
export const calculateTaxBreakdown = (subtotal, cgstRate = 9, sgstRate = 9) => {
  const cgst = calculateCGST(subtotal, cgstRate);
  const sgst = calculateSGST(subtotal, sgstRate);
  const roundOff = calculateRoundOff(subtotal, cgstRate, sgstRate);
  const grandTotal = calculateGrandTotal(subtotal, cgstRate, sgstRate, roundOff);

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    cgst,
    sgst,
    totalTax: parseFloat((cgst + sgst).toFixed(2)),
    roundOff,
    grandTotal
  };
};

export default {
  calculateCGST,
  calculateSGST,
  calculateTotalTax,
  calculateGrandTotal,
  calculateRoundOff,
  calculateTaxBreakdown
};
