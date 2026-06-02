const queueProcessor = require('../queues/queueProcessor');
const onReceiveQueue = require('../queues/onReceiveQueue');
const onCacheQueue = require('../queues/onCacheQueue');
const sequenceManager = require('../state/sequenceManager');

jest.mock('../state/sequenceManager');
jest.mock('../handlers/messageDispatcher');
jest.mock('../storage/redisRepository');

describe('Queue Processor Sequencing', () => {
  beforeEach(() => {
    onReceiveQueue.clear();
    onCacheQueue.clear();
    // Also reset queueProcessor pause state since it maintains state globally
    queueProcessor.resumeLiveProcessing(); // this clears pause
    onReceiveQueue.clear();
    onCacheQueue.clear();
    jest.clearAllMocks();
  });

  test('should process normal sequence correctly with RETRANS:OFF', async () => {
    sequenceManager.isRetransmissionEnabled.mockReturnValue(false);
    sequenceManager.getExpectedSequence.mockReturnValue(1);

    onReceiveQueue.push({ sequenceNo: 1, msgType: 'T' });
    onReceiveQueue.push({ sequenceNo: 3, msgType: 'S' }); // Gap, but RETRANS:OFF

    await queueProcessor.processQueues();

    // We expect processMessage to be called twice and expected seq synced
    expect(sequenceManager.setExpectedSequence).toHaveBeenCalledWith(3);
    expect(sequenceManager.incrementExpectedSequence).toHaveBeenCalledTimes(2);
  });

  test('should pause and request retrans when RETRANS:ON and gap detected', async () => {
    sequenceManager.isRetransmissionEnabled.mockReturnValue(true);
    sequenceManager.getExpectedSequence.mockReturnValue(1);

    const mockRetransCb = jest.fn();
    queueProcessor.setRetransmissionCallback(mockRetransCb);

    onReceiveQueue.push({ sequenceNo: 2, msgType: 'S' });

    await queueProcessor.processQueues();

    expect(mockRetransCb).toHaveBeenCalledWith(1, 1);
    expect(onReceiveQueue.length()).toBe(1); // Item remains in queue
  });

  test('should clear OnCache first when messages arrive', async () => {
    sequenceManager.isRetransmissionEnabled.mockReturnValue(true);

    // Mock the expected sequence incrementing to simulate state change dynamically
    let expectedSeq = 1;
    sequenceManager.getExpectedSequence.mockImplementation(() => expectedSeq);
    sequenceManager.incrementExpectedSequence.mockImplementation(() => {
        expectedSeq++;
    });

    onCacheQueue.push({ sequenceNo: 1, msgType: 'T' });
    onReceiveQueue.push({ sequenceNo: 2, msgType: 'S' });

    await queueProcessor.processQueues();

    expect(sequenceManager.incrementExpectedSequence).toHaveBeenCalledTimes(2);
    expect(onCacheQueue.length()).toBe(0);
    expect(onReceiveQueue.length()).toBe(0);
  });
});
