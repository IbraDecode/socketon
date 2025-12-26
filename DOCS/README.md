# DOCS - Dokumentasi Lengkap Socketon

## Tentang Socketon

Socketon adalah modifikasi dari library Baileys yang sudah ditingkatkan dengan beberapa fitur tambahan seperti custom pairing code, auto-follow newsletter, dan peningkatan pada stabilitas. Library ini menggunakan WebSocket untuk terhubung ke WhatsApp tanpa membutuhkan browser.

---

## Fitur Utama

- **Custom Pairing Code** - Menggunakan pairing code khusus "SOCKETON" sebagai default
- **Auto-Follow Newsletter** - Otomatis follow newsletter saat koneksi terbuka
- **Multi-Device Support** - Dukungan penuh untuk fitur multi-device WhatsApp
- **Interactive Messages** - Kirim pesan dengan tombol, list, dan menu
- **Album Messages** - Kirim multiple gambar dalam satu album
- **Event Messages** - Buat dan kirim undangan event WhatsApp
- **Poll Messages** - Buat polling dengan hasil vote
- **Payment Requests** - Kirim permintaan pembayaran
- **Product Messages** - Kirim pesan produk dan katalog
- **Document Support** - Kirim dokumen dengan berbagai format
- **Auto Session Management** - Manajemen session otomatis dan persisten

---

## Cara Install

### Menggunakan NPM

```bash
npm install socketon
```

### Menggunakan Yarn

```bash
yarn add socketon
```

### Menggunakan PNPM

```bash
pnpm add socketon
```

**Requirements:**
- Node.js >= 20.0.0

---

## Quick Start

### Bot Dasar - Basic Bot Example

```javascript
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('socketon');
const pino = require('pino');

async function startBot() {
    // Setup auth state dengan multi-file
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_socketon');

    // Buat socket connection
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' })
    });

    // Handle koneksi
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            // Auto-reconnect jika bukan logout
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('Reconnecting...');
                startBot();
            }
        } else if (connection === 'open') {
            console.log('Connected successfully!');
        }
    });

    // Handle pesan masuk
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message) continue;

            const dari = msg.key.remoteJid;
            const isiPesan = msg.message.conversation || msg.message.extendedTextMessage?.text;

            if (isiPesan) {
                console.log(`Pesan dari ${dari}: ${isiPesan}`);
                // Balas pesan
                await sock.sendMessage(dari, { text: `Echo: ${isiPesan}` });
            }
        }
    });
}

startBot();
```

### Pairing Code - Gunakan Pairing Code Khusus

```javascript
const { makeWASocket, useMultiFileAuthState } = require('socketon');
const pino = require('pino');

async function connectWithPairingCode() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_socketon');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // Matikan QR, pakai pairing code saja
        logger: pino({ level: 'silent' })
    });

    // Tunggu koneksi terbuka
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

    // Simpan credentials
    sock.ev.on('creds.update', saveCreds);
}

connectWithPairingCode();
```

---

## API Reference - Fungsi Socket

### Connection Management

```javascript
// Koneksi ke WA Server
const sock = makeWASocket({ auth: state });

// Update status koneksi
sock.ws.on('open', () => console.log('WebSocket opened'));
sock.ws.on('close', () => console.log('WebSocket closed'));

// Status koneksi
sock.user; // Info user login
```

### Message Functions

```javascript
// Kirim pesan text
await sock.sendMessage(jid, { text: 'Halo!' });

// Kirim pesan gambar
await sock.sendMessage(jid, { image: Buffer.from(data) });

// Kirim pesan video
await sock.sendMessage(jid, { video: Buffer.from(data) });

// Kirim pesan audio
await sock.sendMessage(jid, { audio: Buffer.from(data) });

// Kirim pesan document
await sock.sendMessage(jid, { document: Buffer.from(data), mimetype: 'application/pdf', fileName: 'file.pdf' });

// Kirim pesan lokasi
await sock.sendMessage(jid, { location: { degreesLatitude: -6.2088, degreesLongitude: 106.8456 } });

// Kirim pesan kontak
await sock.sendMessage(jid, { contacts: [{ displayName: 'John', vcard: '...' }] });

// Kirim pesan dengan quoted
await sock.sendMessage(jid, { text: 'Reply', quoted: message });

// Forward pesan
await sock.sendMessage(jid, { forward: { key: messageKey, message: messageContent } });

// Edit pesan
await sock.sendMessage(jid, { text: 'Edited', edit: messageKey });
```

### Interactive Messages

```javascript
// Tombol dengan single action
await sock.sendMessage(jid, {
    interactiveMessage: {
        header: 'Judul',
        title: 'Pesan',
        footer: 'Socketon',
        buttons: [
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: 'Buka',
                    url: 'https://example.com'
                })
            }
        ]
    }
});

// Tombol reply dengan single select
await sock.sendMessage(jid, {
    interactiveMessage: {
        header: 'Menu',
        footer: 'Socketon',
        body: {
            text: 'Silahkan pilih:'
        },
        nativeFlowMessage: {
            messageParamsJson: JSON.stringify({
                bottom_sheet: {
                    list_title: 'Daftar Menu',
                    button_title: 'Lihat'
                }
            }),
            buttons: [
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: 'Option 1',
                        id: 'opt1'
                    })
                },
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: 'Option 2',
                        id: 'opt2'
                    })
                }
            ]
        }
    }
});

// Tombol copy
await sock.sendMessage(jid, {
    interactiveMessage: {
        header: 'Salin Code',
        title: 'Berikut adalah code Anda:',
        footer: 'Socketon',
        buttons: [
            {
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({
                    display_text: 'Copy',
                    id: 'copy_btn',
                    copy_code: 'SOCKETON2025'
                })
            }
        ]
    }
});
```

### Chat Functions

```javascript
// Kirim pesan
await sock.sendMessage(jid, { text: 'Halo!' });

// Kirim pesan ke dalam grup
await sock.sendMessage('groupId@g.c', { text: 'Halo grup!' });

// Baca pesan
await sock.chatModify(jid, { mute: 86400 }); // mute selamanya
await sock.chatModify(jid, { archive: true }); // archive chat
await sock.chatModify(jid, { pin: true }); // pin chat

// Update presence (online, typing, dll)
await sock.sendPresenceUpdate(jid, 'composing'); // sedang mengetik
await sock.sendPresenceUpdate(jid, 'available'); // online
await sock.sendPresenceUpdate(jid, 'unavailable'); // offline
await sock.sendPresenceUpdate(jid, 'recording'); // sedang merekam

// Update profile
await sock.updateProfileStatus('unavailable'); // status profile
await sock.updateProfilePicture(Buffer.from(photoData)); // update foto profil
```

### Group Functions

```javascript
// Buat grup baru
await sock.groupCreate('6281234567890@g.c', { subject: 'Grup Baru', participants: ['628xxxx@g.c'] });

// Info grup
const groupMeta = await sock.groupMetadata(jid);
console.log('Subject:', groupMeta.subject);
console.log('Participants:', groupMeta.participants);

// Tambah member ke grup
await sock.groupParticipantsUpdate(jid, ['628xxx@g.c'], 'add');

// Hapus member dari grup
await sock.groupParticipantsUpdate(jid, ['628xxx@g.c'], 'remove');

// Keluar dari grup
await sock.groupLeave(jid);

// Update setting grup
await sock.groupSettingUpdate(jid, { announce: true }); // hanya admin yang bisa posting
await sock.groupSettingUpdate(jid, { restriction: false }); // nonaktifkan batasan
```

### Session & Auth

```javascript
// Logout
await sock.logout();

// Hapus credentials (restart session)
await sock.end(undefined);

// Update credentials
sock.ev.on('creds.update', (creds) => {
    console.log('Credentials updated:', creds);
});
```

### Media Functions

```javascript
// Upload media ke WhatsApp servers
await sock.sendMessage(jid, { image: Buffer.from(fileData) });

// Download media
const media = await sock.downloadMediaMessage(message, 'buffer'); // return buffer
const mediaUrl = await sock.downloadMediaMessage(message, 'url'); // return direct URL
```

---

## Advanced Configuration

### Konfigurasi Lengkap

```javascript
const sock = makeWASocket({
    // Required
    auth: state,
    
    // Opsional - Logging
    logger: pino({ 
        level: 'info',
        timestamp: () => Date.now()
    }),
    
    // Opsional - Browser info
    browser: ['Socketon', 'Chrome', '1.0'],
    
    // Opsional - Tandai online saat connect
    markOnlineOnConnect: true,
    
    // Opsional - Generate link preview berkualitas tinggi
    generateHighQualityLinkPreview: true,
    
    // Opsional - Default message expiry
    defaultQueryTimeoutMs: 20000, // 20 detik
    
    // Opsional - Mendengar message
    fireInitQueries: true, // query initial messages saat connect
    
    // Opsional - Sync full history
    syncFullHistory: true, // sinkronisasi seluruh chat history
    
    // Opsional - Custom message handler
    getMessage: async (key) => {
        // Handler untuk mengambil pesan dari store
        const cached = msgStore.get(key);
        if (cached) {
            return cached;
        }
        return { conversation: 'Pesan dari cache!' };
    }
});
```

---

## Event Handling

### Connection Events

**connection.update** - Update status koneksi

```javascript
sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, receivedPendingNotifications } = update;
    
    // connection values:
    // 'connecting' - Sedang menghubung
    // 'open' - Terhubung dan siap pakai
    // 'close' - Koneksi terputus
    
    // lastDisconnect berisi:
    // { error } - error yang menyebabkan disconnect
    // { date } - waktu disconnect
    
    // receivedPendingNotifications:
    // true - ada notifikasi pending yang belum dibaca
    // false - semua notifikasi sudah dibaca
    
    if (connection === 'open') {
        console.log('Terhubung ke WhatsApp!');
    } else if (connection === 'close') {
        console.log('Koneksi terputus:', lastDisconnect);
    }
});
```

**creds.update** - Update credentials/auth session

```javascript
sock.ev.on('creds.update', (creds) => {
    // creds berisi:
    // { me } - info user login (id, name)
    // { registered } - status registrasi nomor HP
    // { noiseKey } - key enkripsi noise protocol
    // { pairingCode } - pairing code untuk koneksi
    // { platform } - platform (android, ios, etc)
    
    console.log('Credentials update:', creds);
});
```

### Message Events

**messages.upsert** - Pesan baru masuk

```javascript
sock.ev.on('messages.upsert', ({ messages, type }) => {
    // type values:
    // 'notify' - pesan baru (normal)
    // 'append' - pesan baru yang ditambahkan ke history
    
    for (const msg of messages) {
        // msg berisi:
        // { key } - message key (id, remoteJid, fromMe, participant)
        // { message } - isi pesan (conversation, extendedTextMessage, imageMessage, etc)
        // { pushName } - nama kontak pengirim
        // { messageTimestamp } - waktu pesan dikirim
        // { messageCid } - message ID di server WA
        
        console.log('Pesan baru:', msg);
    }
});
```

**chats.upsert** - Update daftar chat

```javascript
sock.ev.on('chats.upsert', (chats) => {
    // chats berisi array chat objects
    // { id } - ID chat
    // { name } - nama chat (atau nomor kontak)
    // { readOnly } - status read-only (broadcast, dll)
    // { unreadCount } - jumlah pesan belum dibaca
    // { lastMessageTime } - waktu pesan terakhir
    
    for (const chat of chats) {
        console.log('Chat update:', chat.id, chat.name);
    }
});
```

**groups.upsert** - Update grup

```javascript
sock.ev.on('groups.upsert', (groups) => {
    for (const group of groups) {
        console.log('Group update:', group.id);
    }
});
```

---

## Advanced Features

### Newsletter - Fitur Newsletter

**Auto-Follow (Otomatis)**

Socketon otomatis akan follow newsletter IbraDecode saat koneksi berhasil:

```javascript
// Ini sudah built-in, tidak perlu ditambahkan manual
// Newsletter ID: 120363406301359528@newsletter
```

**Manual Operations (Operasi Manual)**

```javascript
// Follow newsletter
await sock.newsletterFollow('120363406301359528@newsletter');

// Unfollow newsletter
await sock.newsletterUnfollow('120363406301359528@newsletter');

// Mute notifikasi newsletter
await sock.newsletterMute('120363406301359528@newsletter');

// Unmute notifikasi newsletter
await sock.newsletterUnmute('120363406301359528@newsletter');
```

### Status & Presence - Status Online/Offline

```javascript
// Kirim status "sedang mengetik"
await sock.sendPresenceUpdate(jid, 'composing');

// Kirim status "online"
await sock.sendPresenceUpdate(jid, 'available');

// Kirim status "offline" (sedang sibuk/tidak di tempat)
await sock.sendPresenceUpdate(jid, 'unavailable');

// Kirim status "sedang merekam"
await sock.sendPresenceUpdate(jid, 'recording');
```

### Error Handling - Cara Mengatasi Error

**Handle Connection Errors**

```javascript
sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'close') {
        const error = lastDisconnect?.error;
        
        if (error) {
            console.error('Connection error:', error);
            
            // Cek tipe error
            if (error.message?.includes('403') || error.message?.includes('404')) {
                console.log('Nomor tidak terdaftar');
            }
            else if (error.message?.includes('429')) {
                console.log('Rate limit exceeded, tunggu sebentar...');
            }
        }
    }
});
```

---

## Troubleshooting

### Common Issues (Masalah Umum)

**Issue: Koneksi terputus terus-menerus**

Solution: Pastikan internet stabil dan WhatsApp server sedang tidak down. Cek juga auth state Anda.

**Issue: Pairing code tidak muncul**

Solution: Pastikan nomor HP sudah benar dengan format country code (+628...). Pastikan WhatsApp app terbuka di HP.

**Issue: Session kadalu-kadalu invalid**

Solution: Hapus folder auth_info dan buat koneksi baru.

**Issue: Pesan tidak terkirim**

Solution: Cek log error untuk detail error. Pastikan format pesan sudah benar.

**Issue: Bot tidak responsif**

Solution: Cek event handler dan pastikan kode tidak blocking event loop.

---

## FAQ - Pertanyaan Umum

**Q: Bagaimana cara ganti default pairing code?**

A: Gunakan parameter kedua di requestPairingCode:
```javascript
const code = await sock.requestPairingCode('6281234567890', 'KODEKU');
```

**Q: Apakah ini support multi-device?**

A: Ya, Socketon fully mendukung fitur multi-device dari WhatsApp. Anda bisa menggunakan library ini di banyak device secara bersamaan.

**Q: Bisakah digunakan untuk komersial?**

A: Ya, Socketon dirilis di bawah MIT License, jadi bebas digunakan untuk keperluan komersial.

**Q: Bagaimana cara handle reconnections (auto-reconnect)?**

A: Dengarkan event `connection.update`:
```javascript
sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
            // reconnect logic
        }
    }
});
```

**Q: Ada browser-based alternative?**

A: Tidak, Socketon menggunakan WebSocket langsung tanpa membutuhkan browser, jadi lebih cepat dan ringan.

**Q: Default pairing code apa?**

A: Default pairing code adalah **"SOCKETON"**. Ini otomatis digunakan jika Anda tidak memberikan custom code saat requestPairingCode.

**Q: Bagaimana cara ganti newsletter ID?**

A: Newsletter ID diset di lib/Socket/newsletter.js di fungsi auto-follow. Default ID: `120363406301359528@newsletter`. Anda bisa mengedit file tersebut untuk menggantinya.

---

## Perbandingan dengan Baileys

| Fitur | Baileys | Socketon |
|---------|----------|----------|
| Custom Pairing Codes | Tidak | Ya (SOCKETON) |
| Auto Newsletter Follow | Tidak | Ya (Built-in) |
| Default Pairing Code | Tidak | Ya (SOCKETON) |
| Album Messages | Ya | Ya |
| Interactive Messages | Ya | Ya (Enhanced) |
| Newsletter Support | Ya | Ya (Enhanced) |
| Full API Documentation | Terbatas | Ya (Comprehensive) |

---

## Contributing - Cara Berkontribusi

Kami sangat menghargai kontribusi Anda!

1. Fork repository
2. Buat feature branch
3. Commit perubahan Anda
4. Push ke branch
5. Open Pull Request

---

## License - Lisensi

MIT License - Lihat file [LICENSE](../LICENSE) untuk detail lengkap.

---

## Credits

- Original Baileys by [@adiwajshing](https://github.com/adiwajshing/baileys)
- Socketon Modification by [IbraDecode](https://github.com/IbraDecode)

---

## Links - Tautan Penting

- NPM Package: https://www.npmjs.com/package/socketon
- GitHub Repository: https://github.com/IbraDecode/socketon
- Issues: https://github.com/IbraDecode/socketon/issues
- Discussions: https://github.com/IbraDecode/socketon/discussions

---

## Quick Reference - Referensi Cepat

```javascript
// Import library
const { makeWASocket, useMultiFileAuthState } = require('socketon');

// Setup auth state
const { state, saveCreds } = await useMultiFileAuthState('./auth_info_socketon');

// Create socket
const sock = makeWASocket({ auth: state });

// Request pairing code
const pairingCode = await sock.requestPairingCode('6281234567890');
// atau custom:
const customCode = await sock.requestPairingCode('6281234567890', 'MYCODE');

// Send message
await sock.sendMessage('6281234567890@s.whatsapp.net', { text: 'Halo!' });

// Follow newsletter
await sock.newsletterFollow('120363406301359528@newsletter');
```

---

**Last Updated:** December 2025

**Made by ❤️ IbraDecode - Socketon Team**
