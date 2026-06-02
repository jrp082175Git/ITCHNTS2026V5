# AGENTS.md

## General Instructions

This repository contains applications (Receiver and Processor) that parse the PSE ITCH feed over SoupBinTCP. Development inside this repository must strictly adhere to the rules outlined below.

## V2026 Document Analysis Mandate

Before generating or modifying any code related to the `V2026` feed, you **must** treat `PSE_ITCH_Specification_v1.0.pdf` as the primary source of truth. Do not rely on `PSE-Equities-Feed-Specification-v2.2.pdf` (V2015) when dealing with V2026 runtime paths.

### 1. ITCH Architecture and Sequencing
- **Receiver:** SoupBinTCP sequence numbers are implicit. The Receiver must maintain the sequence counter locally, assign `sequenceNo` to every parsed V2026 message, persist `lastSequenceNo` in Redis, and use the stored session/sequence on reconnects.
- **Processor:** Do not trust arrival order blindly. Validate `sequenceNo`. If `RETRANS:ON` is active, pause the live queue when a gap is found, request missing messages from the Receiver, and process retransmitted messages through `OnCache` until empty before resuming `OnReceive`.

### 2. 24x7 Reset Behavior
- **Receiver & Processor:** Implement special handling for an unsolicited `Login Accepted` message (packet type `A`) with sequence number `1` received while the app is running. This signifies a daily 24x7 reset.
- The Receiver must clear runtime buffers, reset Redis live packet/message keys, and notify the Processor.
- The Processor must clear `orderBookList`, `fullMarketDepth`, `timeAndSales`, `orderItemList`, `tickSizeTable`, and `systemEvent`.

### 3. Big-Endian Data Types
- Do not manually swap the entire packet.
- Decode every field using explicit big-endian Buffer methods (`readInt32BE`, `readBigInt64BE`, etc.) inside the `BufferReader`.
- The `Price` type in V2026 is an 8-byte signed numeric value (`BigInt`), and its decimal setting comes dynamically from the Order Book Directory message (`R`).

### 4. V2026 Message Map
Ensure the following messages are strictly implemented based on the V2026 specs:
- `T` — Seconds Message
- `R` — Order Book Directory
- `X` — Order Book Directory Extension
- `M` — Combination Order Book Leg
- `L` — Tick Size Table
- `S` — System Event
- `O` — Order Book State
- `A` — Add Anonymous Order
- `F` — Add Attributed Order
- `E` — Order Executed
- `C` — Order Executed with Price
- `D` — Order Delete
- `P` — Trade
- `Z` — Equilibrium Price
- `G` — Glimpse Snapshot (if enabled)

### 5. Timestamp Handling
- `T` (Seconds Message) contains the Unix time in seconds. Update the global `timeStamp` state.
- All other individual messages contain a `nanos` field (nanoseconds since the latest `T` message).
- Combine `timeStamp` and `nanos` to produce the full event timestamp. Do not treat `nanos` as a standalone time value.

### 6. Order Book Construction Rules
- Construct the Order Book view using `A` (Add), `E` (Executed), `C` (Executed with Price), and `D` (Delete) messages.
- Maintain order-level state (`orderItemList`) and price-level aggregated state (`fullMarketDepth`).
- Rank orders by Order Book Position. Executed messages reduce leaves quantity. Delete messages remove the order.

### 7. Trade Ticker Rules
- The Trade Ticker (`timeAndSales`) is built from `E`, `C`, and `P` messages.
- Exclude non-printable executions/trades to avoid double booking. Rely on the `printable` flag where specified.

### 8. Combination Order Book Trade Handling
- Track short-lived combination executions via `Combo Group ID`.
- Do not assume `comboGroupId` is unique forever; bind it within a temporal processing window using sequence/time contexts.

### 9. Glimpse Support Consideration
- If implemented, keep Glimpse logic separate. Upon receiving `G` (Glimpse Snapshot), start live processing from `snapshot sequence number + 1`. Note that `S` and `Z` messages are absent from the snapshot.

---

## Receiver Application Specifications
The Receiver application handles **5 runtime parameters**:
1. Environment (`PROD` or `DR`)
2. Start Mode (`START:Y` or `START:N`)
3. ITCH Version (`V2026` or `V2015`)
4. Display Mode (`DISPLAY:ON` or `DISPLAY:OFF`)
5. User initials (e.g., `JP`)

## Processor Application Specifications
When generating the Processor application in the future, it must accept **4 runtime parameters**:
1. Retransmission Mode (`RETRANS:ON` or `RETRANS:OFF`)
2. Start Mode (`START:Y` or `START:N`)
3. Display Mode (`DISPLAY:ON` or `DISPLAY:OFF`)
4. User initials (e.g., `JP`)
