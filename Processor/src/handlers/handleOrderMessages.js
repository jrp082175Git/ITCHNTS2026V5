const { getOrder, setOrder, removeOrder, getDepth } = require('../state/depthStore');
const { getOrderBook } = require('../state/orderBookStore');
const stateManager = require('../state/stateManager');
const { updateMarketDepth, updateTop5 } = require('../utils/topDepthUtils');
const { normalizeSide } = require('../utils/validationUtils');
const publishers = require('../publishers/relayPublisher');

function broadcastDepth(sequenceNo, orderBookId) {
  const depth = getDepth(orderBookId);
  const ob = getOrderBook(orderBookId) || {};

  publishers.publishMarketDepth({
    sequenceNo,
    msgType: 121,
    orderBookId,
    priceInDecimal: ob.priceDecimals,
    symbol: ob.symbol,
    name: ob.symbol,
    mode: 2, // Mode could be mapped properly
    buyPosted: depth.buyPosted,
    sellPosted: depth.sellPosted
  });

  publishers.publishTopMarketDepth({
    sequenceNo,
    msgType: 122,
    orderBookId,
    priceInDecimal: ob.priceDecimals,
    symbol: ob.symbol,
    name: ob.symbol,
    buyPosted: updateTop5(depth.buyPosted),
    sellPosted: updateTop5(depth.sellPosted)
  });
}

function handleAddOrder(message) {
  // Case A & F
  const { sequenceNo, orderId, orderBookId, side, orderQuantity, price, nanos, attribution } = message;

  const normSide = normalizeSide(side);
  const isBuy = normSide === 'B';

  const orderItem = {
    orderId,
    orderBookId,
    side: normSide,
    quantity: orderQuantity,
    price,
    timestamp: stateManager.getState().timeStamp,
    nanos,
    quantity_leaves: orderQuantity,
    quantity_match: 0,
    attribution
  };

  setOrder(orderId, orderItem);

  const depth = getDepth(orderBookId);
  const targetArray = isBuy ? depth.buyPosted : depth.sellPosted;

  updateMarketDepth(targetArray, price, orderQuantity, 1, isBuy);
  broadcastDepth(sequenceNo, orderBookId);
}

function handleDeleteOrder(message) {
  // Case D
  const { sequenceNo, orderId } = message;

  const orderItem = getOrder(orderId);
  if (!orderItem) return;

  const isBuy = orderItem.side === 'B';
  const depth = getDepth(orderItem.orderBookId);
  const targetArray = isBuy ? depth.buyPosted : depth.sellPosted;

  updateMarketDepth(targetArray, orderItem.price, -orderItem.quantity_leaves, -1, isBuy);

  orderItem.quantity_leaves = 0;
  removeOrder(orderId);

  broadcastDepth(sequenceNo, orderItem.orderBookId);
}

module.exports = {
  handleAddOrder,
  handleDeleteOrder,
  broadcastDepth
};
