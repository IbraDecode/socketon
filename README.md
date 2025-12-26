<a id="readme-top"></a>

# Socketon

![NPM Version](https://img.shields.io/npm/v/socketon)
![NPM Downloads](https://img.shields.io/npm/dm/socketon)
![License](https://img.shields.io/npm/l/socketon)

<p align="center">
  <img src="https://files.catbox.moe/369pux.jpg" alt="Socketon" width="300" />
</p>

Socketon is a WhatsApp API library forked from Baileys with enhanced features including custom pairing codes, better session management, and improved stability. It uses WebSocket to connect to WhatsApp without requiring a browser.

## Features

- Custom pairing codes for stable authentication
- Multi-device support
- Interactive messages (buttons, lists, menus)
- Album messages (multiple images)
- Newsletter support with auto-follow
- Event messages
- Poll messages with results
- Payment request messages
- Product messages
- Document support
- Auto session management
- Lightweight and fast, no browser required

## Installation

```bash
npm install socketon
```

Requirements:
- Node.js >= 20.0.0

## Quick Start

### Bot Dasar - Basic Bot Example

```javascript
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('socketon');
const pino = require('pino');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_socketon');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('Connected successfully!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message) continue;

            const from = msg.key.remoteJid;
            const isiPesan = msg.message.conversation || msg.message.extendedTextMessage?.text;

            if (isiPesan) {
                console.log(`Pesan dari ${from}: ${isiPesan}`);
                await sock.sendMessage(from, { text: `Echo: ${isiPesan}` });
            }
        }
    });
}

startBot();
```

### Pairing Code - Pairing Code

```javascript
const { makeWASocket, useMultiFileAuthState } = require('socketon');
const pino = require('pino');

async function connectWithPairingCode() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_socketon');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection } = update;

        if (connection === 'open') {
            // Default pairing code: SOCKETON
            const pairingCodeDefault = await sock.requestPairingCode('6281234567890');
            console.log(`Default Pairing Code: ${pairingCodeDefault}`);

            // Custom pairing code
            const pairingCodeCustom = await sock.requestPairingCode('6281234567890', 'KODEKU');
            console.log(`Custom Pairing Code: ${pairingCodeCustom}`);
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

connectWithPairingCode();
```

---

## Links

- **Documentation**: [DOCS](./DOCS/README.md) - Dokumentasi lengkap API dan contoh lengkap
- NPM Package: https://www.npmjs.com/package/socketon
- GitHub Repository: https://github.com/IbraDecode/socketon
- Issues: https://github.com/IbraDecode/socketon/issues
- Discussions: https://github.com/IbraDecode/socketon/discussions

---

### Contributors

<a href="https://github.com/IbraDecode/socketon/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=IbraDecode/socketon" alt="contributors" />
</a>

Star this repo if you find it useful!

Made by IbraDecode

<a href="#readme-top">Back to Top</a>
