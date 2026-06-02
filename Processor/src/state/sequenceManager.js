const { logInfo, logWarn, logError } = require('../logging/logger');
const redisRepository = require('../storage/redisRepository');

let sequenceNo = 0;
let expectedSequenceNo = 1;
let retransmissionEnable = false;

async function initSequenceManager(startY, retransConfig) {
  retransmissionEnable = retransConfig;
  if (startY) {
    sequenceNo = 0;
    expectedSequenceNo = 1;
    await redisRepository.saveSequence(sequenceNo);
  } else {
    sequenceNo = await redisRepository.loadSequence();
    expectedSequenceNo = sequenceNo + 1;
    logInfo('Sequence Manager initialized from Redis', { sequenceNo, expectedSequenceNo });
  }
}

function getExpectedSequence() {
  return expectedSequenceNo;
}

function setExpectedSequence(seq) {
  expectedSequenceNo = seq;
}

async function incrementExpectedSequence() {
  expectedSequenceNo++;
  sequenceNo = expectedSequenceNo - 1;
  // In highly optimized systems, don't await this save sequentially on every tick.
  redisRepository.saveSequence(sequenceNo).catch(e => logError(e));
}

function isRetransmissionEnabled() {
  return retransmissionEnable;
}

module.exports = {
  initSequenceManager,
  getExpectedSequence,
  setExpectedSequence,
  incrementExpectedSequence,
  isRetransmissionEnabled
};
