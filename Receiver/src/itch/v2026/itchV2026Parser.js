const BufferReader = require('../bufferReader');
const { MESSAGE_TYPES } = require('./itchV2026Schemas');
const { logError } = require('../../logging/logger');

// Store decimals mapped by orderBookId, default 8
const decimalsMap = new Map();

function parse(buffer) {
  if (buffer.length < 1) return null;

  const reader = new BufferReader(buffer);
  const messageType = reader.readAlpha(1);

  try {
    switch (messageType) {
      case MESSAGE_TYPES.SECONDS:
        return {
          messageType,
          second: reader.readUInt32BE()
        };
      case MESSAGE_TYPES.DIRECTORY: {
        const msg = {
          messageType,
          orderBookId: reader.readUInt32BE(),
          symbol: reader.readAlpha(16),
          isin: reader.readAlpha(12),
          financialProduct: reader.readUInt8(),
          tradingCurrency: reader.readAlpha(3),
          mic: reader.readAlpha(4),
          routingStrategy: reader.readAlpha(1),
          priceDecimals: reader.readUInt16BE(),
          quantityDecimals: reader.readUInt16BE(),
          roundLotSize: Number(reader.readBigUInt64BE()),
          roundLotMaxAmount: Number(reader.readBigUInt64BE()),
          settlementDate: reader.readUInt32BE()
        };
        decimalsMap.set(msg.orderBookId, msg.priceDecimals);
        return msg;
      }
      case MESSAGE_TYPES.DIRECTORY_EXT:
        return {
          messageType,
          orderBookId: reader.readUInt32BE(),
          lotType: reader.readUInt8(),
          upperBandPrice: reader.readPriceV2026(8),
          lowerBandPrice: reader.readPriceV2026(8)
        };
      case MESSAGE_TYPES.COMBINATION_LEG:
        return {
          messageType,
          orderBookId: reader.readUInt32BE(),
          legOrderBookId: reader.readUInt32BE(),
          legRatio: reader.readUInt32BE(),
          legSide: reader.readAlpha(1)
        };
      case MESSAGE_TYPES.TICK_SIZE:
        return {
          messageType,
          orderBookId: reader.readUInt32BE(),
          tickSizeValue: Number(reader.readBigUInt64BE()),
          priceFrom: reader.readPriceV2026(8),
          priceTo: reader.readPriceV2026(8)
        };
      case MESSAGE_TYPES.SYSTEM_EVENT:
        return {
          messageType,
          eventCode: reader.readAlpha(1)
        };
      case MESSAGE_TYPES.ORDER_BOOK_STATE:
        return {
          messageType,
          orderBookId: reader.readUInt32BE(),
          stateName: reader.readAlpha(20)
        };
      case MESSAGE_TYPES.ADD_ORDER_ANONYMOUS: {
        const orderBookId = reader.readUInt32BE();
        const decimals = decimalsMap.get(orderBookId) || 8;
        return {
          messageType,
          orderBookId,
          orderId: reader.readBigUInt64BE().toString(),
          side: reader.readAlpha(1),
          orderQuantity: Number(reader.readBigUInt64BE()),
          price: reader.readPriceV2026(decimals)
        };
      }
      case MESSAGE_TYPES.ADD_ORDER_ATTRIBUTED: {
        const orderBookId = reader.readUInt32BE();
        const decimals = decimalsMap.get(orderBookId) || 8;
        return {
          messageType,
          orderBookId,
          orderId: reader.readBigUInt64BE().toString(),
          side: reader.readAlpha(1),
          orderQuantity: Number(reader.readBigUInt64BE()),
          price: reader.readPriceV2026(decimals),
          attribution: reader.readAlpha(4)
        };
      }
      case MESSAGE_TYPES.ORDER_EXECUTED:
        return {
          messageType,
          orderId: reader.readBigUInt64BE().toString(),
          executedQuantity: Number(reader.readBigUInt64BE()),
          matchId: reader.readBigUInt64BE().toString()
        };
      case MESSAGE_TYPES.ORDER_EXECUTED_PRICE: {
        const msg = {
            messageType,
            orderId: reader.readBigUInt64BE().toString(),
            executedQuantity: Number(reader.readBigUInt64BE()),
            matchId: reader.readBigUInt64BE().toString(),
            printable: reader.readAlpha(1),
            executionPrice: reader.readPriceV2026(8) // Assuming 8 decimals for execution price here if not mapped
        };
        return msg;
      }
      case MESSAGE_TYPES.ORDER_DELETE:
        return {
          messageType,
          orderId: reader.readBigUInt64BE().toString()
        };
      case MESSAGE_TYPES.TRADE: {
        const orderBookId = reader.readUInt32BE();
        const decimals = decimalsMap.get(orderBookId) || 8;
        return {
          messageType,
          orderBookId,
          matchId: reader.readBigUInt64BE().toString(),
          side: reader.readAlpha(1),
          quantity: Number(reader.readBigUInt64BE()),
          price: reader.readPriceV2026(decimals),
          tradeFlags: reader.readAlpha(4)
        };
      }
      case MESSAGE_TYPES.EQUILIBRIUM_PRICE: {
        const orderBookId = reader.readUInt32BE();
        const decimals = decimalsMap.get(orderBookId) || 8;
        return {
          messageType,
          orderBookId,
          equilibriumPrice: reader.readPriceV2026(decimals),
          bidQuantity: Number(reader.readBigUInt64BE()),
          askQuantity: Number(reader.readBigUInt64BE()),
          imbalanceQuantity: Number(reader.readBigUInt64BE()),
          imbalanceDirection: reader.readAlpha(1)
        };
      }
      case MESSAGE_TYPES.GLIMPSE_SNAPSHOT:
        return {
          messageType,
          sequenceNumber: reader.readBigUInt64BE().toString()
        };
      default:
        // Unhandled types fallback
        return {
          messageType,
          rawPayloadHex: reader.buffer.toString('hex', 1)
        };
    }
  } catch (err) {
    logError('Error parsing V2026 ITCH message', { messageType, error: err.message });
    return { messageType, error: err.message, raw: buffer.toString('hex') };
  }
}

module.exports = { parse };
