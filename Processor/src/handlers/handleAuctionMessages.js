const publishers = require('../publishers/relayPublisher');
const { getOrderBook } = require('../state/orderBookStore');
const stateManager = require('../state/stateManager');

function handleEquilibriumPrice(message) {
  // Case Z
  const { sequenceNo, orderBookId, equilibriumPrice, bidQuantity, askQuantity, imbalanceQuantity, imbalanceDirection, nanos } = message;

  const ob = getOrderBook(orderBookId) || {};

  publishers.publishEquilibriumPrice({
    sequenceNo,
    msgType: 125,
    timeStamp: stateManager.getState().timeStamp,
    nanos,
    orderBookId,
    bidQuantity,
    askQuantity,
    price: equilibriumPrice,
    priceInDecimal: ob.priceDecimals,
    // Add logic to calculate bestBidPrice/bestAskPrice from market depth if needed
    bestBidPrice: 0,
    bestAskPrice: 0,
    bestBidQuantity: 0,
    bestAskQuantity: 0
  });
}

module.exports = {
  handleEquilibriumPrice
};
