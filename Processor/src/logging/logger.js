const winston = require('winston');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

let loggerInstance = null;
let displayOn = true;

function initLogger(logFolder, initials, displayOption) {
  displayOn = displayOption;

  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder, { recursive: true });
  }

  const dateStr = moment().format('MMDDYYYY');
  const logFilename = `ProcessorLog_${dateStr}_${initials}.log`;
  const logPath = path.join(logFolder, logFilename);

  loggerInstance = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({ filename: logPath, options: { flags: 'a' } })
    ]
  });
}

function logInfo(message, meta = {}) {
  if (loggerInstance) {
    loggerInstance.info(message, meta);
  }
}

function logError(message, meta = {}) {
  if (loggerInstance) {
    loggerInstance.error(message, meta);
  }
}

function logWarn(message, meta = {}) {
  if (loggerInstance) {
    loggerInstance.warn(message, meta);
  }
}

function display(msg) {
  if (displayOn) {
    console.log(msg);
  }
}

function displayError(msg) {
  console.error(msg); // always display errors
}

module.exports = {
  initLogger,
  logInfo,
  logError,
  logWarn,
  display,
  displayError
};
