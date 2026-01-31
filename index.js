const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');

// --- KONFIGURASI ---
const token = '8302488902:AAGCOhFosHzk1oToCT43zulDJjRCFptq6hY';
const bot = new TelegramBot(token, { polling: true });

const SETTINGS = {
    ownerId: 8457401920, // ID Telegram Kamu
    dev: "NaelDev",
    atlanticKey: "cIr6yFSfNiCtzfOw50IIb8xvviGlG4U9o7wLe60Pvrz9os0Ff0ARoAMKdNj7YyqVYi25YtfQoyGVlPo8ce3wAuawklZJlqJF6mmN",
    price: 5500, // Harga 5k + Admin 500
    channels: ["@PanelStorez", "@FajarGanteng", "@zCekID"]
};

// --- DATABASE INTERNAL (TANPA GITHUB) ---
let db = { 
    users: {}, 
    deposits: [], 
    premium: [8457401920] // Owner otomatis premium
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

const userStates = new Map();

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

const getMainMenu = (userId) => {
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

// --- COMMANDS ---

bot.onText(/\/start/, async (msg) => {
    const isSub = await checkSub(msg);
    if (!isSub) {
        return bot.sendMessage(msg.chat.id, `<blockquote>❌ Akses Ditolak!\n\nAnda harus bergabung ke channel sponsor kami terlebih dahulu:\n1. ${SETTINGS.channels.join('\n2. ')}</blockquote>`, {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [[{ text: "Cek Status Gabung", callback_data: "check_sub" }]] }
        });
    }

    // Catat user ke database internal
    if (!db.users[msg.from.id]) db.users[msg.from.id] = { name: msg.from.first_name };

    const videoUrl = "https://files.catbox.moe/b6ykx3.mp4";
    const teks = `<blockquote>✨ SELAMAT DATANG DI SUBDO BOT ✨\n\nLayanan pembuatan subdomain otomatis dan permanen.\n\n⚠️ <b>S&K:</b>\n- Dilarang spam bot.\n- Subdomain dilarang untuk phising.\n- Pembayaran 5k sekali bayar (Permanen).\n\nSilahkan pilih menu di bawah:</blockquote>`;
    
    bot.sendVideo(msg.chat.id, videoUrl, {
        caption: teks,
        parse_mode: 'HTML',
        reply_markup: getMainMenu(msg.from.id)
    });
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;
    const msgId = query.message.message_id;

    // Fungsi refresh menu (Auto Delete)
    const refreshMenu = async (teks, kb) => {
        try { await bot.deleteMessage(chatId, msgId); } catch (e) {}
        return bot.sendMessage(chatId, teks, { parse_mode: 'HTML', reply_markup: kb });
    };

    if (data === "start_back") {
        const teks = `<blockquote>✨ SELAMAT DATANG DI SUBDO BOT ✨\n\nSilahkan pilih menu di bawah:</blockquote>`;
        return refreshMenu(teks, getMainMenu(userId));
    }

    if (data === "my_profile") {
        const isPrem = db.premium.includes(userId);
        const teks = `<blockquote>👤 <b>PROFIL PENGGUNA</b>\n\nNama: ${query.from.first_name}\nID: <code>${userId}</code>\nStatus: ${isPrem ? "Premium ✨" : "Gratisan"}\n\nTerima kasih telah menggunakan layanan kami.</blockquote>`;
        return refreshMenu(teks, { inline_keyboard: [[{ text: "⬅️ Kembali", callback_data: "start_back" }]] });
    }

    if (data === "owner_menu") {
        if (userId !== SETTINGS.ownerId) return bot.answerCallbackQuery(query.id, { text: "Akses Ditolak!" });
        const teks = `<blockquote>⚙️ <b>OWNER DASHBOARD</b>\n\nTotal User: ${Object.keys(db.users).length}\nTotal Premium: ${db.premium.length}\n\nLayanan berjalan normal.</blockquote>`;
        return refreshMenu(teks, { inline_keyboard: [[{ text: "⬅️ Kembali", callback_data: "start_back" }]] });
    }

    if (data === "menu_create") {
        if (!db.premium.includes(userId)) {
            const errorTeks = `<blockquote>❌ Akses Ditolak!\n\nFitur ini khusus User Premium. Silahkan beli akses seharga Rp 5.500 (Termasuk Admin).</blockquote>`;
            return refreshMenu(errorTeks, { inline_keyboard: [[{ text: "Beli Sekarang", callback_data: "buy_premium" }, { text: "Kembali", callback_data: "start_back" }]] });
        }
        userStates.set(chatId, { step: 'get_host' });
        return refreshMenu(`<blockquote>⌨️ Masukkan Hostname yang diinginkan:\n(Contoh: serverganteng)</blockquote>`, { inline_keyboard: [[{ text: "❌ Batal", callback_data: "start_back" }]] });
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
                const teks = `<blockquote>💳 <b>DETAIL PEMBAYARAN QRIS</b>\n\nID: <code>${deposit.id}</code>\nNominal: Rp ${deposit.nominal}\nStatus: PENDING\n\nSilahkan Scan QRIS di atas. Bot akan otomatis aktif.</blockquote>`;
                
                try { await bot.deleteMessage(chatId, msgId); } catch (e) {}
                await bot.sendPhoto(chatId, deposit.qr_image, {
                    caption: teks,
                    parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: [[{ text: "Batal", callback_data: "start_back" }]] }
                });

                // Auto Check Loop
                let attempts = 0;
                const checkInterval = setInterval(async () => {
                    attempts++;
                    if (attempts > 120) return clearInterval(checkInterval); // Max 10 menit

                    try {
                        const statusRes = await axios.post('https://atlantich2h.com/deposit/status', 
                            `api_key=${SETTINGS.atlanticKey}&id=${deposit.id}`,
                            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                        );

                        if (statusRes.data.data.status === 'success') {
                            clearInterval(checkInterval);
                            db.premium.push(userId);
                            bot.sendMessage(chatId, "<blockquote>✅ PEMBAYARAN BERHASIL!\n\nSekarang anda adalah user Premium. Silahkan gunakan menu /start lagi.</blockquote>", { parse_mode: 'HTML' });
                        }
                    } catch (err) { console.log("Cek status error"); }
                }, 5000);
            }
        } catch (e) { bot.sendMessage(chatId, "❌ Gagal membuat QRIS. Cek API Key Atlantic kamu."); }
    }

    if (data.startsWith("exec_subdo_")) {
        const [_, index, host, ip] = data.split("|");
        const tld = Object.keys(global.subdomain)[index];
        const config = global.subdomain[tld];

        const anim = ["█▒▒▒▒▒▒▒▒▒10%", "███▒▒▒▒▒▒▒30%", "█████▒▒▒▒▒50%", "███████▒▒▒70%", "██████████100%"];
        try { await bot.deleteMessage(chatId, msgId); } catch (e) {}
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
                bot.editMessageText(`<blockquote>✅ <b>SUBDOMAIN BERHASIL!</b>\n\n🌐 Host: <code>${res.data.result.name}</code>\n📌 IP: <code>${res.data.result.content}</code>\n\nTerima kasih telah berlangganan!</blockquote>`, { 
                    chat_id: chatId, 
                    message_id: liveMsg.message_id, 
                    parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: [[{ text: "Kembali Ke Menu", callback_data: "start_back" }]] }
                });
            }
        } catch (e) {
            bot.editMessageText("<blockquote>❌ Gagal! Domain sudah ada atau Cloudflare API Error.</blockquote>", { 
                chat_id: chatId, 
                message_id: liveMsg.message_id, 
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: [[{ text: "Coba Lagi", callback_data: "menu_create" }]] }
            });
        }
    }
});

// --- TEXT HANDLER ---
bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    const chatId = msg.chat.id;
    const state = userStates.get(chatId);

    if (state && state.step === 'get_host') {
        state.host = msg.text.toLowerCase().replace(/[^a-z0-9]/g, '');
        state.step = 'get_ip';
        userStates.set(chatId, state);
        bot.sendMessage(chatId, "<blockquote>📍 Masukkan IP Address (V4):\n(Contoh: 1.2.3.4)</blockquote>", { parse_mode: 'HTML' });
    } 
    else if (state && state.step === 'get_ip') {
        const ip = msg.text.trim();
        const domains = Object.keys(global.subdomain);
        const buttons = domains.map((d, i) => ([{ text: d, callback_data: `exec_subdo_|${i}|${state.host}|${ip}` }]));
        
        userStates.delete(chatId);
        bot.sendMessage(chatId, "<blockquote>🌐 Pilih Domain Utama:</blockquote>", {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: buttons }
        });
    }
});

// --- OWNER COMMANDS ---
bot.onText(/\/addprem (.+)/, (msg, match) => {
    if (msg.from.id !== SETTINGS.ownerId) return;
    const target = parseInt(match[1]);
    if (!db.premium.includes(target)) db.premium.push(target);
    bot.sendMessage(msg.chat.id, `<blockquote>✅ ID ${target} berhasil menjadi Premium.</blockquote>`, { parse_mode: 'HTML' });
});

bot.onText(/\/owner/, (msg) => {
    bot.sendMessage(msg.chat.id, `<blockquote>👑 <b>OWNER INFO</b>\n\nDev: @${SETTINGS.dev}\nID: ${SETTINGS.ownerId}\n\nHubungi owner jika ada kendala deposit.</blockquote>`, { parse_mode: 'HTML' });
});
