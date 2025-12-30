# Socketon WhatsApp API Library

<p align="center">
  <img src="https://files.catbox.moe/0wl8py.png" alt="socketon" width="320" />
</p>

<p align="center">
  A modern, stable, and feature-rich WhatsApp API library for Node.js. Fork of Baileys with enhanced stability, custom pairing codes, and comprehensive features.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/socketon">
    <img src="https://img.shields.io/npm/v/socketon" />
  </a>
  <a href="https://www.npmjs.com/package/socketon">
    <img src="https://img.shields.io/npm/dm/socketon" />
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/npm/l/socketon" />
  </a>
</p>

---

## Why Socketon?

If you feel Baileys is now slow, has double responses, or sometimes infinite connecting, Socketon can be a better alternative.

This is a fork of Baileys focused on stability, session handling, and more flexible pairing codes. Most APIs remain the same, so migration from Baileys usually doesn't require major changes.

---

## Key Features

- Custom Pairing Codes: Default pairing code (obfuscated) for easier authentication
- Enhanced Stability: Improved session handling and automatic reconnection
- Multi-Device Support: Full compatibility with WhatsApp's multi-device feature
- Interactive Messages: Buttons, lists, and native flow interactions
- Album Messages: Send multiple images in a single message
- Newsletter Integration: Auto-follow and manual newsletter management
- Business Messaging: Product catalogs, payments, and business features
- Media Support: Comprehensive upload/download with progress tracking
- Event-Driven Architecture: Extensive real-time event system
- TypeScript Support: Full type definitions for better development experience
- Lightweight & Fast: WebSocket-based, no browser dependencies

---

## makeWASocketon - Simplified Socket Initialization

`makeWASocketon()` is a simplified wrapper around `makeWASocket()` with built-in features like auto-reconnect, message serialization, and helper methods.

### Quick Start - Basic

```javascript
const { makeWASocketon } = require('socketon');

const sock = await makeWASocketon({
  sessionDir: './session',        // Folder to store session
  pairingNumber: '6281234567890', // Phone number (without +)
  onMessage: async (msg) => {   // Message handler
    if (msg.text === '!ping') {
      await sock.reply(msg, 'Pong! PING');
    }
  }
});

// Auto-reconnect, auto-save credentials built-in!
```

### With Custom Pairing Code (Optional)

```javascript
const sock = await makeWASocketon({
  sessionDir: './session',
  pairingNumber: '6281234567890',
  pairingCode: 'MYCODE12',       // Optional: 8 characters
  onMessage: async (msg) => {
    await sock.reply(msg, 'Hello! HELLO');
  }
});
```

### Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `sessionDir` | string | Yes | - | Folder to store session files |
| `pairingNumber` | string | Yes | - | Phone number (e.g., "6281234567890") |
| `pairingCode` | string | No | Default | Custom pairing code (must be 8 chars) |
| `onMessage` | function | Yes | - | Callback for new messages |
| `onConnection` | function | No | - | Callback for connection status updates |
| `onGroupJoin` | function | No | - | Callback for group joins |
| `onGroupLeave` | function | No | - | Callback for group leaves |
| `onError` | function | No | - | Callback for errors |
| `enableAutoReconnect` | boolean | No | true | Enable auto-reconnect on disconnect |
| `enableMetadataCache` | boolean | No | true | Enable group metadata caching |
| `syncFullHistory` | boolean | No | false | Sync full message history |
| `browser` | object | No | Browsers.ubuntu("Chrome") | Browser configuration |
| `logger` | object | No | pino default | Custom logger instance |

### Built-in Helper Methods

```javascript
// Serialize message (automatically done in onMessage)
const serialized = sock.serialize(rawMessage);

// Get group metadata with caching
const metadata = await sock.getGroupMetadata('group@g.us');

// Clear group cache
sock.clearGroupCache(); // Clear all
sock.clearGroupCache('group@g.us'); // Clear specific

// Download media
const buffer = await sock.downloadMedia(message);
const filePath = await sock.downloadMedia(message, 'image', 'photo.jpg');

// Decode JID
const decodedJid = sock.decodeJid('user:5@s.whatsapp.net');

// Send message
await sock.send('jid@s.whatsapp.net', { text: 'Hello' });

// Reply to message
await sock.reply(message, 'Reply!');

// Forward message
await sock.forward('jid@s.whatsapp.net', message);

// Set presence
await sock.setPresence('available');
await sock.setPresence('composing', 'jid@s.whatsapp.net');
await sock.setPresence('recording', 'jid@s.whatsapp.net');

// Graceful shutdown
await sock.shutdown();
```

### Connection Status Events

```javascript
const sock = await makeWASocketon({
  sessionDir: './session',
  pairingNumber: '6281234567890',
  onConnection: (status, data) => {
    switch(status) {
      case 'connecting':
        console.log('Connecting...');
        break;
      case 'open':
        console.log('Connection opened successfully!');
        break;
      case 'close':
        console.log('Connection closed');
        if (data.autoReconnect) {
          console.log('Auto-reconnecting...');
        }
        break;
      case 'reconnecting':
        console.log('Reconnecting (attempt ' + data.attempt + ')');
        break;
      case 'loggedOut':
        console.log('Session logged out. Delete session folder.');
        break;
      case 'requesting_pairing_code':
        console.log('Requesting pairing code...');
        break;
      case 'pairing_code_ready':
        console.log('Pairing Code:', data.code);
        console.log('Pairing Number:', data.pairingNumber);
        break;
    }
  },
  onMessage: async (msg) => {
    console.log('Message:', msg.text);
  }
});
```

### Example Bot - Full

```javascript
const { makeWASocketon } = require('socketon');

const sock = await makeWASocketon({
  sessionDir: './bot-session',
  pairingNumber: '6281234567890',
  onConnection: (status) => {
    if (status === 'open') {
      console.log('Bot is ready!');
    }
  },
  onGroupJoin: async (msg) => {
    await sock.reply(msg, 'Welcome @' + msg.author + '!');
  },
  onGroupLeave: async (msg) => {
    await sock.reply(msg, 'Goodbye @' + msg.author + '!');
  },
  onMessage: async (msg) => {
    const text = msg.text.toLowerCase();
    
    if (text === '!menu') {
      await sock.reply(msg, `
MENU
• !ping - Test bot
• !info - Bot info
• !owner - Contact owner
      `);
    }
    else if (text === '!ping') {
      await sock.reply(msg, 'Pong! PING');
    }
    else if (text === '!info') {
      await sock.reply(msg, `
BOT INFO
Status: Online
Session: ' + sock.sessionId
Socketon: v1.51.16
      `);
    }
  }
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await sock.shutdown();
  process.exit(0);
});
```

### Auto-Reconnect with Exponential Backoff

Socketon includes built-in auto-reconnect with exponential backoff to prevent getting banned:

- Base delay: 5 seconds
- Max delay: 60 seconds  
- Max attempts: 10

Reconnect formula:
```
delay = min(5000 * 2^attempt, 60000)
```

### Validation Rules

- Pairing Code: Must be exactly 8 characters if provided
- Session Directory: Must be provided (auto-created if not exists)
- Pairing Number: Must be provided (phone number without +)
- onMessage: Must be a function

Error: "pairingCode must be 8 characters long"
       (If pairingCode is not 8 characters)

---

## Installation

```bash
npm install socketon
```

Requirements:
- Node.js >= 20.0.0

---

## Core Architecture

### Layered Socket System

Socketon uses a layered architecture for better modularity and maintainability:

```
makeWASocket()
  └── makeCommunitiesSocket()    # Communities support
      └── makeBusinessSocket()      # Business features
          └── makeMessagesRecvSocket()  # Message receiving
              └── makeMessagesSocket()   # Message sending
                  └── makeNewsletterSocket() # Newsletter features
                      └── makeGroupsSocket() # Group management
                          └── makeChatsSocket()  # Chat operations
                              └── makeSocket()  # Core WebSocket connection
```

### Key Components

Socket Layer (lib/Socket/)
- socket.js: Core WebSocket connection, Noise protocol handshake, pairing code authentication
- messages-send.js: Message generation, encryption, device enumeration
- messages-recv.js: Message decryption, receipt handling, retry logic
- groups.js: Group metadata, participants management, invite codes
- communities.js: Community creation, linked groups, membership approval
- business.js: Product catalog, orders, business profile
- newsletter.js: Newsletter creation, following, reactions
- chats.js: Chat operations
- socketon.js: Simplified wrapper (makeWASocketon)

Signal Layer (lib/Signal/)
- libsignal.js: E2E encryption using libsignal-xeuka
- Group cipher and sender key distribution for group messages
- Session management and LID/PN addressing for multi-device

Binary Protocol (lib/WABinary/)
- encode.js: Binary node encoding for WhatsApp protocol
- decode.js: Binary node decoding
- constants.js: Protocol constants (643KB)
- jid-utils.js: JID parsing, encoding, and validation

Utils (lib/Utils/)
- messages.js: Message generation helpers, media handling
- messages-media.js: Media upload/download, encryption, thumbnail generation
- event-buffer.js: Event buffering and flushing mechanism
- auth-utils.js: Authentication helpers, pre-key management

### Security Features

Layer 1: Noise Protocol (XX pattern)
- Ephemeral key exchange
- Perfect forward secrecy
- X25519 ECDH
- AES-256-GCM
- SHA-256 authentication

Layer 2: Signal Protocol (E2E)
- Double Ratchet
- X3DH key agreement
- Pre-key bundles
- Sender keys for groups

Layer 3: Advanced Device Verification
- ADV signatures
- Account signature key
- Device signature
- Chain of trust

Layer 4: Obfuscation
- Pairing code: XOR + hex arrays
- Newsletter URL: XOR + random variables

---

## Documentation

### Key Files

Core Socket:
- lib/Socket/index.js - Entry point (makeWASocket)
- lib/Socket/socket.js - Core connection (820 lines)
- lib/Socket/socketon.js - Simplified wrapper (402 lines)
- lib/Socket/messages-send.js - Message sending (1100 lines)
- lib/Socket/messages-recv.js - Message receiving (1163 lines)
- lib/Socket/groups.js - Group management (312 lines)
- lib/Socket/communities.js - Communities (413 lines)
- lib/Socket/business.js - Business API (377 lines)
- lib/Socket/newsletter.js - Newsletter (245 lines)
- lib/Socket/chats.js - Chat operations
- lib/Socket/mex.js - Mex queries
- lib/Socket/Client/ - WebSocket client

Encryption:
- lib/Signal/libsignal.js - Signal protocol (324 lines)
- lib/Signal/Group/ - Group encryption
- lib/Signal/lid-mapping.js - LID/PN mapping
- lib/Utils/crypto.js - Crypto primitives (130 lines)
- lib/Utils/noise-handler.js - Noise protocol (144 lines)
- lib/Utils/auth-utils.js - Auth credentials (219 lines)

Binary Protocol:
- lib/WABinary/encode.js - Binary encoding (218 lines)
- lib/WABinary/decode.js - Binary decoding (240 lines)
- lib/WABinary/constants.js - Protocol constants (643 KB)
- lib/WABinary/jid-utils.js - JID utilities
- lib/WABinary/generic-utils.js - Helper functions

Utilities:
- lib/Utils/messages.js - Message generation (35 KB)
- lib/Utils/messages-media.js - Media handling (21 KB)
- lib/Utils/event-buffer.js - Event buffering (17 KB)
- lib/Utils/message-retry-manager.js - Retry logic (113 lines)
- lib/Utils/pre-key-manager.js - Pre-key management
- lib/Utils/validate-connection.js - Login/registration (200 lines)
- lib/Utils/generics.js - Generic helpers (355 lines)

Storage:
- lib/Store/make-in-memory-store.js - In-memory DB (290 lines)
- lib/Store/object-repository.js - Object repository
- lib/Store/make-cache-manager-store.js - Cache manager
- lib/KeyDB/KeyedDB.js - Binary search DB

Protocols:
- lib/WAUSync/ - USync protocols
- lib/WAM/ - WhatsApp Message types
- WAProto/ - Protocol buffers (4.2 MB)

Configuration:
- lib/Defaults/index.js - Default config (123 lines)

---

## Support & Community

- Telegram Community: Join our community
- GitHub Issues: Report bugs
- WhatsApp: +31617786379
- Complete Documentation

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Credits

- Original Baileys: Baileys
- Socketon Enhancement: IbraDecode

---

<p align="center">
  <a href="#readme-top">back to top</a>
</p>
