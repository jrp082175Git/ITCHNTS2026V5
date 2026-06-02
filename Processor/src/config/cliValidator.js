function validateCliArgs(args) {
  if (args.length < 4) {
    printUsageAndExit();
  }

  const [retransRaw, startRaw, displayRaw, initialsRaw] = args;

  const retrans = retransRaw.toUpperCase();
  const start = startRaw.toUpperCase();
  const display = displayRaw.toUpperCase();
  const initials = initialsRaw.toUpperCase();

  if (retrans !== 'RETRANS:ON' && retrans !== 'RETRANS:OFF') {
    console.error('Error: Parameter 1 must be RETRANS:ON or RETRANS:OFF');
    printUsageAndExit();
  }

  if (start !== 'START:Y' && start !== 'START:N') {
    console.error('Error: Parameter 2 must be START:Y or START:N');
    printUsageAndExit();
  }

  if (display !== 'DISPLAY:ON' && display !== 'DISPLAY:OFF') {
    console.error('Error: Parameter 3 must be DISPLAY:ON or DISPLAY:OFF');
    printUsageAndExit();
  }

  if (!initials || initials.length === 0) {
    console.error('Error: Parameter 4 (user initials) is missing');
    printUsageAndExit();
  }

  return {
    retransOn: retrans === 'RETRANS:ON',
    startY: start === 'START:Y',
    displayOn: display === 'DISPLAY:ON',
    initials
  };
}

function printUsageAndExit() {
  console.log(`
Usage: node src/Processor.js <RETRANS:ON|RETRANS:OFF> <START:Y|START:N> <DISPLAY:ON|DISPLAY:OFF> <USER_INITIALS>

Example:
  node src/Processor.js RETRANS:ON START:Y DISPLAY:ON JP
  node src/Processor.js RETRANS:OFF START:N DISPLAY:OFF JP,AB,CD
`);
  process.exit(1);
}

module.exports = { validateCliArgs };
