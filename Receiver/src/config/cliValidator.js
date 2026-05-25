function validateCliArgs(args) {
  if (args.length < 5) {
    printUsageAndExit();
  }

  const [envRaw, startRaw, versionRaw, displayRaw, initialsRaw] = args;

  const env = envRaw.toUpperCase();
  const start = startRaw.toUpperCase();
  const version = versionRaw.toUpperCase();
  const display = displayRaw.toUpperCase();
  const initials = initialsRaw.toUpperCase();

  if (env !== 'PROD' && env !== 'DR') {
    console.error('Error: Parameter 1 must be PROD or DR');
    printUsageAndExit();
  }

  if (start !== 'START:Y' && start !== 'START:N') {
    console.error('Error: Parameter 2 must be START:Y or START:N');
    printUsageAndExit();
  }

  if (version !== 'V2026' && version !== 'V2015') {
    console.error('Error: Parameter 3 must be V2026 or V2015');
    printUsageAndExit();
  }

  if (display !== 'DISPLAY:ON' && display !== 'DISPLAY:OFF') {
    console.error('Error: Parameter 4 must be DISPLAY:ON or DISPLAY:OFF');
    printUsageAndExit();
  }

  if (!initials || initials.length === 0) {
    console.error('Error: Parameter 5 (user initials) is missing');
    printUsageAndExit();
  }

  return {
    env,
    startY: start === 'START:Y',
    version,
    displayOn: display === 'DISPLAY:ON',
    initials
  };
}

function printUsageAndExit() {
  console.log(`
Usage: node src/Receiver.js <PROD|DR> <START:Y|START:N> <V2026|V2015> <DISPLAY:ON|DISPLAY:OFF> <USER_INITIALS>

Example:
  node src/Receiver.js PROD START:Y V2026 DISPLAY:ON JP
  node src/Receiver.js DR START:N V2015 DISPLAY:OFF JP,AB,CD
`);
  process.exit(1);
}

module.exports = { validateCliArgs };
