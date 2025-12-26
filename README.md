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

### Basic Example

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
            const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text;

            if (messageContent) {
                console.log(`Message from ${from}: ${messageContent}`);
                await sock.sendMessage(from, { text: `Echo: ${messageContent}` });
            }
        }
    });
}

startBot();
```

### Pairing Code

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
            const pairingCode = await sock.requestPairingCode('6281234567890');
            console.log(`Pairing Code: ${pairingCode}`);

            // Custom pairing code
            const customCode = await sock.requestPairingCode('6281234567890', 'MYCODE');
            console.log(`Custom Pairing Code: ${customCode}`);
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

connectWithPairingCode();
```

## SendMessage Documentation

### Album Message

```javascript
await sock.sendMessage(jid, {
    albumMessage: [
        { image: fs.readFileSync('./image1.jpg'), caption: "First image" },
        { image: { url: "https://example.com/image2.jpg" }, caption: "Second image" }
    ]
});
```

### Event Message

```javascript
await sock.sendMessage(jid, {
    eventMessage: {
        isCanceled: false,
        name: "My Event",
        description: "Event description",
        location: {
            degreesLatitude: 0,
            degreesLongitude: 0,
            name: "Location"
        },
        joinLink: "https://call.whatsapp.com/video/xyz",
        startTime: "1763019000",
        endTime: "1763026200",
        extraGuestsAllowed: false
    }
});
```

### Poll Result Message

```javascript
await sock.sendMessage(jid, {
    pollResultMessage: {
        name: "My Poll",
        pollVotes: [
            {
                optionName: "Option 1",
                optionVoteCount: "100"
            },
            {
                optionName: "Option 2",
                optionVoteCount: "50"
            }
        ]
    }
});
```

### Interactive Message (Simple)

```javascript
await sock.sendMessage(jid, {
    interactiveMessage: {
        header: "Header",
        title: "Title",
        footer: "Footer",
        buttons: [
            {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                    display_text: "Copy Code",
                    id: "copy_button",
                    copy_code: "ABC123"
                })
            }
        ]
    }
});
```

### Interactive Message with Native Flow

```javascript
await sock.sendMessage(jid, {
    interactiveMessage: {
        header: "Menu",
        title: "Choose Option",
        footer: "Socketon",
        image: { url: "https://example.com/image.jpg" },
        nativeFlowMessage: {
            messageParamsJson: JSON.stringify({
                bottom_sheet: {
                    in_thread_buttons_limit: 2,
                    list_title: "Options",
                    button_title: "View Menu"
                }
            }),
            buttons: [
                {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({
                        display_text: "Copy",
                        id: "copy_btn",
                        copy_code: "SOCKETON"
                    })
                },
                {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                        title: "Select",
                        sections: [
                            {
                                title: "Menu",
                                rows: [
                                    {
                                        title: "Option 1",
                                        description: "Desc 1",
                                        id: "opt_1"
                                    },
                                    {
                                        title: "Option 2",
                                        description: "Desc 2",
                                        id: "opt_2"
                                    }
                                ]
                            }
                        ]
                    })
                }
            ]
        }
    }
});
```

### Product Message

```javascript
await sock.sendMessage(jid, {
    productMessage: {
        title: "Product Name",
        description: "Description",
        thumbnail: { url: "https://example.com/thumb.jpg" },
        productId: "PROD001",
        retailerId: "RETAIL001",
        url: "https://example.com/product",
        body: "Details",
        footer: "Special Price",
        priceAmount1000: 50000,
        currencyCode: "USD",
        buttons: [
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "Buy Now",
                    url: "https://example.com/buy"
                })
            }
        ]
    }
});
```

### Interactive Message with Document

```javascript
await sock.sendMessage(jid, {
    interactiveMessage: {
        header: "Document",
        title: "Title",
        footer: "Socketon",
        document: fs.readFileSync('./document.pdf'),
        mimetype: "application/pdf",
        fileName: "document.pdf",
        jpegThumbnail: fs.readFileSync('./thumb.jpg'),
        buttons: [
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "Open",
                    url: "https://example.com"
                })
            }
        ]
    }
});
```

### Payment Request Message

```javascript
await sock.sendMessage(jid, {
    requestPaymentMessage: {
        currency: "IDR",
        amount: 100000,
        from: jid,
        note: "Payment",
        expiryTimestamp: Math.floor(Date.now() / 1000) + 3600
    }
});
```

## Configuration

```javascript
const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'info' }),
    browser: ['Socketon', 'Chrome', '1.0'],
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
        return { conversation: "Hello" };
    }
});
```

## Advanced Features

### Newsletter

```javascript
// Auto-follow newsletter on connection (built-in)

// Manual operations
await sock.newsletterFollow('120363406301359528@newsletter');
await sock.newsletterUnfollow('120363406301359528@newsletter');
await sock.newsletterMute('120363406301359528@newsletter');
await sock.newsletterUnmute('120363406301359528@newsletter');
```

### Session Management

```javascript
const { useMultiFileAuthState } = require('socketon');

const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
sock.ev.on('creds.update', saveCreds);
```

### Connection Events

```javascript
sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    console.log('Connection:', connection);
});

sock.ev.on('creds.update', saveCreds);

sock.ev.on('messages.upsert', ({ messages }) => {
    console.log('Messages:', messages);
});

sock.ev.on('chats.upsert', (chats) => {
    console.log('Chats:', chats);
});
```

## FAQ

**Q: How to change default pairing code?**
A: Use the second parameter:
```javascript
const code = await sock.requestPairingCode('6281234567890', 'MYCODE');
```

**Q: Does this support multiple devices?**
A: Yes, Socketon fully supports WhatsApp's multi-device features.

**Q: Can I use this for commercial purposes?**
A: Yes, Socketon is released under MIT license.

**Q: How to handle reconnections?**
A: Listen to the `connection.update` event (see Quick Start example).

**Q: Is there a browser-based alternative?**
A: No, Socketon uses WebSocket directly without requiring a browser.

## Comparison with Baileys

| Feature | Baileys | Socketon |
|---------|----------|----------|
| Custom Pairing Codes | No | Yes |
| Auto Newsletter Follow | No | Yes |
| Default Pairing Code | No | Yes (SOCKETON) |
| Album Messages | Yes | Yes |
| Interactive Messages | Yes | Yes |
| Newsletter Support | Yes | Yes (Enhanced) |

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Credits

- Original Baileys by [@adiwajshing](https://github.com/adiwajshing/baileys)
- Socketon Modification by [IbraDecode](https://github.com/IbraDecode)

## Links

- NPM Package: https://www.npmjs.com/package/socketon
- GitHub Repository: https://github.com/IbraDecode/baileys
- Issues: https://github.com/IbraDecode/baileys/issues
- Discussions: https://github.com/IbraDecode/baileys/discussions

---

### Contributors

<a href="https://github.com/IbraDecode/Baileys/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=IbraDecode/Baileys" alt="contributors" />
</a>

Star this repo if you find it useful!

Made by IbraDecode

<a href="#readme-top">Back to Top</a>
