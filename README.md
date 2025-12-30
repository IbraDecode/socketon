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

## Installation

```bash
npm install socketon
```

Requirements:
- Node.js >= 20.0.0

---

## Quick Start

### Basic Echo Bot

```javascript
const { makeWASocket, useMultiFileAuthState } = require('socketon');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');

  const sock = makeWASocket({
    auth: state
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, qr } = update;

    if (qr) console.log('Scan QR Code:', qr);
    if (connection === 'open') console.log('Connected to WhatsApp!');
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (msg.key.fromMe) continue;

      const jid = msg.key.remoteJid;
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

      console.log(`Message from ${jid}: ${text}`);

      if (text) {
        await sock.sendMessage(jid, { text: `Echo: ${text}` });
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

startBot().catch(console.error);
```

### Pairing Code Authentication

```javascript
const { makeWASocket, useMultiFileAuthState } = require('socketon');

async function startWithPairing() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');

  const sock = makeWASocket({
    auth: state
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection } = update;

    if (connection === 'open') {
      // Default pairing code (obfuscated in source)
      const pairingCode = await sock.requestPairingCode('6281234567890');
      console.log('Pairing Code:', pairingCode);

      // Or use custom pairing code
      const customCode = await sock.requestPairingCode('6281234567890', 'MYCODE');
      console.log('Custom Pairing Code:', customCode);
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

startWithPairing().catch(console.error);
```

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

**Socket Layer (`lib/Socket/`)**
- `socket.js`: Core WebSocket connection, Noise protocol handshake, pairing code authentication
- `messages-send.js`: Message generation, encryption, device enumeration
- `messages-recv.js`: Message decryption, receipt handling, retry logic
- `groups.js`: Group metadata, participants management, invite codes
- `communities.js`: Community creation, linked groups, membership approval
- `business.js`: Product catalog, orders, business profile
- `newsletter.js`: Newsletter creation, following, reactions

**Signal Layer (`lib/Signal/`)**
- `libsignal.js`: E2E encryption using libsignal-xeuka
- Group cipher and sender key distribution for group messages
- Session management and LID/PN addressing for multi-device

**Binary Protocol (`lib/WABinary/`)**
- `encode.js`: Binary node encoding for WhatsApp protocol
- `decode.js`: Binary node decoding
- `constants.js`: Protocol constants (643KB)
- `jid-utils.js`: JID parsing, encoding, and validation

**Utils (`lib/Utils/`)**
- `messages.js`: Message generation helpers, media handling
- `messages-media.js`: Media upload/download, encryption, thumbnail generation
- `event-buffer.js`: Event buffering and flushing mechanism
- `auth-utils.js`: Authentication helpers, pre-key management

### Security Features

- **Noise Protocol**: Noise_XX_25519_AESGCM_SHA256 for connection handshake
- **E2E Encryption**: Full end-to-end encryption via libsignal-xeuka
- **Pre-Key Management**: Automatic pre-key upload (INITIAL: 812, MIN: 5)
- **Sender Key**: Group message encryption using sender key distribution
- **LID/PN Addressing**: Secure multi-device communication with session migration

### Event System

The event-driven architecture uses an event buffer for reliable event handling:

```javascript
// Available events
connection.update  // Connection state changes
messages.upsert    // New messages
messages.update    // Message updates (status, reactions)
messages.delete    // Message deletion
chats.upsert       // Chat updates
groups.update      // Group metadata updates
newsletter.reaction // Newsletter reactions
call               // Incoming/outgoing calls
creds.update       // Credential updates
```

---

## Advanced Usage

### In-Memory Store

```javascript
const { makeInMemoryStore } = require('socketon');

const store = makeInMemoryStore({ socket: sock });
store.bind(sock.ev);

// Access stored data
const chats = store.chats.all();
const messages = store.loadMessages('jid@s.whatsapp.net', 50);
```

### Message Retry

Socketon includes automatic message retry with session recreation:

```javascript
const sock = makeWASocket({
  auth: state,
  enableAutoSessionRecreation: true,
  maxMsgRetryCount: 5
});
```

### Privacy Settings

```javascript
// Update privacy settings
await sock.updateReadReceiptsPrivacy('all');
await sock.updateOnlinePrivacy('all');
await sock.updateProfilePicturePrivacy('contacts');

// Fetch current settings
const settings = await sock.fetchPrivacySettings();
```

### Business Features

```javascript
// Create product
await sock.productCreate({
  name: 'My Product',
  description: 'Product description',
  priceAmount1000: 10000,
  currency: 'IDR',
  images: [Buffer.from('image.jpg')]
});

// Get catalog
const catalog = await sock.getCatalog({ jid, limit: 20 });
```

### Newsletter Operations

```javascript
// Create newsletter
const newsletter = await sock.newsletterCreate('My Newsletter', 'Description');

// Send to newsletter
await sock.sendMessage(newsletter.id, { text: 'Hello subscribers' });

// React to message
await sock.newsletterReactMessage(newsletter.id, serverId, '❤️');
```

---


## makeWASocketon - Simplified Socket Initialization

`makeWASocketon()` is a simplified wrapper around `makeWASocket()` with built-in features like auto-reconnect, message serialization, and helper methods.

### Basic Usage

```javascript
const { makeWASocketon } = require('socketon');

const sock = await makeWASocketon({
  sessionDir: './session',        // Folder to store session
  pairingNumber: '6281234567890', // Phone number (without +)
  onMessage: async (msg) => {   // Message handler
    if (msg.text === '!ping') {
      await sock.reply(msg, 'Pong! 🏓');
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
    await sock.reply(msg, 'Hello!');
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

### Example Bot

```javascript
const { makeWASocketon } = require('socketon');

const sock = await makeWASocketon({
  sessionDir: './bot-session',
  pairingNumber: '6281234567890',
  onConnection: (status) => {
    if (status === 'open') {
      console.log('✅ Bot is ready!');
    }
  },
  onGroupJoin: async (msg) => {
    await sock.reply(msg, `Welcome @${msg.author}! 👋`);
  },
  onMessage: async (msg) => {
    const text = msg.text.toLowerCase();
    
    if (text === '!menu') {
      await sock.reply(msg, `
📋 *MENU*
• !ping - Test bot
• !info - Bot info
• !owner - Contact owner
      `);
    }
    else if (text === '!ping') {
      await sock.reply(msg, 'Pong! ⚡');
    }
    else if (text === '!info') {
      await sock.reply(msg, `
🤖 *BOT INFO*
Status: Online
Session: ${sock.sessionId}
Socketon: v1.51.16
      `);
    }
  }
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await sock.shutdown();
  process.exit(0);
});
```

### Auto-Reconnect with Exponential Backoff

Socketon includes built-in auto-reconnect with exponential backoff to prevent getting banned:

- **Base delay:** 5 seconds
- **Max delay:** 60 seconds
- **Max attempts:** 10

Reconnect formula:
```
delay = min(5000 * 2^attempt, 60000)
```

## Troubleshooting

### Common Issues

**Connection Problems**
- Check internet connection
- Ensure WhatsApp account is active
- Try deleting `auth/` folder and re-authenticating

**Authentication Issues**
- Delete auth folder and scan QR again
- Check file permissions on auth directory
- Ensure stable network during authentication

**Message Failures**
- Verify JID format (e.g., `6281234567890@s.whatsapp.net`)
- Check if recipient blocked you
- Implement retry logic for reliability

**Pre-Key Errors**
- Automatic pre-key upload is enabled by default
- Check logs for pre-key upload status
- Manual upload available via `uploadPreKeys()`

---

## Contributing

We welcome contributions! Please see our contributing guidelines for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

<a href="https://github.com/IbraDecode/socketon/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=IbraDecode/socketon" alt="contributors" />
</a>

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Credits

- Original Baileys: [@adiwajshing/baileys](https://github.com/adiwajshing/baileys)
- Socketon Enhancement: [IbraDecode](https://github.com/IbraDecode)

---

## Support & Community

- **Telegram Community**: [Join our community](https://t.me/socketon)
- **GitHub Issues**: [Report bugs](https://github.com/IbraDecode/socketon/issues)
- **WhatsApp**: +31617786379

---

## Version

Socketon v1.51.16 - Built by IbraDecode

<p align="center">
  <a href="#readme-top">back to top</a>
</p>
