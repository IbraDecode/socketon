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

## Mulai Cepat (Quick Start)

### Bot Dasar - Basic Bot Example

```javascript
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('socketon');
const pino = require('pino');

async function mulaiBot() {
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
                mulaiBot();
            }
        } else if (connection === 'open') {
            console.log('✅ Terhubung!');
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
                console.log(`📩 Pesan dari ${dari}: ${isiPesan}`);
                // Balas pesan
                await sock.sendMessage(dari, { text: `📤 Echo: ${isiPesan}` });
            }
        }
    });
}

// Jalankan bot
mulaiBot();
```

### Pairing Code - Gunakan Pairing Code Khusus

```javascript
const { makeWASocket, useMultiFileAuthState } = require('socketon');
const pino = require('pino');

async function koneksiPairingCode() {
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
            console.log(`🔐 Default Pairing Code: ${pairingCodeDefault}`);

            // Custom pairing code
            const pairingCodeCustom = await sock.requestPairingCode('6281234567890', 'KODEKU');
            console.log(`🔐 Custom Pairing Code: ${pairingCustom}`);
        }
    });

    // Simpan credentials
    sock.ev.on('creds.update', saveCreds);
}

// Jalankan
koneksiPairingCode();
```

---

## Fungsi sendMessage - Dokumentasi Lengkap

### 1. Album Message - Kirim Banyak Foto Sekaligus

Kirim multiple gambar dalam satu pesan album:

```javascript
await sock.sendMessage(jid, {
    albumMessage: [
        { image: fs.readFileSync('./foto1.jpg'), caption: "Foto pertama nih" },
        { image: { url: "https://example.com/foto2.jpg" }, caption: "Foto kedua nih" }
    ]
});
```

### 2. Event Message - Undangan Event WhatsApp

Buat dan kirim undangan event WhatsApp:

```javascript
await sock.sendMessage(jid, {
    eventMessage: {
        isCanceled: false,
        name: "Rapat Penting",
        description: "Rapat pembahasan project Socketon",
        location: {
            degreesLatitude: -6.2088,
            degreesLongitude: 106.8456,
            name: "Jakarta"
        },
        joinLink: "https://call.whatsapp.com/video/xyz",
        startTime: "1763019000",
        endTime: "1763026200",
        extraGuestsAllowed: false
    }
});
```

### 3. Poll Result Message - Hasil Polling

Tampilkan hasil polling dengan jumlah vote:

```javascript
await sock.sendMessage(jid, {
    pollResultMessage: {
        name: "Polling Favorit Kamu",
        pollVotes: [
            {
                optionName: "Socketon",
                optionVoteCount: "150"
            },
            {
                optionName: "Baileys",
                optionVoteCount: "50"
            },
            {
                optionName: "WhatsApp Web",
                optionVoteCount: "20"
            }
        ]
    }
});
```

### 4. Interactive Message (Simple) - Tombol Copy

Kirim pesan interaktif sederhana dengan tombol copy:

```javascript
await sock.sendMessage(jid, {
    interactiveMessage: {
        header: "Halo!",
        title: "Ini judul pesan",
        footer: "Powered by Socketon",
        buttons: [
            {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                    display_text: "Copy Code",
                    id: "copy_button",
                    copy_code: "SOCKETON2025"
                })
            }
        ]
    }
});
```

### 5. Interactive Message with Native Flow - Menu dengan List

Kirim pesan interaktif dengan menu dan tombol:

```javascript
await sock.sendMessage(jid, {
    interactiveMessage: {
        header: "📋 Menu Utama",
        title: "Pilih opsi di bawah:",
        footer: "Socketon Bot",
        image: { url: "https://example.com/gambar.jpg" },
        nativeFlowMessage: {
            messageParamsJson: JSON.stringify({
                bottom_sheet: {
                    in_thread_buttons_limit: 2,
                    list_title: "Opsi Tersedia",
                    button_title: "Lihat Semua"
                }
            }),
            buttons: [
                {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({
                        display_text: "Salin Link",
                        id: "copy_btn",
                        copy_code: "https://github.com/IbraDecode/baileys"
                    })
                },
                {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                        title: "Pilih Menu",
                        sections: [
                            {
                                title: "Kategori Utama",
                                rows: [
                                    {
                                        title: "📖 Informasi",
                                        description: "Lihat info lengkap",
                                        id: "info"
                                    },
                                    {
                                        title: "⚙️ Pengaturan",
                                        description: "Atur preferensi",
                                        id: "settings"
                                    },
                                    {
                                        title: "📞 Kontak",
                                        description: "Hubungi kami",
                                        id: "contact"
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

### 6. Product Message - Kirim Produk

Kirim pesan produk dengan tombol beli:

```javascript
await sock.sendMessage(jid, {
    productMessage: {
        title: "Produk Unggulan",
        description: "Ini deskripsi produk yang sangat menarik dan bermanfaat bagi pengguna",
        thumbnail: { url: "https://example.com/gambar-produk.jpg" },
        productId: "PROD001",
        retailerId: "TOKO001",
        url: "https://example.com/produk",
        body: "Detail lengkap produk:",
        footer: "Stok Terbatas",
        priceAmount1000: 150000,
        currencyCode: "IDR",
        buttons: [
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "Beli Sekarang",
                    url: "https://example.com/beli"
                })
            }
        ]
    }
});
```

### 7. Interactive Message with Document - Kirim Dokumen

Kirim dokumen PDF dengan tombol:

```javascript
await sock.sendMessage(jid, {
    interactiveMessage: {
        header: "📄 Dokumen",
        title: "Dokumen Penting",
        footer: "Socketon Library",
        document: fs.readFileSync('./laporan.pdf'),
        mimetype: "application/pdf",
        fileName: "laporan-socketon.pdf",
        jpegThumbnail: fs.readFileSync('./thumbnail-dokumen.jpg'),
        buttons: [
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "Buka Link",
                    url: "https://example.com/download"
                })
            }
        ]
    }
});
```

### 8. Payment Request Message - Permintaan Pembayaran

Kirim permintaan pembayaran:

```javascript
await sock.sendMessage(jid, {
    requestPaymentMessage: {
        currency: "IDR",
        amount: 500000,
        from: jid,
        note: "Pembayaran untuk layanan Socketon",
        expiryTimestamp: Math.floor(Date.now() / 1000) + 3600 // 1 jam
    }
});
```

---

## Konfigurasi Socket - Socket Configuration

### Konfigurasi Lengkap

```javascript
const sock = makeWASocket({
    // Diperlukan
    auth: state,

    // Opsional - Logging
    logger: pino({ level: 'info' }),
    
    // Opsional - Browser info
    browser: ['Socketon', 'Chrome', '1.0'],
    
    // Opsional - Tandai online saat connect
    markOnlineOnConnect: true,
    
    // Opsional - Generate link preview berkualitas tinggi
    generateHighQualityLinkPreview: true,
    
    // Opsional - Custom message handler
    getMessage: async (key) => {
        return { conversation: "Halo dari Socketon!" };
    }
});
```

---

## Event - Events

### Connection Events

**connection.update** - Update status koneksi

```javascript
sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, receivedPendingNotifications } = update;
    
    console.log('Status Koneksi:', connection);
    console.log('Notifikasi Pending:', receivedPendingNotifications);
    
    // connection values: 'connecting', 'open', 'close'
    if (connection === 'open') {
        console.log('✅ Terhubung ke WhatsApp!');
    } else if (connection === 'close') {
        console.log('❌ Koneksi terputus');
    }
});
```

### Credentials Events

**creds.update** - Update credentials/auth session

```javascript
sock.ev.on('creds.update', (creds) => {
    console.log('Update credentials:', creds);
    // creds berisi: me, registered, noiseKey, dll
});
```

### Message Events

**messages.upsert** - Pesan baru masuk

```javascript
sock.ev.on('messages.upsert', ({ messages, type }) => {
    // type values: 'notify', 'append'
    for (const msg of messages) {
        console.log('Pesan baru:', msg);
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

### Session Management - Manajemen Session

**Multi-File Auth State**

```javascript
const { useMultiFileAuthState } = require('socketon');

async function setupSession() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_socketon');
    
    // Simpan credentials setiap update
    sock.ev.on('creds.update', saveCreds);
    
    // state berisi: creds (auth) dan keys (encryption)
}
```

---

## FAQ - Pertanyaan Umum

**Q: Bagaimana cara ganti default pairing code?**

A: Gunakan parameter kedua di requestPairingCode:
```javascript
const code = await sock.requestPairingCode('6281234567890', 'KODECUSTOM');
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

A: Newsletter ID diset di lib/Socket/newsletter.js di fungsi auto-follow. Default ID: `120363406301359528@newsletter`.

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
- GitHub Repository: https://github.com/IbraDecode/baileys
- Issues: https://github.com/IbraDecode/baileys/issues
- Discussions: https://github.com/IbraDecode/baileys/discussions

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
