const { logInfo, logWarn, logError } = require('../logging/logger');
const redisRepository = require('../storage/redisRepository');

const state = {
  orderBookList: new Map(),
  fullMarketDepth: new Map(),
  timeAndSales: new Map(),
  orderItemList: new Map(),
  tickSizeTable: new Map(),
  systemEvent: {},
  timeStamp: null
};

async function initializeState(startY) {
  if (startY) {
    logInfo('START:Y requested. Initializing empty processor state and clearing Redis.');
    await resetState();
  } else {
    logInfo('START:N requested. Loading state from Redis.');
    state.orderBookList = await redisRepository.loadState('orderBookList', true) || new Map();
    state.fullMarketDepth = await redisRepository.loadState('fullMarketDepth', true) || new Map();
    state.timeAndSales = await redisRepository.loadState('timeAndSales', true) || new Map();
    state.orderItemList = await redisRepository.loadState('orderItemList', true) || new Map();
    state.tickSizeTable = await redisRepository.loadState('tickSizeTable', true) || new Map();
    state.systemEvent = await redisRepository.loadState('systemEvent') || {};

    // TimeStamp isn't strictly recovered unless we persist it. Let's assume it recovers from next T msg.
    logInfo('State loaded successfully.');
  }
}

async function resetState() {
  state.orderBookList.clear();
  state.fullMarketDepth.clear();
  state.timeAndSales.clear();
  state.orderItemList.clear();
  state.tickSizeTable.clear();
  state.systemEvent = {};
  state.timeStamp = null;
  await redisRepository.clearProcessorKeys();
}

function getState() {
  return state;
}

async function persistSnapshot() {
  try {
    await redisRepository.saveState('orderBookList', state.orderBookList);
    await redisRepository.saveState('fullMarketDepth', state.fullMarketDepth);
    await redisRepository.saveState('timeAndSales', state.timeAndSales);
    await redisRepository.saveState('orderItemList', state.orderItemList);
    await redisRepository.saveState('tickSizeTable', state.tickSizeTable);
    await redisRepository.saveState('systemEvent', state.systemEvent);
  } catch (err) {
    logError('Error persisting snapshot', { error: err.message });
  }
}

module.exports = {
  initializeState,
  resetState,
  getState,
  persistSnapshot
};
