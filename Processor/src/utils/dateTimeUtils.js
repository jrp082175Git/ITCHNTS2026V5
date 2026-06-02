function combineTimestampNanos(timestampSeconds, nanos) {
  if (!timestampSeconds) return null;
  // Convert Unix seconds to ms, then add nanos converted to ms for a standard JS Date object.
  // Alternatively, just stringify them together for high precision output.
  const ms = timestampSeconds * 1000 + Math.floor(nanos / 1000000);
  return new Date(ms).toISOString();
}

function unixTimeToDateTime(seconds) {
  return new Date(seconds * 1000).toISOString();
}

module.exports = {
  combineTimestampNanos,
  unixTimeToDateTime
};
