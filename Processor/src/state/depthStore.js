const { getState } = require('./stateManager');

function getDepth(orderBookId) {
  let depth = getState().fullMarketDepth.get(orderBookId);
  if (!depth) {
    depth = {
      orderBookId,
      buyPosted: [],
      sellPosted: []
    };
    getState().fullMarketDepth.set(orderBookId, depth);
  }
  return depth;
}

function getOrder(orderId) {
  return getState().orderItemList.get(orderId);
}

function setOrder(orderId, orderItem) {
  getState().orderItemList.set(orderId, orderItem);
}

function removeOrder(orderId) {
  getState().orderItemList.delete(orderId);
}

module.exports = {
  getDepth,
  getOrder,
  setOrder,
  removeOrder
};
