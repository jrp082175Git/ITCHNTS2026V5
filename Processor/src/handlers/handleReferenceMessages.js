const { setOrderBook, updateOrderBook, getOrderBook } = require('../state/orderBookStore');
const { getDepth } = require('../state/depthStore');
const { getSalesList } = require('../state/tradeStore');
const stateManager = require('../state/stateManager');
const publishers = require('../publishers/relayPublisher');

function handleOrderBookDirectory(message) {
  // Case R
  const orderBookId = message.orderBookId;
  const { messageType, nanos, ...orderBookData } = message;

  setOrderBook(orderBookId, orderBookData);

  // Initialize depth and sales list natively within their store functions
  getDepth(orderBookId);
  getSalesList(orderBookId);

  publishers.publishOrderBook({
    sequenceNo: message.sequenceNo,
    msgType: 121,
    orderBookId,
    priceInDecimal: message.priceDecimals,
    symbol: message.symbol,
    name: message.symbol, // or long name if present
    mode: 4,
    buyPosted: [],
    sellPosted: []
  });
}

function handleOrderBookDirectoryExtension(message) {
  // Case X
  const orderBookId = message.orderBookId;
  const { messageType, nanos, ...updates } = message;
  updateOrderBook(orderBookId, updates);
}

function handleCombinationOrderBookLeg(message) {
  // Case M
  const orderBookId = message.orderBookId;
  const { messageType, nanos, ...legInfo } = message;

  const existing = getOrderBook(orderBookId) || {};
  if (!existing.legs) existing.legs = [];
  existing.legs.push(legInfo);
  updateOrderBook(orderBookId, { legs: existing.legs });
}

function handleTickSizeTable(message) {
  // Case L
  const { messageType, nanos, ...tickData } = message;
  // Key by orderBookId + price range (or just store array if no complex query needed immediately)
  const key = `${message.orderBookId}_${message.tickSizeValue}`;
  stateManager.getState().tickSizeTable.set(key, tickData);
}

module.exports = {
  handleOrderBookDirectory,
  handleOrderBookDirectoryExtension,
  handleCombinationOrderBookLeg,
  handleTickSizeTable
};
