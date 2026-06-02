const stateManager = require('../state/stateManager');
const { unixTimeToDateTime } = require('../utils/dateTimeUtils');

function handleTimeMessage(message) {
  // Case T - Seconds Message
  if (message.messageType === 'T') {
    const timestamp = unixTimeToDateTime(message.second);
    stateManager.getState().timeStamp = timestamp;
  }
}

module.exports = {
  handleTimeMessage
};
