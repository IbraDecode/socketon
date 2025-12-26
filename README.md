<a id="readme-top"></a>

# 🚀 Socketon

[![NPM Version](https://img.shields.io/npm/v/socketon?style=flat-square)](https://www.npmjs.com/package/socketon)
[![NPM Downloads](https://img.shields.io/npm/dm/socketon?style=flat-square)](https://www.npmjs.com/package/socketon)
[![License](https://img.shields.io/npm/l/socketon?style=flat-square)](https://github.com/IbraDecode/baileys)
[![Node Version](https://img.shields.io/node/v/socketon?style=flat-square)](https://github.com/IbraDecode/baileys)

<p align="center">
  <img src="https://files.catbox.moe/369pux.jpg" alt="Socketon Logo" width="300" />
</p>

<p align="center">
  <b>WhatsApp API Library - Modified & Enhanced</b><br>
  Stable, Fast, and Feature-Rich WhatsApp Automation Library
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-documentation">Documentation</a> •
  <a href="#-examples">Examples</a>
</p>

---

## 📖 About

**Socketon** is a powerful WhatsApp API library forked from Baileys, enhanced with improved stability, custom pairing codes, and better session management. It uses WebSocket technology to connect to WhatsApp without requiring a browser, making it lightweight and efficient.

This library is actively maintained and continuously updated to ensure compatibility with the latest WhatsApp features, including multi-device support, interactive messages, and advanced automation capabilities.

---

## ✨ Features

- 🔗 **Custom Pairing Codes** - Use your own pairing codes for stable authentication
- 📱 **Multi-Device Support** - Full support for WhatsApp's multi-device features
- 💬 **Interactive Messages** - Send buttons, lists, and dynamic menus
- 📊 **Album Messages** - Send multiple images in a single album
- 📈 **Newsletter Support** - Auto-follow newsletters and manage channels
- 🎯 **Event Messages** - Create and manage WhatsApp events
- 📝 **Poll Messages** - Create polls and display results
- 💳 **Payment Messages** - Send payment requests
- 🛒 **Product Messages** - Display products and catalogs
- 📎 **Document Support** - Send documents with rich formatting
- 🔄 **Auto Session Management** - Persistent and reliable session handling
- 🚀 **High Performance** - Lightweight and fast, no browser required

---

## 📦 Installation

```bash
# Using npm
npm install socketon

# Using yarn
yarn add socketon

# Using pnpm
pnpm add socketon
```

**Requirements:**
- Node.js >= 20.0.0
- npm or yarn package manager

---

## 🚀 Quick Start

### Basic Bot Example

```javascript
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('socketon');
const pino = require('pino');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' })
    });

    // Auto-reconnect on disconnect
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('✅ Bot connected successfully!');
        }
    });

    // Listen for messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message) continue;

            const from = msg.key.remoteJid;
            const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text;

            if (messageContent) {
                console.log(`📩 Message from ${from}: ${messageContent}`);

                // Reply to the message
                await sock.sendMessage(from, { text: `Echo: ${messageContent}` });
            }
        }
    });
}

startBot();
```

### Pairing Code Example

```javascript
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('socketon');
const pino = require('pino');

async function connectWithPairingCode() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // Disable QR
        logger: pino({ level: 'silent' })
    });

    // Request pairing code
    sock.ev.on('connection.update', async (update) => {
        const { connection } = update;

        if (connection === 'open') {
            console.log('✅ Connected!');

            // Request pairing code with default "SOCKETON"
            const pairingCode = await sock.requestPairingCode('6281234567890');
            console.log(`📱 Pairing Code: ${pairingCode}`);

            // Or use custom pairing code
            const customCode = await sock.requestPairingCode('6281234567890', 'MYCODE');
            console.log(`📱 Custom Pairing Code: ${customCode}`);
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

connectWithPairingCode();
```

---

## 📚 Documentation

### SendMessage Methods

#### Album Message (Multiple Images)

Send multiple images in a single album:

```javascript
await sock.sendMessage(jid, {
    albumMessage: [
        { image: fs.readFileSync('./image1.jpg'), caption: "First image" },
        { image: { url: "https://example.com/image2.jpg" }, caption: "Second image" }
    ]
});
```

#### Event Message

Create and send WhatsApp event invitations:

```javascript
await sock.sendMessage(jid, {
    eventMessage: {
        isCanceled: false,
        name: "My Event",
        description: "Event description",
        location: {
            degreesLatitude: 0,
            degreesLongitude: 0,
            name: "Location Name"
        },
        joinLink: "https://call.whatsapp.com/video/xyz",
        startTime: "1763019000",
        endTime: "1763026200",
        extraGuestsAllowed: false
    }
});
```

#### Poll Result Message

Display poll results with vote counts:

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

#### Interactive Message (Simple)

Send interactive messages with copy button:

```javascript
await sock.sendMessage(jid, {
    interactiveMessage: {
        header: "Header Text",
        title: "Title Text",
        footer: "Footer Text",
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

#### Interactive Message with Native Flow

Advanced interactive messages with multiple button types:

```javascript
await sock.sendMessage(jid, {
    interactiveMessage: {
        header: "Advanced Menu",
        title: "Choose an option",
        footer: "Powered by Socketon",
        image: { url: "https://example.com/image.jpg" },
        nativeFlowMessage: {
            messageParamsJson: JSON.stringify({
                bottom_sheet: {
                    in_thread_buttons_limit: 2,
                    list_title: "Menu Options",
                    button_title: "View Menu"
                }
            }),
            buttons: [
                {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({
                        display_text: "Copy Code",
                        id: "copy_btn",
                        copy_code: "SOCKETON"
                    })
                },
                {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                        title: "Select Option",
                        sections: [
                            {
                                title: "Main Menu",
                                rows: [
                                    {
                                        title: "Option 1",
                                        description: "Description 1",
                                        id: "opt_1"
                                    },
                                    {
                                        title: "Option 2",
                                        description: "Description 2",
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

#### Product Message

Send product catalog messages:

```javascript
await sock.sendMessage(jid, {
    productMessage: {
        title: "Product Name",
        description: "Product description",
        thumbnail: { url: "https://example.com/thumbnail.jpg" },
        productId: "PROD001",
        retailerId: "RETAIL001",
        url: "https://example.com/product",
        body: "Product Details",
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

#### Interactive Message with Document

Send documents with interactive buttons:

```javascript
await sock.sendMessage(jid, {
    interactiveMessage: {
        header: "Document Header",
        title: "Document Title",
        footer: "Powered by Socketon",
        document: fs.readFileSync('./document.pdf'),
        mimetype: "application/pdf",
        fileName: "document.pdf",
        jpegThumbnail: fs.readFileSync('./thumbnail.jpg'),
        buttons: [
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "Open Link",
                    url: "https://example.com"
                })
            }
        ]
    }
});
```

#### Payment Request Message

Send payment requests:

```javascript
await sock.sendMessage(jid, {
    requestPaymentMessage: {
        currency: "IDR",
        amount: 100000,
        from: jid,
        note: "Payment for services",
        expiryTimestamp: Math.floor(Date.now() / 1000) + 3600
    }
});
```

---

## 🔧 Configuration

### Socket Configuration Options

```javascript
const sock = makeWASocket({
    // Required
    auth: state,

    // Optional
    printQRInTerminal: true,        // Print QR code in terminal
    logger: pino({ level: 'info' }), // Logging level
    browser: ['Socketon', 'Chrome', '1.0'], // Browser info
    markOnlineOnConnect: true,       // Mark as online when connected
    generateHighQualityLinkPreview: true, // Better link previews
    getMessage: async (key) => {    // Custom message fetching
        return { conversation: "Hello" };
    },
    patchMessageBeforeSending: (message) => { // Modify messages before sending
        return message;
    }
});
```

---

## 🛠️ Advanced Features

### Newsletter Features

```javascript
// Auto-follow newsletter on connection
// (Built-in feature - automatically follows IbraDecode channel)

// Manual newsletter operations
await sock.newsletterFollow('120363402357934798@newsletter');
await sock.newsletterUnfollow('120363402357934798@newsletter');
await sock.newsletterMute('120363402357934798@newsletter');
await sock.newsletterUnmute('120363402357934798@newsletter');
```

### Session Management

```javascript
const { useMultiFileAuthState } = require('socketon');

// Save session to multiple files
const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

// Save credentials
sock.ev.on('creds.update', saveCreds);
```

### Connection Events

```javascript
// Connection updates
sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, receivedPendingNotifications } = update;

    if (connection === 'open') {
        console.log('✅ Connected');
    } else if (connection === 'close') {
        console.log('❌ Disconnected:', lastDisconnect?.error);
    }
});

// Credentials update
sock.ev.on('creds.update', saveCreds);

// Messages
sock.ev.on('messages.upsert', ({ messages, type }) => {
    console.log('New messages:', messages);
});

// Chats
sock.ev.on('chats.upsert', (chats) => {
    console.log('New chats:', chats);
});

// Groups
sock.ev.on('groups.upsert', (groups) => {
    console.log('New groups:', groups);
});
```

---

## ❓ FAQ

### Q: How do I change the default pairing code?
A: Use the second parameter when calling `requestPairingCode`:
```javascript
const code = await sock.requestPairingCode('6281234567890', 'MYCUSTOMCODE');
```

### Q: Does this support multiple devices?
A: Yes, Socketon fully supports WhatsApp's multi-device features.

### Q: Can I use this for commercial purposes?
A: Yes, Socketon is released under MIT license and can be used for commercial projects.

### Q: How do I handle reconnections?
A: Listen to the `connection.update` event and reconnect on disconnect (see Quick Start example).

### Q: Is there a browser-based alternative?
A: No, Socketon uses WebSocket directly without requiring a browser, making it more efficient.

---

## 📊 Comparison with Baileys

| Feature | Baileys | Socketon |
|---------|----------|----------|
| Custom Pairing Codes | ❌ | ✅ |
| Auto Newsletter Follow | ❌ | ✅ |
| Default Pairing Code | ❌ | ✅ (SOCKETON) |
| Number Validation | ❌ | ✅ (Customizable) |
| Album Messages | ✅ | ✅ |
| Interactive Messages | ✅ | ✅ |
| Newsletter Support | ✅ | ✅ Enhanced |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Credits

- **Original Baileys** by [@adiwajshing](https://github.com/adiwajshing/baileys)
- **Socketon Modification** by [IbraDecode](https://github.com/IbraDecode)

---

## 🔗 Links

- **NPM Package**: https://www.npmjs.com/package/socketon
- **GitHub Repository**: https://github.com/IbraDecode/baileys
- **Issues**: https://github.com/IbraDecode/baileys/issues
- **Discussions**: https://github.com/IbraDecode/baileys/discussions

---

### Top Contributors

<a href="https://github.com/IbraDecode/Baileys/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=IbraDecode/Baileys" alt="contrib.rocks image" />
</a>

---

<p align="center">
  <b>⭐ Star this repo if you find it useful!</b><br>
  Made with ❤️ by IbraDecode
</p>

<a href="#readme-top">⬆ Back to Top</a>
