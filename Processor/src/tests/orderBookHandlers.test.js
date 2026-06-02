const { handleAddOrder, handleDeleteOrder } = require('../handlers/handleOrderMessages');
const stateManager = require('../state/stateManager');
const depthStore = require('../state/depthStore');

jest.mock('../publishers/relayPublisher');

describe('Order Handlers', () => {
  beforeEach(() => {
    stateManager.getState().orderItemList.clear();
    stateManager.getState().fullMarketDepth.clear();
  });

  test('handleAddOrder should add to depth', () => {
    const msg = {
      sequenceNo: 1,
      orderId: '123',
      orderBookId: 10,
      side: 'B',
      orderQuantity: 100,
      price: 50.5,
      nanos: 0
    };

    handleAddOrder(msg);

    const order = depthStore.getOrder('123');
    expect(order).toBeDefined();
    expect(order.quantity).toBe(100);

    const depth = depthStore.getDepth(10);
    expect(depth.buyPosted.length).toBe(1);
    expect(depth.buyPosted[0].price).toBe(50.5);
    expect(depth.buyPosted[0].volume).toBe(100);
  });

  test('handleDeleteOrder should remove from depth', () => {
    const addMsg = {
      sequenceNo: 1,
      orderId: '123',
      orderBookId: 10,
      side: 'S',
      orderQuantity: 100,
      price: 50.5,
      nanos: 0
    };
    handleAddOrder(addMsg);

    const delMsg = {
      sequenceNo: 2,
      orderId: '123'
    };
    handleDeleteOrder(delMsg);

    const order = depthStore.getOrder('123');
    expect(order).toBeUndefined(); // removed

    const depth = depthStore.getDepth(10);
    expect(depth.sellPosted.length).toBe(0); // removed price level
  });
});
