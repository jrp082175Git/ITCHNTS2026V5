function normalizeSide(side) {
  if (!side) return 'UNKNOWN';
  const s = side.toUpperCase().trim();
  if (['B', 'BID', 'BUY'].includes(s)) return 'B';
  if (['A', 'ASK', 'SELL', 'S'].includes(s)) return 'A';
  return s;
}

function normalizeMessageFields(msg) {
  // Normalize casing differences between versions/receivers
  const normalized = { ...msg };
  if (normalized.OrderId && !normalized.orderId) normalized.orderId = normalized.OrderId;
  if (normalized.OrderBookId && !normalized.orderBookId) normalized.orderBookId = normalized.OrderBookId;
  if (normalized.Quantity && !normalized.quantity) normalized.quantity = normalized.Quantity;
  if (normalized.Price && !normalized.price) normalized.price = normalized.Price;
  return normalized;
}

module.exports = {
  normalizeSide,
  normalizeMessageFields
};
