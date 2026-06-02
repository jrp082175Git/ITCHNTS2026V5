const queue = [];

function push(msg) {
  queue.push(msg);
}

function shift() {
  return queue.shift();
}

function peek() {
  return queue[0];
}

function length() {
  return queue.length;
}

function clear() {
  queue.length = 0;
}

module.exports = {
  push,
  shift,
  peek,
  length,
  clear
};
