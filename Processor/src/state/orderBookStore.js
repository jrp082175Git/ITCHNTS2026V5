const { getState } = require('./stateManager');

function getOrderBook(orderBookId) {
  return getState().orderBookList.get(orderBookId);
}

function setOrderBook(orderBookId, orderBook) {
  getState().orderBookList.set(orderBookId, orderBook);
}

function updateOrderBook(orderBookId, updates) {
  const existing = getOrderBook(orderBookId) || {};
  const updated = { ...existing, ...updates };
  setOrderBook(orderBookId, updated);
  return updated;
}

module.exports = {
  getOrderBook,
  setOrderBook,
  updateOrderBook
};
