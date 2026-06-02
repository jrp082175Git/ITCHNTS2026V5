const { publish } = require('./socketIoServer');

// Centralize message dispatching to clients (Socket.IO or other internal publishers)

function publishMarketDepth(msg) {
  publish('marketDepth', msg);
}

function publishTopMarketDepth(msg) {
  publish('topMarketDepth', msg);
}

function publishTimeAndSales(msg) {
  publish('timeAndSales', msg);
}

function publishOrderBook(msg) {
  publish('orderBook', msg);
}

function publishSystemEvent(msg) {
  publish('systemEvent', msg);
}

function publishOrderBookState(msg) {
  publish('orderBookState', msg);
}

function publishEquilibriumPrice(msg) {
  publish('equilibriumPrice', msg);
}

function publishSequenceGap(msg) {
  publish('sequenceGap', msg);
}

module.exports = {
  publishMarketDepth,
  publishTopMarketDepth,
  publishTimeAndSales,
  publishOrderBook,
  publishSystemEvent,
  publishOrderBookState,
  publishEquilibriumPrice,
  publishSequenceGap
};
