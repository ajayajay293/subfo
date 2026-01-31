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

// --- DATABASE FUNCTIONS ---
async function saveDb() {
    try {
        const res = await axios.get(`https://api.github.com/repos/ajayajay293/database/contents/database.json`, {
            headers: { Authorization: `token ${SETTINGS.githubToken}` }
        });
        const content = Buffer.from(JSON.stringify(db, null, 2)).toString('base64');
        await axios.put(`https://api.github.com/repos/ajayajay293/database/contents/database.json`, {
            message: "update database", content: content, sha: res.data.sha
        }, { headers: { Authorization: `token ${SETTINGS.githubToken}` } });
    } catch (e) { console.log("Gagal save ke Github"); }
}

async function loadDb() {
    try {
        const res = await axios.get(SETTINGS.githubRaw);
        db = res.data;
    } catch (e) { console.log("Gagal load DB, menggunakan local"); }
}
loadDb();

// --- UTILS ---
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// --- UI COMPONENTS ---
const mainMenu = (userId) => {
    const kb = [
        [{ text: "🚀 Create Subdomain", callback_data: "menu_create" }],
        [{ text: "💳 Beli Akses Premium", callback_data: "buy_premium" }],
        [{ text: "👤 Profile", callback_data: "my_profile" }]
    ];
    if (userId === SETTINGS.ownerId) kb.push([{ text: "⚙️ Owner Menu", callback_data: "owner_menu" }]);
    return { inline_keyboard: kb };
};

// --- HANDLERS ---
bot.onText(/\/start/, async (msg) => {
    const teks = `✨ <b>SELAMAT DATANG DI SUBDO BOT</b> ✨\n\nLayanan subdomain otomatis permanen.`;
    bot.sendMessage(msg.chat.id, teks, { parse_mode: 'HTML', reply_markup: mainMenu(msg.from.id) });
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;
    const msgId = query.message.message_id;

    // Tambahkan User ke DB jika belum ada
    if (!db.users[userId]) db.users[userId] = { name: query.from.first_name };

    // --- FITUR AUTO DELETE ---
    const refreshMenu = async (teks, keyboard) => {
        try {
            await bot.deleteMessage(chatId, msgId);
            await bot.sendMessage(chatId, teks, { parse_mode: 'HTML', reply_markup: keyboard });
        } catch (e) {
            await bot.editMessageText(teks, { chat_id: chatId, message_id: msgId, parse_mode: 'HTML', reply_markup: keyboard });
        }
    };

    if (data === "start_back") {
        return refreshMenu(`✨ <b>MAIN MENU</b>\nSilahkan pilih layanan:`, mainMenu(userId));
    }

    if (data === "my_profile") {
        const isPrem = db.premium.includes(userId) || userId === SETTINGS.ownerId;
        const teks = `👤 <b>PROFIL ANDA</b>\n\nID: <code>${userId}</code>\nStatus: ${isPrem ? '✨ Premium' : 'Free'}\n\nHubungi @${SETTINGS.dev} jika ada masalah.`;
        return refreshMenu(teks, { inline_keyboard: [[{ text: "⬅️ Kembali", callback_data: "start_back" }]] });
    }

    if (data === "owner_menu") {
        if (userId !== SETTINGS.ownerId) return bot.answerCallbackQuery(query.id, { text: "Khusus Owner!" });
        const teks = `⚙️ <b>OWNER DASHBOARD</b>\n\nTotal User: ${Object.keys(db.users).length}\nTotal Premium: ${db.premium.length}`;
        return refreshMenu(teks, { 
            inline_keyboard: [
                [{ text: "📢 Broadcast", callback_data: "owner_bc" }],
                [{ text: "⬅️ Kembali", callback_data: "start_back" }]
            ] 
        });
    }

    if (data === "menu_create") {
        if (!db.premium.includes(userId) && userId !== SETTINGS.ownerId) {
            return bot.answerCallbackQuery(query.id, { text: "Anda bukan user premium!", show_alert: true });
        }
        userStates.set(chatId, { step: 'get_host' });
        return refreshMenu(`⌨️ <b>INPUT HOSTNAME</b>\n\nMasukkan nama subdomain yang diinginkan:\n(Hanya huruf dan angka)`, { inline_keyboard: [[{ text: "❌ Batal", callback_data: "start_back" }]] });
    }

    if (data === "buy_premium") {
        bot.answerCallbackQuery(query.id, { text: "Generating QRIS..." });
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
                    caption: `💳 <b>PEMBAYARAN QRIS</b>\n\nNominal: Rp ${deposit.nominal}\nExpired: 10 Menit\n\n<i>Bot akan otomatis aktif jika pembayaran sukses.</i>`,
                    parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: [[{ text: "❌ Batalkan", callback_data: "start_back" }]] }
                });

                // Auto Check Loop
                let cek = setInterval(async () => {
                    const statusRes = await axios.post('https://atlantich2h.com/deposit/status', `api_key=${SETTINGS.atlanticKey}&id=${deposit.id}`, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
                    if (statusRes.data.data.status === 'success') {
                        clearInterval(cek);
                        db.premium.push(userId);
                        await saveDb();
                        bot.sendMessage(chatId, "✅ <b>PEMBAYARAN BERHASIL!</b>\nSekarang anda bisa membuat subdomain.");
                    }
                }, 5000);
                setTimeout(() => clearInterval(cek), 600000); // Stop setelah 10 menit
            }
        } catch (e) { bot.sendMessage(chatId, "❌ Gagal membuat QRIS. Cek API Key Atlantic."); }
    }

    if (data.startsWith("exec_subdo_")) {
        const [_, index, host, ip] = data.split("|");
        const tld = Object.keys(global.subdomain)[index];
        const config = global.subdomain[tld];

        const anim = ["⌛ 10%", "⌛ 40%", "⌛ 70%", "⌛ 90%", "✅ 100%"];
        await bot.deleteMessage(chatId, msgId);
        let live = await bot.sendMessage(chatId, "🚀 <b>Memulai proses...</b>", { parse_mode: 'HTML' });

        for (let frame of anim) {
            await sleep(600);
            await bot.editMessageText(`<blockquote>${frame}\nSedang mendaftarkan ke Cloudflare...</blockquote>`, { chat_id: chatId, message_id: live.message_id, parse_mode: 'HTML' });
        }

        try {
            const res = await axios.post(`https://api.cloudflare.com/client/v4/zones/${config.zone}/dns_records`, {
                type: "A", name: `${host}.${tld}`, content: ip, ttl: 1, proxied: false
            }, {
                headers: { "Authorization": `Bearer ${config.apitoken}`, "Content-Type": "application/json" }
            });

            if (res.data.success) {
                bot.editMessageText(`✅ <b>SUBDOMAIN AKTIF!</b>\n\n🌐 Host: <code>${res.data.result.name}</code>\n📌 IP: <code>${res.data.result.content}</code>`, { 
                    chat_id: chatId, message_id: live.message_id, parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: [[{ text: "Menu Utama", callback_data: "start_back" }]] }
                });
            }
        } catch (e) {
            bot.editMessageText("❌ <b>Gagal!</b> Domain mungkin sudah terpakai.", { chat_id: chatId, message_id: live.message_id, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: "Kembali", callback_data: "start_back" }]] } });
        }
    }
});

// --- TEXT LISTENER ---
bot.on('message', async (msg) => {
    if (msg.text?.startsWith('/')) return;
    const chatId = msg.chat.id;
    const state = userStates.get(chatId);

    if (state?.step === 'get_host') {
        state.host = msg.text.toLowerCase().replace(/[^a-z0-9]/g, '');
        state.step = 'get_ip';
        userStates.set(chatId, state);
        bot.sendMessage(chatId, "📍 <b>INPUT IP</b>\n\nMasukkan IP VPS anda (Contoh: 1.2.3.4):");
    } 
    else if (state?.step === 'get_ip') {
        const domains = Object.keys(global.subdomain);
        const buttons = domains.map((d, i) => ([{ text: `🌐 ${d}`, callback_data: `exec_subdo_|${i}|${state.host}|${msg.text.trim()}` }]));
        userStates.delete(chatId);
        bot.sendMessage(chatId, "🌍 <b>PILIH DOMAIN</b>", { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } });
    }
});
