function updateTop5(postedArray) {
  // Take top 5 entries
  return postedArray.slice(0, 5);
}

function updateMarketDepth(sideArray, price, volumeChange, countChange, isBuy) {
  let existingLevelIndex = sideArray.findIndex(level => level.price === price);

  if (existingLevelIndex !== -1) {
    sideArray[existingLevelIndex].volume += volumeChange;
    sideArray[existingLevelIndex].count += countChange;

    if (sideArray[existingLevelIndex].volume <= 0 || sideArray[existingLevelIndex].count <= 0) {
      sideArray.splice(existingLevelIndex, 1);
    }
  } else if (volumeChange > 0 && countChange > 0) {
    sideArray.push({ price, volume: volumeChange, count: countChange });
  }

  // Sort
  if (isBuy) {
    sideArray.sort((a, b) => b.price - a.price); // Descending
  } else {
    sideArray.sort((a, b) => a.price - b.price); // Ascending
  }
}

module.exports = {
  updateTop5,
  updateMarketDepth
};
