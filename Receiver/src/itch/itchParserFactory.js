const v2026Parser = require('./v2026/itchV2026Parser');
const v2015Parser = require('./v2015/itchV2015Parser');

function getParser(version) {
  if (version === 'V2026') {
    return v2026Parser.parse;
  } else if (version === 'V2015') {
    return v2015Parser.parse;
  } else {
    throw new Error(`Unsupported ITCH version: ${version}`);
  }
}

module.exports = {
  getParser
};
