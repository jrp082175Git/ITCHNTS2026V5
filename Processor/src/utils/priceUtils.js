function formatPrice(price, decimals) {
  if (price === undefined || price === null) return price;
  // If price is already formatted by receiver (as float), this might just be a pass-through
  // or formatting helper.
  return Number(price).toFixed(decimals || 8); // fallback 8
}

module.exports = {
  formatPrice
};
