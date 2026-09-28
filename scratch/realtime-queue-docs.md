# Real-Time Queue Integration (Module 19)

This document outlines the Socket.io real-time integration for the Visitor Queue system.

## Room Naming
When a client (visitor, staff, or public display) views a specific monument's queue, they join a socket room dedicated to that monument.

- **Format:** `monument_${monumentId}`
- **Example:** `monument_64b8c9d0f1a23c4d5e6f7g8h`

## Event Names & Payloads

### 1. `joinMonument` (Client to Server)
Emitted by the client upon successful connection to subscribe to a monument's updates.
- **Payload:** `monumentId` (String)

### 2. `queueUpdated` (Server to Client)
Emitted by the server to all clients in a specific monument room whenever a queue action occurs (ticket booked, visitor called, visitor skipped, visitor completed).
- **Payload:**
  ```json
  {
    "monumentId": "64b8c9d0f1a23c4d5e6f7g8h"
  }
  ```
- **Action:** Upon receiving this event, the client must trigger a manual data refetch using the existing REST APIs (e.g., `/api/staff/queue/:id` or `/api/queue/my/:ticketId`). This ensures data integrity and prevents exposing PII (Personal Identifiable Information) via Socket payloads.

## Reconnection Behavior
The frontend uses the `useQueueSocket` hook which builds upon `socket.io-client`.

1. **Attempts:** Configured automatically by `socket.io-client` with a default reconnect delay (usually 1000ms with backoff).
2. **Re-subscribing:** The socket listens to the `"connect"` (and implicitly `"reconnect"`) events to fire `socket.emit('joinMonument', monumentId)`. This guarantees that if the WebSocket drops and reconnects, the user is safely placed back into the correct monument room without missing subsequent updates.
3. **Unmounting:** The `useEffect` cleanup function calls `socket.disconnect()`, which safely removes the listener and leaves the room, preventing memory leaks when the user navigates away from the page.

## States & Fallbacks
- **SocketStatus Component:** Displays `Live` (Connected), `Reconnecting...`, or `Disconnected` states.
- **Manual Refresh:** The component exposes a refresh button (`<RefreshCw />`) that allows the user to manually trigger the API fetch if the socket drops.

## Privacy & Security
- **No PII:** The `queueUpdated` payload only contains the `monumentId`.
- **No ML/Pricing:** Live prediction data or dynamic pricing are intentionally omitted from this module.
