function normalizeOptionalValue(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return value;
}

function buildVariantKey(productId, gsm, size, color) {
  return [
    productId,
    normalizeOptionalValue(gsm) ?? '',
    normalizeOptionalValue(size) ?? '',
    normalizeOptionalValue(color) ?? '',
  ].join('|');
}

function buildVariantDisplayName(product, { gsm, size, color }) {
  const parts = [product.name];

  if (product.hasGSM && normalizeOptionalValue(gsm) !== null) {
    parts.push(`${gsm} GSM`);
  }
  if (product.hasSize && normalizeOptionalValue(size) !== null) {
    parts.push(size);
  }
  if (product.hasColor && normalizeOptionalValue(color) !== null) {
    parts.push(color);
  }

  return parts.join(' | ');
}

function buildVariantSku(productName, gsm, size, color) {
  const productPart = String(productName || 'PRD').slice(0, 3).toUpperCase();
  const gsmPart = normalizeOptionalValue(gsm) !== null ? `${gsm}G` : 'NoGSM';
  const sizePart = normalizeOptionalValue(size) !== null ? String(size).replace(/\s+/g, '').slice(0, 12) : 'NoSize';
  const colorPart = normalizeOptionalValue(color) !== null ? String(color).replace(/\s+/g, '').slice(0, 6) : 'X';

  return `${productPart}-${gsmPart}-${sizePart}-${colorPart}`;
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
}

module.exports = {
  normalizeOptionalValue,
  buildVariantKey,
  buildVariantDisplayName,
  buildVariantSku,
  toArray,
};
