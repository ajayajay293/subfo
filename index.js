const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// --- KONFIGURASI ---
const token = '8302488902:AAHaD_W255L-Y5miqv3ogE-SpyY4EpUxXtw';
const bot = new TelegramBot(token, { polling: true });

const SETTINGS = {
    ownerId: 8457401920,
    dev: "NaelDev",
    atlanticKey: "cIr6yFSfNiCtzfOw50IIb8xvviGlG4U9o7wLe60Pvrz9os0Ff0ARoAMKdNj7YyqVYi25YtfQoyGVlPo8ce3wAuawklZJlqJF6mmN",
    githubToken: "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",
    githubRaw: "https://raw.githubusercontent.com/ajayajay293/database/main/database.json",
    price: 5500,
    channels: ["@OrderOTP", "@FajarGanteng", "@zCekID"]
};

global.subdomain = { 
    "privateeserverr.my.id": { zone: "2b47743c5a3afecde36ffa0f52073270", apitoken: "2ltJMUmL2QZ-H3IQ0NGM8n84zxoJlU1D8Wwj26AB" },
    "publicserverr.my.id": { zone: "b23d82b98aa932317c93571a3846240a", apitoken: "2ltJMUmL2QZ-H3IQ0NGM8n84zxoJlU1D8Wwj26AB" }
};

let db = { users: {}, deposits: [], premium: [] };
const userStates = new Map();

// --- DATABASE GITHUB FIX ---
async function saveDb() {
    try {
        const res = await axios.get(`https://api.github.com/repos/ajayajay293/database/contents/database.json`, {
            headers: { Authorization: `token ${SETTINGS.githubToken}` }
        });
        const content = Buffer.from(JSON.stringify(db, null, 2)).toString('base64');
        await axios.put(`https://api.github.com/repos/ajayajay293/database/contents/database.json`, {
            message: "update database", content: content, sha: res.data.sha
        }, { headers: { Authorization: `token ${SETTINGS.githubToken}` } });
    } catch (e) { console.log("Gagal save DB"); }
}

async function loadDb() {
    try {
        const res = await axios.get(SETTINGS.githubRaw);
        db = res.data;
    } catch (e) { console.log("Gagal load DB, menggunakan local"); }
}
loadDb();

// --- UTILS ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getMenu = (userId) => {
    const buttons = [
        [{ text: "🚀 Create Subdomain", callback_data: "menu_create" }],
        [{ text: "💳 Beli Akses Premium", callback_data: "buy_premium" }],
        [{ text: "👤 Profile", callback_data: "my_profile" }]
    ];
    if (userId === SETTINGS.ownerId) {
        buttons.push([{ text: "⚙️ Owner Menu", callback_data: "owner_menu" }]);
    }
    return { inline_keyboard: buttons };
};

// --- HANDLERS ---

bot.onText(/\/start/, async (msg) => {
    const teks = `<blockquote>✨ SELAMAT DATANG DI SUBDO BOT ✨\n\nLayanan pembuatan subdomain otomatis dan permanen.\n\n⚠️ <b>S&K:</b>\n- Dilarang spam bot.\n- Subdomain dilarang untuk phising.\n- Pembayaran 5k sekali bayar (Permanen).\n\nSilahkan pilih menu di bawah:</blockquote>`;
    bot.sendMessage(msg.chat.id, teks, { parse_mode: 'HTML', reply_markup: getMenu(msg.from.id) });
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;
    const msgId = query.message.message_id;

    // Helper untuk hapus pesan lama & kirim baru agar rapi
    const refreshMenu = async (teks, kb) => {
        try { await bot.deleteMessage(chatId, msgId); } catch (e) {}
        return bot.sendMessage(chatId, teks, { parse_mode: 'HTML', reply_markup: kb });
    };

    if (data === "start_back") {
        const teks = `<blockquote>✨ SELAMAT DATANG DI SUBDO BOT ✨\n\nSilahkan pilih menu di bawah:</blockquote>`;
        return refreshMenu(teks, getMenu(userId));
    }

    if (data === "my_profile") {
        const isPrem = db.premium.includes(userId) || userId === SETTINGS.ownerId;
        const teks = `<blockquote>👤 <b>MY PROFILE</b>\n\nNama: ${query.from.first_name}\nID: <code>${userId}</code>\nStatus: ${isPrem ? "Premium ✨" : "Gratisan"}\n\nTerima kasih telah menggunakan bot kami!</blockquote>`;
        return refreshMenu(teks, { inline_keyboard: [[{ text: "⬅️ Kembali", callback_data: "start_back" }]] });
    }

    if (data === "owner_menu") {
        if (userId !== SETTINGS.ownerId) return;
        const teks = `<blockquote>⚙️ <b>OWNER MENU</b>\n\nTotal User: ${Object.keys(db.users).length}\nTotal Premium: ${db.premium.length}\n\nGunakan command /addprem [id] atau /broadcast [teks] langsung di chat.</blockquote>`;
        return refreshMenu(teks, { inline_keyboard: [[{ text: "⬅️ Kembali", callback_data: "start_back" }]] });
    }

    if (data === "menu_create") {
        if (!db.premium.includes(userId) && userId !== SETTINGS.ownerId) {
            return bot.answerCallbackQuery(query.id, { text: "❌ Khusus User Premium!", show_alert: true });
        }
        userStates.set(chatId, { step: 'get_host' });
        const teks = `<blockquote>⌨️ Masukkan Hostname yang diinginkan:\n(Contoh: serverganteng)</blockquote>`;
        return refreshMenu(teks, { inline_keyboard: [[{ text: "❌ Batal", callback_data: "start_back" }]] });
    }

    if (data === "buy_premium") {
        bot.answerCallbackQuery(query.id, { text: "⏳ Menyiapkan QRIS..." });
        try {
            const reff_id = `PREM-${Date.now()}`;
            const res = await axios.post('https://atlantich2h.com/deposit/create', 
                `api_key=${SETTINGS.atlanticKey}&reff_id=${reff_id}&nominal=${SETTINGS.price}&type=ewallet&metode=qris`,
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            if (res.data.status) {
                const deposit = res.data.data;
                await bot.deleteMessage(chatId, msgId);
                await bot.sendPhoto(chatId, deposit.qr_image, {
                    caption: `<blockquote>💳 <b>DETAIL PEMBAYARAN QRIS</b>\n\nID: <code>${deposit.id}</code>\nNominal: Rp ${deposit.nominal}\n\nBot otomatis aktif setelah bayar.</blockquote>`,
                    parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: [[{ text: "❌ Batal", callback_data: "start_back" }]] }
                });

                let cek = setInterval(async () => {
                    const statusRes = await axios.post('https://atlantich2h.com/deposit/status', `api_key=${SETTINGS.atlanticKey}&id=${deposit.id}`, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
                    if (statusRes.data.data.status === 'success') {
                        clearInterval(cek);
                        db.premium.push(userId);
                        await saveDb();
                        bot.sendMessage(chatId, "<blockquote>✅ PEMBAYARAN SUKSES!\nStatus anda sekarang Premium.</blockquote>", { parse_mode: 'HTML' });
                    }
                }, 5000);
            }
        } catch (e) { bot.sendMessage(chatId, "❌ Gagal membuat QRIS."); }
    }

    if (data.startsWith("exec_subdo_")) {
        const [_, index, host, ip] = data.split("|");
        const tld = Object.keys(global.subdomain)[index];
        const config = global.subdomain[tld];

        const anim = ["█▒▒▒▒▒▒▒▒▒10%", "███▒▒▒▒▒▒▒30%", "█████▒▒▒▒▒50%", "███████▒▒▒70%", "██████████100%"];
        await bot.deleteMessage(chatId, msgId);
        let liveMsg = await bot.sendMessage(chatId, "<blockquote>🚀 Memproses...</blockquote>", { parse_mode: 'HTML' });

        for (let a of anim) {
            await sleep(500);
            await bot.editMessageText(`<blockquote>${a}\nSedang mendaftarkan DNS...</blockquote>`, { chat_id: chatId, message_id: liveMsg.message_id, parse_mode: 'HTML' });
        }

        try {
            const res = await axios.post(`https://api.cloudflare.com/client/v4/zones/${config.zone}/dns_records`, {
                type: "A", name: `${host}.${tld}`, content: ip, ttl: 1, proxied: false
            }, {
                headers: { "Authorization": `Bearer ${config.apitoken}`, "Content-Type": "application/json" }
            });

            if (res.data.success) {
                bot.editMessageText(`<blockquote>✅ <b>SUBDOMAIN BERHASIL!</b>\n\n🌐 Host: <code>${res.data.result.name}</code>\n📌 IP: <code>${res.data.result.content}</code></blockquote>`, { 
                    chat_id: chatId, message_id: liveMsg.message_id, parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: [[{ text: "Menu Utama", callback_data: "start_back" }]] }
                });
            }
        } catch (e) {
            bot.editMessageText("<blockquote>❌ Gagal! API Cloudflare Error.</blockquote>", { chat_id: chatId, message_id: liveMsg.message_id, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: "Kembali", callback_data: "start_back" }]] } });
        }
    }
});

// --- TEXT HANDLER ---
bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    const chatId = msg.chat.id;
    const state = userStates.get(chatId);

    if (state?.step === 'get_host') {
        state.host = msg.text.toLowerCase().replace(/[^a-z0-9]/g, '');
        state.step = 'get_ip';
        userStates.set(chatId, state);
        bot.sendMessage(chatId, "<blockquote>📍 Masukkan IP Address (V4):</blockquote>", { parse_mode: 'HTML' });
    } 
    else if (state?.step === 'get_ip') {
        const ip = msg.text.trim();
        const buttons = Object.keys(global.subdomain).map((d, i) => ([{ text: d, callback_data: `exec_subdo_|${i}|${state.host}|${ip}` }]));
        userStates.delete(chatId);
        bot.sendMessage(chatId, "<blockquote>🌐 Pilih Domain Utama:</blockquote>", { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } });
    }
});
