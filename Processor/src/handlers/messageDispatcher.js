const { handleTimeMessage } = require('./handleTimeMessage');
const { handleOrderBookDirectory, handleOrderBookDirectoryExtension, handleCombinationOrderBookLeg, handleTickSizeTable } = require('./handleReferenceMessages');
const { handleSystemEvent, handleOrderBookState } = require('./handleEventMessages');
const { handleAddOrder, handleDeleteOrder } = require('./handleOrderMessages');
const { handleOrderExecuted, handleOrderExecutedWithPrice, handleTrade } = require('./handleTradeMessages');
const { handleEquilibriumPrice } = require('./handleAuctionMessages');
const { normalizeMessageFields } = require('../utils/validationUtils');

function dispatch(rawMessage) {
  const msg = normalizeMessageFields(rawMessage);

  switch (msg.messageType) {
    case 'T': handleTimeMessage(msg); break;
    case 'R': handleOrderBookDirectory(msg); break;
    case 'X': handleOrderBookDirectoryExtension(msg); break;
    case 'M': handleCombinationOrderBookLeg(msg); break;
    case 'L': handleTickSizeTable(msg); break;
    case 'S': handleSystemEvent(msg); break;
    case 'O': handleOrderBookState(msg); break;
    case 'A':
    case 'F': handleAddOrder(msg); break;
    case 'E': handleOrderExecuted(msg); break;
    case 'C': handleOrderExecutedWithPrice(msg); break;
    case 'D': handleDeleteOrder(msg); break;
    case 'P': handleTrade(msg); break;
    case 'Z': handleEquilibriumPrice(msg); break;
    // Glimpse 'G' or others omitted if not explicitly handled
    default:
      // Unhandled
      break;
  }
}

module.exports = {
  dispatch
};
