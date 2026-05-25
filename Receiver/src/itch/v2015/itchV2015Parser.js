const BufferReader = require('../bufferReader');
const { MESSAGE_TYPES } = require('./itchV2015Schemas');
const { logError } = require('../../logging/logger');

const decimalsMap = new Map();

function parse(buffer) {
  if (buffer.length < 1) return null;

  const reader = new BufferReader(buffer);
  const messageType = reader.readAlpha(1);

  try {
    switch (messageType) {
      case MESSAGE_TYPES.TIME_STAMP:
        return {
          messageType,
          second: reader.readUInt32BE()
        };
      case MESSAGE_TYPES.SYSTEM_EVENT:
        return {
          messageType,
          eventCode: reader.readAlpha(1)
        };
      case MESSAGE_TYPES.TRADING_SCHEDULE:
        return {
          messageType,
          eventCode: reader.readAlpha(1)
        };
      case MESSAGE_TYPES.PRICE_TICK_SIZE:
        return {
          messageType,
          orderBookId: reader.readUInt32BE(),
          tickSizeValue: reader.readUInt32BE(),
          priceFrom: reader.readPriceV2015(4),
          priceTo: reader.readPriceV2015(4)
        };
      case MESSAGE_TYPES.QUANTITY_TICK_SIZE:
        return {
          messageType,
          orderBookId: reader.readUInt32BE(),
          quantityTickSize: reader.readUInt32BE(),
          quantityFrom: reader.readUInt32BE(),
          quantityTo: reader.readUInt32BE()
        };
      case MESSAGE_TYPES.ORDERBOOK_DIRECTORY: {
        const msg = {
          messageType,
          orderBookId: reader.readUInt32BE(),
          symbol: reader.readAlpha(12),
          isin: reader.readAlpha(12),
          currency: reader.readAlpha(3),
          roundLotSize: reader.readUInt32BE(),
          priceDecimals: reader.readUInt16BE()
        };
        decimalsMap.set(msg.orderBookId, msg.priceDecimals);
        return msg;
      }
      case MESSAGE_TYPES.ORDERBOOK_RESTRICTIONS:
        return {
          messageType,
          orderBookId: reader.readUInt32BE(),
          restricted: reader.readAlpha(1)
        };
      case MESSAGE_TYPES.INDEX_MEMBER:
        return {
          messageType,
          indexOrderBookId: reader.readUInt32BE(),
          memberOrderBookId: reader.readUInt32BE(),
          weight: reader.readUInt32BE()
        };
      case MESSAGE_TYPES.INDEX_VALUE:
        return {
          messageType,
          indexOrderBookId: reader.readUInt32BE(),
          value: reader.readPriceV2015(4)
        };
      case MESSAGE_TYPES.ORDERBOOK_TRADING_ACTION:
        return {
          messageType,
          orderBookId: reader.readUInt32BE(),
          tradingState: reader.readAlpha(1)
        };
      case MESSAGE_TYPES.ADD_ORDER: {
        const orderBookId = reader.readUInt32BE();
        const decimals = decimalsMap.get(orderBookId) || 4;
        return {
          messageType,
          orderBookId,
          orderId: reader.readBigUInt64BE().toString(),
          side: reader.readAlpha(1),
          orderQuantity: Number(reader.readBigUInt64BE()),
          price: reader.readPriceV2015(decimals)
        };
      }
      case MESSAGE_TYPES.ORDER_EXECUTED:
        return {
          messageType,
          orderId: reader.readBigUInt64BE().toString(),
          executedQuantity: Number(reader.readBigUInt64BE()),
          matchId: reader.readBigUInt64BE().toString()
        };
      case MESSAGE_TYPES.ORDER_EXECUTED_BROKER:
        return {
          messageType,
          orderId: reader.readBigUInt64BE().toString(),
          executedQuantity: Number(reader.readBigUInt64BE()),
          matchId: reader.readBigUInt64BE().toString(),
          printable: reader.readAlpha(1),
          brokerId: reader.readAlpha(4)
        };
      case MESSAGE_TYPES.ORDER_EXECUTED_PRICE:
        return {
          messageType,
          orderId: reader.readBigUInt64BE().toString(),
          executedQuantity: Number(reader.readBigUInt64BE()),
          matchId: reader.readBigUInt64BE().toString(),
          printable: reader.readAlpha(1),
          executionPrice: reader.readPriceV2015(4)
        };
      case MESSAGE_TYPES.ORDER_EXECUTED_PRICE_BROKER:
        return {
          messageType,
          orderId: reader.readBigUInt64BE().toString(),
          executedQuantity: Number(reader.readBigUInt64BE()),
          matchId: reader.readBigUInt64BE().toString(),
          printable: reader.readAlpha(1),
          executionPrice: reader.readPriceV2015(4),
          brokerId: reader.readAlpha(4)
        };
      case MESSAGE_TYPES.BROKEN_TRADE:
        return {
          messageType,
          matchId: reader.readBigUInt64BE().toString()
        };
      case MESSAGE_TYPES.ORDER_DELETE:
        return {
          messageType,
          orderId: reader.readBigUInt64BE().toString()
        };
      case MESSAGE_TYPES.ORDER_REPLACE: {
        const orderBookId = reader.readUInt32BE();
        const decimals = decimalsMap.get(orderBookId) || 4;
        return {
          messageType,
          originalOrderId: reader.readBigUInt64BE().toString(),
          newOrderId: reader.readBigUInt64BE().toString(),
          orderQuantity: Number(reader.readBigUInt64BE()),
          price: reader.readPriceV2015(decimals)
        };
      }
      case MESSAGE_TYPES.INDICATIVE_PRICE_QTY: {
        const orderBookId = reader.readUInt32BE();
        const decimals = decimalsMap.get(orderBookId) || 4;
        return {
          messageType,
          orderBookId,
          indicativePrice: reader.readPriceV2015(decimals),
          indicativeQuantity: Number(reader.readBigUInt64BE())
        };
      }
      case MESSAGE_TYPES.TRADE: {
        const orderBookId = reader.readUInt32BE();
        const decimals = decimalsMap.get(orderBookId) || 4;
        return {
          messageType,
          orderBookId,
          matchId: reader.readBigUInt64BE().toString(),
          side: reader.readAlpha(1),
          quantity: Number(reader.readBigUInt64BE()),
          price: reader.readPriceV2015(decimals)
        };
      }
      case MESSAGE_TYPES.TRADE_BROKER: {
        const orderBookId = reader.readUInt32BE();
        const decimals = decimalsMap.get(orderBookId) || 4;
        return {
          messageType,
          orderBookId,
          matchId: reader.readBigUInt64BE().toString(),
          side: reader.readAlpha(1),
          quantity: Number(reader.readBigUInt64BE()),
          price: reader.readPriceV2015(decimals),
          brokerId: reader.readAlpha(4)
        };
      }
      case MESSAGE_TYPES.FOREIGN_SHARES:
        return {
          messageType,
          orderBookId: reader.readUInt32BE(),
          foreignSharesAvailable: Number(reader.readBigUInt64BE())
        };
      case MESSAGE_TYPES.BBO_QUOTATION: {
        const orderBookId = reader.readUInt32BE();
        const decimals = decimalsMap.get(orderBookId) || 4;
        return {
          messageType,
          orderBookId,
          bestBidPrice: reader.readPriceV2015(decimals),
          bestBidSize: Number(reader.readBigUInt64BE()),
          bestAskPrice: reader.readPriceV2015(decimals),
          bestAskSize: Number(reader.readBigUInt64BE())
        };
      }
      case MESSAGE_TYPES.NEWS_ITEM:
        return {
          messageType,
          orderBookId: reader.readUInt32BE(),
          newsText: reader.readAlpha(reader.getRemaining())
        };
      default:
        return {
          messageType,
          rawPayloadHex: reader.buffer.toString('hex', 1)
        };
    }
  } catch (err) {
    logError('Error parsing V2015 ITCH message', { messageType, error: err.message });
    return { messageType, error: err.message, raw: buffer.toString('hex') };
  }
}

module.exports = { parse };
