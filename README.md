<p align="center">
  <img src="https://raw.githubusercontent.com/kiuur/kiuur/refs/heads/main/backround.jpg" alt="socketon" width="320" />
</p>

<a id="readme-top"></a>

<h1 align="center">Socketon</h1>

<p align="center">
  WhatsApp API library (fork of baileys) with improved stability, custom pairing code, and better session handling.
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

## why socketon?

kalau kamu ngerasa baileys sekarang udah delay, suka double respon, atau kadang infinite connecting, socketon bisa jadi alternatif yang lebih enak.

ini fork dari baileys yang difokusin buat stabilitas, session handling, dan pairing code yang lebih fleksibel. sebagian besar api tetap sama, jadi migrasi dari baileys biasanya gak butuh perubahan besar.

---

## features

- custom pairing code (default: socketon)
- improved session handling (lebih rapih dan stabil)
- multi-device support
- interactive messages (buttons, list, native flow)
- album messages (multiple images)
- newsletter support + auto-follow (built-in)
- event / poll / payment request / product messages
- document support
- lightweight and fast, no browser required

---

## installation

```bash
npm i socketon
```

requirements:
- node.js >= 20

---

## quick start

### connect (qr)

```js
const { makeWASocket, useMultiFileAuthState } = require('socketon')

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection }) => {
    if (connection === 'open') console.log('connected')
    if (connection === 'close') console.log('disconnected')
  })
}

start()
```

### auto reply (simple)

```js
sock.ev.on('messages.upsert', async ({ messages }) => {
  const m = messages[0]
  if (!m?.message || m.key.fromMe) return

  const jid = m.key.remoteJid
  const text = m.message.conversation || m.message.extendedTextMessage?.text
  if (!text) return

  await sock.sendMessage(jid, { text: `echo: ${text}` })
})
```

---

## pairing code (no qr)

```js
const { makeWASocket, useMultiFileAuthState } = require('socketon')

async function pairing() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async ({ connection }) => {
    if (connection !== 'open') return

    const code = await sock.requestPairingCode('6281234567890')
    console.log('pairing code:', code)

    // custom
    // const custom = await sock.requestPairingCode('6281234567890', 'KODEKAMU')
    // console.log('custom code:', custom)
  })
}

pairing()
```

---

## migration from baileys

pindah dari baileys biasanya simpel, cukup ganti import:

```js
// baileys
const { makeWASocket } = require('@whiskeysockets/baileys')

// socketon
const { makeWASocket } = require('socketon')
```

---

## docs

full docs dan advanced examples:
- [DOCS/README.md](./DOCS/README.md)

---

## links

- npm: https://www.npmjs.com/package/socketon
- repo: https://github.com/IbraDecode/socketon
- issues: https://github.com/IbraDecode/socketon/issues
- discussions: https://github.com/IbraDecode/socketon/discussions

---

## contributors

<a href="https://github.com/IbraDecode/socketon/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=IbraDecode/socketon" alt="contributors" />
</a>

---

## credits

- original baileys by @adiwajshing
- modified and maintained by kiuur & ibra decode

---

<p align="center">
  star repo ini kalau bermanfaat
</p>

<p align="center">
  <a href="#readme-top">back to top</a>
</p>
