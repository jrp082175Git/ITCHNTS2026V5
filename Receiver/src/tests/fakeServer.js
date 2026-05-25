const net = require('net');

const port = 5000;
const server = net.createServer((socket) => {
  console.log('Client connected to fake SoupBinTCP server');

  socket.on('data', (data) => {
    // Basic echo or specific logic could go here based on data type received
    const type = data.length > 2 ? data.toString('ascii', 2, 3) : '';
    console.log(`Received packet type: ${type}`);

    if (type === 'L') {
      // Send Login Accepted
      console.log('Sending Login Accepted');
      const buf = Buffer.alloc(33);
      buf.writeUInt16BE(31, 0); // length
      buf.write('A', 2, 1, 'ascii'); // type
      buf.write('SESSION1  ', 3, 10, 'ascii');
      buf.write('1                   ', 13, 20, 'ascii'); // next sequence No
      socket.write(buf);

      // Simulate sending some data shortly after
      setTimeout(() => {
          // Send a Server Heartbeat
          const hb = Buffer.alloc(3);
          hb.writeUInt16BE(1, 0);
          hb.write('H', 2, 1, 'ascii');
          socket.write(hb);
      }, 500);

      setTimeout(() => {
          // End of session
          console.log('Sending End of Session');
          const zBuf = Buffer.alloc(3);
          zBuf.writeUInt16BE(1, 0);
          zBuf.write('Z', 2, 1, 'ascii');
          socket.write(zBuf);
      }, 2000);
    }
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err.message);
  });

  socket.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(port, () => {
  console.log(`Fake SoupBinTCP Server listening on port ${port}`);
});
