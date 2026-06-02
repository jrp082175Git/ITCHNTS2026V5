const stateManager = require('../state/stateManager');
const { updateOrderBook } = require('../state/orderBookStore');
const publishers = require('../publishers/relayPublisher');

function handleSystemEvent(message) {
  // Case S
  const { messageType, nanos, ...eventData } = message;

  const state = stateManager.getState();
  state.systemEvent = {
    event: message.eventCode,
    ...eventData
  };

  publishers.publishSystemEvent({
    sequenceNo: message.sequenceNo,
    msgType: 122,
    event: message.eventCode
  });
}

function handleOrderBookState(message) {
  // Case O
  const { messageType, nanos, orderBookId, stateName } = message;

  updateOrderBook(orderBookId, { stateName });

  publishers.publishOrderBookState({
    sequenceNo: message.sequenceNo,
    msgType: 123,
    orderBookId,
    stateName
  });
}

module.exports = {
  handleSystemEvent,
  handleOrderBookState
};
