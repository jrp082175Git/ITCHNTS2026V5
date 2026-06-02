const { getOrder, removeOrder, getDepth } = require('../state/depthStore');
const { getOrderBook } = require('../state/orderBookStore');
const { addTrade } = require('../state/tradeStore');
const stateManager = require('../state/stateManager');
const { updateMarketDepth } = require('../utils/topDepthUtils');
const publishers = require('../publishers/relayPublisher');
const { broadcastDepth } = require('./handleOrderMessages');

function handleOrderExecuted(message) {
  // Case E
  const { sequenceNo, orderId, executedQuantity, matchId, nanos } = message;

  const orderItem = getOrder(orderId);
  if (!orderItem) return;

  const isBuy = orderItem.side === 'B';
  const depth = getDepth(orderItem.orderBookId);
  const targetArray = isBuy ? depth.buyPosted : depth.sellPosted;

  orderItem.quantity_match += executedQuantity;
  orderItem.quantity_leaves -= executedQuantity;

  let countChange = 0;
  if (orderItem.quantity_leaves <= 0) {
    countChange = -1;
    removeOrder(orderId);
  }

  updateMarketDepth(targetArray, orderItem.price, -executedQuantity, countChange, isBuy);
  broadcastDepth(sequenceNo, orderItem.orderBookId);

  // If printable logic was required for E, usually implicit unless specified.
  // Add to time and sales
  recordTrade(sequenceNo, orderItem.orderBookId, matchId, orderItem.price, executedQuantity, orderItem.side, 'Y', nanos);
}

function handleOrderExecutedWithPrice(message) {
  // Case C
  const { sequenceNo, orderId, executedQuantity, matchId, printable, executionPrice, nanos } = message;

  const orderItem = getOrder(orderId);
  if (!orderItem) return;

  const isBuy = orderItem.side === 'B';
  const depth = getDepth(orderItem.orderBookId);
  const targetArray = isBuy ? depth.buyPosted : depth.sellPosted;

  orderItem.quantity_match += executedQuantity;
  orderItem.quantity_leaves -= executedQuantity;

  let countChange = 0;
  if (orderItem.quantity_leaves <= 0) {
    countChange = -1;
    removeOrder(orderId);
  }

  // Reduce market depth at the original resting order price
  updateMarketDepth(targetArray, orderItem.price, -executedQuantity, countChange, isBuy);
  broadcastDepth(sequenceNo, orderItem.orderBookId);

  if (printable !== 'N') {
    recordTrade(sequenceNo, orderItem.orderBookId, matchId, executionPrice, executedQuantity, orderItem.side, printable, nanos);
  }
}

function handleTrade(message) {
  // Case P
  const { sequenceNo, orderBookId, matchId, side, quantity, price, tradeFlags, nanos } = message;
  // Evaluate printable from tradeFlags based on specification, assuming standard for now or explicitly N
  const printable = (tradeFlags && tradeFlags.includes('N')) ? 'N' : 'Y';

  if (printable !== 'N') {
    recordTrade(sequenceNo, orderBookId, matchId, price, quantity, side, printable, nanos);
  }
}

function recordTrade(sequenceNo, orderBookId, matchId, price, volume, side, printable, nanos) {
  const ob = getOrderBook(orderBookId) || {};

  const tradeRecord = {
    sequenceNo,
    msgType: 124, // or 123 for execution, normalizing to 124 for output ticker
    timeStamp: stateManager.getState().timeStamp,
    nanos,
    orderBookId,
    matchId,
    price,
    priceInDecimal: ob.priceDecimals,
    volume,
    side,
    buyer: side === 'B' ? 'SYSTEM' : 'SYSTEM', // Replace if attributions tracked
    seller: side === 'A' ? 'SYSTEM' : 'SYSTEM',
    printable,
    cross: 'N'
  };

  addTrade(orderBookId, tradeRecord);
  publishers.publishTimeAndSales(tradeRecord);
}

module.exports = {
  handleOrderExecuted,
  handleOrderExecutedWithPrice,
  handleTrade
};
