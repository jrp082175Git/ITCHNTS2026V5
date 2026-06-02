const onReceiveQueue = require('./onReceiveQueue');
const onCacheQueue = require('./onCacheQueue');
const sequenceManager = require('../state/sequenceManager');
const messageDispatcher = require('../handlers/messageDispatcher');
const redisRepository = require('../storage/redisRepository');
const { logInfo, logWarn, logError } = require('../logging/logger');
let requestRetransmissionCb = null;

let isProcessing = false;
let isPaused = false; // Paused when requesting retransmission

function setRetransmissionCallback(cb) {
  requestRetransmissionCb = cb;
}

function pauseLiveProcessing() {
  isPaused = true;
}

function resumeLiveProcessing() {
  isPaused = false;
  processQueues();
}

async function processMessage(msg) {
  try {
    messageDispatcher.dispatch(msg);
    await redisRepository.markMessageProcessed(msg.sequenceNo, msg);
    await sequenceManager.incrementExpectedSequence();
  } catch (err) {
    logError('Error processing message', { sequenceNo: msg.sequenceNo, error: err.message });
  }
}

async function processQueues() {
  if (isProcessing) return;
  isProcessing = true;

  while (true) {
    // 1. Prioritize OnCache (Retransmitted messages)
    if (onCacheQueue.length() > 0) {
      const msg = onCacheQueue.shift();
      // Only process if it matches expected
      const expected = sequenceManager.getExpectedSequence();
      if (msg.sequenceNo === expected || !sequenceManager.isRetransmissionEnabled()) {
        await processMessage(msg);
      } else if (msg.sequenceNo < expected) {
        logWarn(`Skipping duplicate cached message`, { seq: msg.sequenceNo, expected });
      } else {
         // Gap in cache. Rare, but means we need another request.
         logWarn(`Gap in cache detected. Need ${expected}, got ${msg.sequenceNo}`);
         onCacheQueue.clear();
         if (requestRetransmissionCb && sequenceManager.isRetransmissionEnabled()) {
             pauseLiveProcessing();
             requestRetransmissionCb(expected, msg.sequenceNo - 1);
         }
         break;
      }
      continue; // loop again to keep checking cache until empty
    }

    // 2. If OnCache is empty and we were paused, we can resume.
    if (isPaused) {
      break;
    }

    // 3. Process OnReceive
    if (onReceiveQueue.length() > 0) {
      const msg = onReceiveQueue.peek(); // Peek before shifting to handle gaps
      const expected = sequenceManager.getExpectedSequence();

      if (sequenceManager.isRetransmissionEnabled()) {
        if (msg.sequenceNo === expected) {
          onReceiveQueue.shift(); // remove from queue
          await processMessage(msg);
        } else if (msg.sequenceNo > expected) {
          logWarn(`Sequence gap detected. Expected ${expected}, got ${msg.sequenceNo}`);
          pauseLiveProcessing();
          if (requestRetransmissionCb) {
            requestRetransmissionCb(expected, msg.sequenceNo - 1);
          }
          break; // Stop processing receive queue, wait for cache
        } else {
          // Late or duplicate
          logWarn(`Duplicate or late message skipped`, { received: msg.sequenceNo, expected });
          onReceiveQueue.shift(); // Discard
        }
      } else {
        // RETRANS:OFF
        onReceiveQueue.shift();
        if (msg.sequenceNo !== expected) {
          logWarn(`Sequence gap skipped (RETRANS:OFF). Expected ${expected}, got ${msg.sequenceNo}`);
          sequenceManager.setExpectedSequence(msg.sequenceNo); // Force sync
        }
        await processMessage(msg);
      }
    } else {
      break; // Both queues empty
    }
  }

  isProcessing = false;
}

module.exports = {
  setRetransmissionCallback,
  processQueues,
  pauseLiveProcessing,
  resumeLiveProcessing
};
