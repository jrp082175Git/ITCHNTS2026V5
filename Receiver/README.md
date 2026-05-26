# PSE ITCH SoupBinTCP Receiver

This is a production-ready Node.js application that connects to the PSE New Trading System ITCH Server Feed using SoupBinTCP. It supports configurable PROD/DR endpoints, parses ITCH specifications (V2015 and V2026), stores sequences and payloads in Redis, and broadcasts live feeds over Socket.IO and TCP servers.

## Features

- **SoupBinTCP Framing:** Robust TCP framing utilizing a stream buffer to combine or split payload chunks.
- **Strict Big-Endian Parsing:** Parses multi-byte binary values specific to the V2015 and V2026 PSE ITCH message specifications.
- **State Management & Persistence:** Durably stores payloads and sequences in Redis with a configurable key prefix (`ITCH`). Bounded memory arrays prevent leaks during traffic bursts.
- **Resilience:** Built-in connection exponential backoff and timeout handling.
- **Relay and Broadcasting:** Broadcasts parsed JSON via Socket.IO, newline-delimited TCP, and sequence-based retransmission TCP.

## Requirements

- Node.js v16+
- Redis Server (local or remote)

## Installation

1. Navigate to the `Receiver` directory:
   ```bash
   cd Receiver
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment variables file and configure your credentials:
   ```bash
   cp .env.example .env
   ```

## Configuration

Edit `.env` to supply your credentials:

```ini
ITCH_USERNAME=YOUR_USERNAME
ITCH_PASSWORD=YOUR_PASSWORD
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

Additional configurations for servers (like port numbers) are stored in `config/default.json`. Host mapping for PROD vs DR environments can be found in `config/prod.json` and `config/dr.json`.

## Usage

The application requires exactly 5 runtime parameters to start:

```bash
node src/Receiver.js <ENVIRONMENT> <START_MODE> <VERSION> <DISPLAY_MODE> <INITIALS>
```

### Parameters:
1. **Environment:** `PROD` or `DR`
2. **Start Mode:** `START:Y` (starts fresh, flushes old sequences) or `START:N` (loads from previous session)
3. **ITCH Version:** `V2026` or `V2015`
4. **Display Mode:** `DISPLAY:ON` or `DISPLAY:OFF` (toggles console stdout for messages; file logging is unaffected)
5. **User Initials:** E.g., `JP` (used for the daily log file naming)

### Example

To run the application in Production using V2026, fresh start, with display on, and initials `JP`:

```bash
node src/Receiver.js PROD START:Y V2026 DISPLAY:ON JP
```

To run the application in Disaster Recovery using V2015, picking up from previous session, with display off, and initials `AB`:

```bash
node src/Receiver.js DR START:N V2015 DISPLAY:OFF AB
```

## Testing

A Jest test suite is available. You can run the tests using:

```bash
npm test
```

You can also test the SoupBinTCP flow locally against a simulated fake server:

1. In one terminal window, run the fake server:
   ```bash
   node src/tests/fakeServer.js
   ```
2. In a second terminal window, connect to it (ensure `dr.json` or `prod.json` points to localhost port 5000):
   ```bash
   node src/Receiver.js PROD START:Y V2026 DISPLAY:ON TEST
   ```
