const { getState } = require('./stateManager');

function getSalesList(orderBookId) {
  let sales = getState().timeAndSales.get(orderBookId);
  if (!sales) {
    sales = {
      orderBookId,
      timeAndSalesList: []
    };
    getState().timeAndSales.set(orderBookId, sales);
  }
  return sales;
}

function addTrade(orderBookId, tradeRecord) {
  const sales = getSalesList(orderBookId);
  // Avoid duplicate checking logic here. We can key by matchId + sequenceNo if needed.
  // For simplicity, just append.
  sales.timeAndSalesList.push(tradeRecord);
}

module.exports = {
  getSalesList,
  addTrade
};
