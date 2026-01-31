const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');

// --- KONFIGURASI ---
const token = '8302488902:AAHaD_W255L-Y5miqv3ogE-SpyY4EpUxXtw';
const bot = new TelegramBot(token, { polling: true });

const SETTINGS = {
    ownerId: 8457401920, // ID Telegram Kamu
    dev: "NaelDev",
    atlanticKey: "cIr6yFSfNiCtzfOw50IIb8xvviGlG4U9o7wLe60Pvrz9os0Ff0ARoAMKdNj7YyqVYi25YtfQoyGVlPo8ce3wAuawklZJlqJF6mmN",
    githubToken: "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",
    githubRaw: "https://api.github.com/repos/ajayajay293/database/contents/database.json",
    price: 5500, // Harga 5k + Admin 500
    channels: ["@OrderOTP", "@FajarGanteng", "@zCekID"]
};

global.subdomain = { 
    "privateeserverr.my.id": { 
        zone: "2b47743c5a3afecde36ffa0f52073270",
        apitoken: "2ltJMUmL2QZ-H3IQ0NGM8n84zxoJlU1D8Wwj26AB"
    },
    "publicserverr.my.id": { 
        zone: "b23d82b98aa932317c93571a3846240a",
        apitoken: "2ltJMUmL2QZ-H3IQ0NGM8n84zxoJlU1D8Wwj26AB"
    }
};

let db = { users: {}, deposits: [], premium: [] };
const userStates = new Map();

// --- DATABASE GITHUB ---
async function saveDb() {
    try {
        const currentFile = await axios.get(SETTINGS.githubRaw, {
            headers: { Authorization: `token ${SETTINGS.githubToken}` }
        });
        const sha = currentFile.data.sha;
        const content = Buffer.from(JSON.stringify(db, null, 2)).toString('base64');
        await axios.put(SETTINGS.githubRaw, {
            message: "update database",
            content: content,
            sha: sha
        }, { headers: { Authorization: `token ${SETTINGS.githubToken}` } });
    } catch (e) { console.log("Gagal save DB ke Github"); }
}

async function loadDb() {
    try {
        const res = await axios.get(SETTINGS.githubRaw, {
            headers: { Authorization: `token ${SETTINGS.githubToken}` }
        });
        db = JSON.parse(Buffer.from(res.data.content, 'base64').toString());
    } catch (e) { console.log("Gagal load DB"); }
}

loadDb();

// --- UTILS ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function checkSub(msg) {
    for (const channel of SETTINGS.channels) {
        try {
            const chat = await bot.getChatMember(channel, msg.from.id);
            if (chat.status === 'left' || chat.status === 'kicked') return false;
        } catch (e) { return false; }
    }
    return true;
}

// --- COMMANDS ---

bot.onText(/\/start/, async (msg) => {
    const isSub = await checkSub(msg);
    if (!isSub) {
        return bot.sendMessage(msg.chat.id, `<blockquote>❌ Akses Ditolak!\n\nAnda harus bergabung ke channel sponsor kami terlebih dahulu:\n1. ${SETTINGS.channels.join('\n2. ')}</blockquote>`, {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [[{ text: "Cek Status Gabung", callback_data: "check_sub" }]] }
        });
    }

    const videoUrl = "https://files.catbox.moe/b6ykx3.mp4";
    const teks = `<blockquote>✨ SELAMAT DATANG DI SUBDO BOT ✨\n\nLayanan pembuatan subdomain otomatis dan permanen.\n\n⚠️ <b>S&K:</b>\n- Dilarang spam bot.\n- Subdomain dilarang untuk phising.\n- Pembayaran 5k sekali bayar (Permanen).\n\nSilahkan pilih menu di bawah:</blockquote>`;
    
    bot.sendVideo(msg.chat.id, videoUrl, {
        caption: teks,
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: "🚀 Create Subdomain", callback_data: "menu_create" }],
                [{ text: "💳 Beli Akses Premium", callback_data: "buy_premium" }],
                [{ text: "👤 Profile", callback_data: "my_profile" }]
            ]
        }
    });
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;

    if (data === "menu_create") {
        if (!db.premium.includes(userId) && userId !== SETTINGS.ownerId) {
            return bot.sendMessage(chatId, `<blockquote>❌ Akses Ditolak!\n\nFitur ini khusus User Premium. Silahkan beli akses seharga Rp 5.500 (Termasuk Admin).</blockquote>`, {
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: [[{ text: "Beli Sekarang", callback_data: "buy_premium" }, { text: "Kembali", callback_data: "start_back" }]] }
            });
        }
        userStates.set(chatId, { step: 'get_host' });
        bot.sendMessage(chatId, `<blockquote>⌨️ Masukkan Hostname yang diinginkan:\n(Contoh: serverganteng)</blockquote>`, { parse_mode: 'HTML' });
    }

    if (data === "buy_premium") {
        bot.sendMessage(chatId, "<blockquote>⏳ Menyiapkan QRIS Pembayaran...</blockquote>", { parse_mode: 'HTML' });
        try {
            const reff_id = `PREM-${Date.now()}`;
            const res = await axios.post('https://atlantich2h.com/deposit/create', 
                `api_key=${SETTINGS.atlanticKey}&reff_id=${reff_id}&nominal=${SETTINGS.price}&type=ewallet&metode=qris`,
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            if (res.data.status) {
                const deposit = res.data.data;
                const teks = `<blockquote>💳 <b>DETAIL PEMBAYARAN QRIS</b>\n\nID: <code>${deposit.id}</code>\nNominal: Rp ${deposit.nominal}\nStatus: PENDING\n\nSilahkan Scan QRIS di atas. Bot akan otomatis cek status setiap 2 detik.</blockquote>`;
                
                await bot.sendPhoto(chatId, deposit.qr_image, {
                    caption: teks,
                    parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: [[{ text: "Batal", callback_data: `cancel_depo_${deposit.id}` }]] }
                });

                // Auto Check Loop
                let isPaid = false;
                for (let i = 0; i < 300; i++) { // Max 10 menit
                    await sleep(2000);
                    const statusRes = await axios.post('https://atlantich2h.com/deposit/status', 
                        `api_key=${SETTINGS.atlanticKey}&id=${deposit.id}`,
                        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                    );

                    if (statusRes.data.data.status === 'success') {
                        isPaid = true;
                        db.premium.push(userId);
                        db.deposits.push({ userId, id: deposit.id, date: new Date() });
                        await saveDb();
                        bot.sendMessage(chatId, "<blockquote>✅ PEMBAYARAN BERHASIL!\n\nSekarang anda adalah user Premium. Silahkan gunakan menu /start lagi.</blockquote>", { parse_mode: 'HTML' });
                        break;
                    } else if (statusRes.data.data.status === 'processing') {
                        // Jalankan instant jika nyangkut
                        await axios.post('https://atlantich2h.com/deposit/instant', 
                            `api_key=${SETTINGS.atlanticKey}&id=${deposit.id}&action=true`,
                            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                        );
                    }
                }
            }
        } catch (e) { bot.sendMessage(chatId, "❌ Gagal membuat QRIS."); }
    }

    // Handler Create Subdomain
    if (data.startsWith("exec_subdo_")) {
        const [_, index, host, ip] = data.split("|");
        const tld = Object.keys(global.subdomain)[index];
        const config = global.subdomain[tld];

        const anim = ["█▒▒▒▒▒▒▒▒▒10%", "███▒▒▒▒▒▒▒30%", "█████▒▒▒▒▒50%", "███████▒▒▒70%", "██████████100%"];
        let msg = await bot.sendMessage(chatId, "<blockquote>🚀 Memproses...</blockquote>", { parse_mode: 'HTML' });

        for (let a of anim) {
            await sleep(500);
            await bot.editMessageText(`<blockquote>${a}\nSedang mendaftarkan DNS...</blockquote>`, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'HTML' });
        }

        try {
            const res = await axios.post(`https://api.cloudflare.com/client/v4/zones/${config.zone}/dns_records`, {
                type: "A", name: `${host}.${tld}`, content: ip, ttl: 1, proxied: false
            }, {
                headers: { "Authorization": `Bearer ${config.apitoken}`, "Content-Type": "application/json" }
            });

            if (res.data.success) {
                bot.editMessageText(`<blockquote>✅ <b>SUBDOMAIN BERHASIL!</b>\n\n🌐 Host: <code>${res.data.result.name}</code>\n📌 IP: <code>${res.data.result.content}</code>\n\nTerima kasih telah berlangganan!</blockquote>`, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'HTML' });
            }
        } catch (e) {
            bot.editMessageText("<blockquote>❌ Gagal! Domain mungkin sudah ada atau API Error.</blockquote>", { chat_id: chatId, message_id: msg.message_id, parse_mode: 'HTML' });
        }
    }
});

// --- TEXT HANDLER FOR MULTI STEP ---
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const state = userStates.get(chatId);

    if (state && state.step === 'get_host') {
        state.host = text.toLowerCase().replace(/[^a-z0-9]/g, '');
        state.step = 'get_ip';
        userStates.set(chatId, state);
        bot.sendMessage(chatId, "<blockquote>📍 Masukkan IP Address (V4):\n(Contoh: 1.2.3.4)</blockquote>", { parse_mode: 'HTML' });
    } 
    else if (state && state.step === 'get_ip') {
        const ip = text.trim();
        const domains = Object.keys(global.subdomain);
        const buttons = domains.map((d, i) => ([{ text: d, callback_data: `exec_subdo_|${i}|${state.host}|${ip}` }]));
        
        userStates.delete(chatId);
        bot.sendMessage(chatId, "<blockquote>🌐 Pilih Domain Utama:</blockquote>", {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: buttons }
        });
    }
});

// --- OWNER FEATURES ---
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
    if (msg.from.id !== SETTINGS.ownerId) return;
    const pesan = match[1];
    bot.sendMessage(chatId, "<blockquote>📣 Memulai Broadcast...</blockquote>", { parse_mode: 'HTML' });
    // Simulasi ke user di DB (Anda perlu menyimpan userId setiap yang start di db.users)
    for (let u of Object.keys(db.users)) {
        bot.sendMessage(u, `<blockquote>📣 <b>BROADCAST OWNER</b>\n\n${pesan}</blockquote>`, { parse_mode: 'HTML' });
    }
});

bot.onText(/\/addprem (.+)/, async (msg, match) => {
    if (msg.from.id !== SETTINGS.ownerId) return;
    const target = parseInt(match[1]);
    db.premium.push(target);
    await saveDb();
    bot.sendMessage(msg.chat.id, `<blockquote>✅ Berhasil menambah premium: ${target}</blockquote>`, { parse_mode: 'HTML' });
});

bot.onText(/\/owner/, (msg) => {
    bot.sendMessage(msg.chat.id, `<blockquote>👑 <b>OWNER INFO</b>\n\nDev: @${SETTINGS.dev}\nID: ${SETTINGS.ownerId}\n\nHubungi owner jika ada kendala deposit.</blockquote>`, { parse_mode: 'HTML' });
});
