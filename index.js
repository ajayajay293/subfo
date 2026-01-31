const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const crypto = require('crypto');

// --- KONFIGURASI UTAMA ---
const token = '8302488902:AAH1rsZ2kHvSitGQN2lD7YMNWCeu9k0JAt0';
const bot = new TelegramBot(token, { polling: true });

const SETTINGS = {
    ownerId: 8457401920,
    dev: "IsJackA",
    atlanticKey: "cIr6yFSfNiCtzfOw50IIb8xvviGlG4U9o7wLe60Pvrz9os0Ff0ARoAMKdNj7YyqVYi25YtfQoyGVlPo8ce3wAuawklZJlqJF6mmN",
    price: 5500,
    channels: ["@Panelstorez", "@FajarGanteng", "@zCekID"]
};

// --- DATABASE INTERNAL ---
let db = { 
    users: {}, 
    premium: [8457401920] 
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
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const paymentChecker = {};

// --- UI COMPONENTS ---
const getMainMenu = (userId) => ({
    inline_keyboard: [
        [{ text: "🚀 ᴄʀᴇᴀᴛᴇ ꜱᴜʙᴅᴏᴍᴀɪɴ", callback_data: "menu_create" }],
        [{ text: "💳 ʙᴇʟɪ ᴀᴋꜱᴇꜱ ᴘʀᴇᴍɪᴜᴍ", callback_data: "buy_premium" }],
        [{ text: "👤 ᴍʏ ᴘʀᴏꜰɪʟᴇ", callback_data: "my_profile" }, { text: "👑 ᴏᴡɴᴇʀ", callback_data: "owner_info" }],
        ...(userId === SETTINGS.ownerId ? [[{ text: "⚙️ ᴏᴡɴᴇʀ ᴅᴀꜱʜʙᴏᴀʀᴅ", callback_data: "owner_menu" }]] : [])
    ]
});

// --- CORE FUNCTIONS ---
async function checkSub(userId) {
    for (const channel of SETTINGS.channels) {
        try {
            const chat = await bot.getChatMember(channel, userId);
            if (!['member', 'administrator', 'creator'].includes(chat.status)) {
                return false;
            }
        } catch {
            return false;
        }
    }
    return true;
}

async function sendStartUI(chatId, userId, firstName) {
    const videoUrl = "https://files.catbox.moe/b6ykx3.mp4";

    const teks = `<blockquote>✨ <b>ꜱᴜʙᴅᴏᴍᴀɪɴ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ</b> ✨

ʟᴀʏᴀɴᴀɴ ᴘᴇᴍʙᴜᴀᴛᴀɴ ꜱᴜʙᴅᴏᴍᴀɪɴ ᴏᴛᴏᴍᴀᴛɪꜱ, ᴄᴇᴘᴀᴛ, ᴅᴀɴ ᴘᴇʀᴍᴀɴᴇɴ.

📝 <b>ꜱʏᴀʀᴀᴛ & ᴋᴇᴛᴇɴᴛᴜᴀɴ:</b>
├ ᴅɪʟᴀʀᴀɴɢ ꜱᴘᴀᴍ ʙᴏᴛ
├ ᴅɪʟᴀʀᴀɴɢ ᴜɴᴛᴜᴋ ᴘʜɪꜱʜɪɴɢ
└ ꜱᴇᴋᴀʟɪ ʙᴀʏᴀʀ ᴀᴋᴛɪꜰ ꜱᴇʟᴀᴍᴀɴʏᴀ

ꜱɪʟᴀʜᴋᴀɴ ᴘɪʟɪʜ ᴍᴇɴᴜ ᴅɪ ʙᴀᴡᴀʜ ɪɴɪ:</blockquote>`;

    return bot.sendVideo(chatId, videoUrl, {
        caption: teks,
        parse_mode: 'HTML',
        reply_markup: getMainMenu(userId)
    });
}

// --- COMMANDS ---
bot.onText(/\/start/, async (msg) => {
    const isSub = await checkSub(msg.from.id);
    if (!isSub) {
        return bot.sendMessage(msg.chat.id, `<blockquote>⚠️ <b>ᴀᴋꜱᴇꜱ ᴅɪᴛᴏʟᴀᴋ</b>\n\nꜱɪʟᴀʜᴋᴀɴ ʙᴇʀɢᴀʙᴜɴɢ ᴋᴇ ᴄʜᴀɴɴᴇʟ ꜱᴘᴏɴꜱᴏʀ ᴜɴᴛᴜᴋ ᴍᴇɴɢɢᴜɴᴀᴋᴀɴ ʙᴏᴛ:\n\n${SETTINGS.channels.join('\n')}</blockquote>`, {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [[{ text: "✅ ᴄᴇᴋ ꜱᴛᴀᴛᴜꜱ ɢᴀʙᴜɴɢ", callback_data: "start_back" }]] }
        });
    }

    if (!db.users[msg.from.id]) {
    db.users[msg.from.id] = { name: msg.from.first_name, date: new Date() };
}

return sendStartUI(msg.chat.id, msg.from.id, msg.from.first_name);

    const videoUrl = "https://files.catbox.moe/b6ykx3.mp4";
    const teks = `<blockquote>✨ <b>ꜱᴜʙᴅᴏᴍᴀɪɴ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ</b> ✨\n\nʟᴀʏᴀɴᴀɴ ᴘᴇᴍʙᴜᴀᴛᴀɴ ꜱᴜʙᴅᴏᴍᴀɪɴ ᴏᴛᴏᴍᴀᴛɪꜱ, ᴄᴇᴘᴀᴛ, ᴅᴀɴ ᴘᴇʀᴍᴀɴᴇɴ.\n\n📝 <b>ꜱʏᴀʀᴀᴛ & ᴋᴇᴛᴇɴᴛᴜᴀɴ:</b>\n├ ᴅɪʟᴀʀᴀɴɢ ꜱᴘᴀᴍ ʙᴏᴛ\n├ ᴅɪʟᴀʀᴀɴɢ ᴜɴᴛᴜᴋ ᴘʜɪꜱʜɪɴɢ\n└ ꜱᴇᴋᴀʟɪ ʙᴀʏᴀʀ ᴀᴋᴛɪꜰ ꜱᴇʟᴀᴍᴀɴʏᴀ\n\nꜱɪʟᴀʜᴋᴀɴ ᴘɪʟɪʜ ᴍᴇɴᴜ ᴅɪ ʙᴀᴡᴀʜ ɪɴɪ:</blockquote>`;
    
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

    const refreshMenu = async (teks, kb) => {
        try { await bot.deleteMessage(chatId, msgId); } catch {}
        return bot.sendMessage(chatId, teks, { parse_mode: 'HTML', reply_markup: kb });
    };

    // ===== HARD LOCK JOIN (GLOBAL GATE) =====
    const isSub = await checkSub(userId);
    if (!isSub && data !== "start_back") {
        return bot.answerCallbackQuery(query.id, {
            text: "⚠️ Join semua channel dulu!",
            show_alert: true
        });
    }

    // ===== START_BACK =====
    if (data === "start_back") {
    if (!isSub) {
        return bot.editMessageText(
            `<blockquote>⚠️ <b>Akses Ditolak</b>\n\nJoin dulu:\n${SETTINGS.channels.join('\n')}</blockquote>`,
            {
                chat_id: chatId,
                message_id: msgId,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        { text: "✅ Cek Lagi", callback_data: "start_back" }
                    ]]
                }
            }
        );
    }

    try { await bot.deleteMessage(chatId, msgId); } catch {}
    return sendStartUI(chatId, userId, query.from.first_name);
}

    // --- bawahnya lanjut menu lain ---
    if (data === "my_profile") {
        const isPrem = db.premium.includes(userId);
        const teks = `<blockquote>👤 <b>ᴜꜱᴇʀ ᴘʀᴏꜰɪʟᴇ</b>\n\n📝 ɴᴀᴍᴇ: <b>${query.from.first_name}</b>\n🆔 ɪᴅ: <code>${userId}</code>\n🌟 ꜱᴛᴀᴛᴜꜱ: <b>${isPrem ? "ᴘʀᴇᴍɪᴜᴍ ✨" : "ꜰʀᴇᴇ ᴜꜱᴇʀ"}</b>\n\nᴛᴇʀɪᴍᴀ ᴋᴀꜱɪʜ ᴛᴇʟᴀʜ ᴍᴇɴɢɢᴜɴᴀᴋᴀɴ ʟᴀʏᴀɴᴀɴ ᴋᴀᴍɪ!</blockquote>`;
        return refreshMenu(teks, { inline_keyboard: [[{ text: "⬅️ ᴋᴇᴍʙᴀʟɪ", callback_data: "start_back" }]] });
    }

    if (data === "owner_info") {
        const teks = `<blockquote>👑 <b>ᴏᴡɴᴇʀ ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ</b>\n\nᴅᴇᴠᴇʟᴏᴘᴇʀ: @${SETTINGS.dev}\nɪᴅ ᴏᴡɴᴇʀ: <code>${SETTINGS.ownerId}</code>\n\nʜᴜʙᴜɴɢɪ ᴏᴡɴᴇʀ ᴊɪᴋᴀ ᴛᴇʀᴊᴀᴅɪ ᴋᴇɴᴅᴀʟᴀ ᴘᴀᴅᴀ ᴛʀᴀɴꜱᴀᴋꜱɪ.</blockquote>`;
        return refreshMenu(teks, { inline_keyboard: [[{ text: "⬅️ ᴋᴇᴍʙᴀʟɪ", callback_data: "start_back" }]] });
    }

    if (data === "owner_menu") {
        if (userId !== SETTINGS.ownerId) return;
        const teks = `<blockquote>⚙️ <b>ᴏᴡɴᴇʀ ᴅᴀꜱʜʙᴏᴀʀᴅ</b>\n\n📊 ꜱᴛᴀᴛɪꜱᴛɪᴋ ʙᴏᴛ:\n├ ᴛᴏᴛᴀʟ ᴜꜱᴇʀ: ${Object.keys(db.users).length}\n└ ᴛᴏᴛᴀʟ ᴘʀᴇᴍɪᴜᴍ: ${db.premium.length}\n\nᴜꜱᴇ <code>/addprem [id]</code> ᴛᴏ ᴀᴅᴅ ᴜꜱᴇʀ.</blockquote>`;
        return refreshMenu(teks, { inline_keyboard: [[{ text: "⬅️ ᴋᴇᴍʙᴀʟɪ", callback_data: "start_back" }]] });
    }

    if (data === "menu_create") {
        if (!db.premium.includes(userId)) {
            const teks = `<blockquote>❌ <b>ᴀᴋꜱᴇꜱ ᴅɪᴛᴏʟᴀᴋ</b>\n\nꜰɪᴛᴜʀ ɪɴɪ ʜᴀɴʏᴀ ᴜɴᴛᴜᴋ ᴜꜱᴇʀ ᴘʀᴇᴍɪᴜᴍ.\nʜᴀʀɢᴀ ᴀᴋꜱᴇꜱ: <b>ʀᴘ ${SETTINGS.price.toLocaleString()}</b></blockquote>`;
            return refreshMenu(teks, { inline_keyboard: [[{ text: "💳 ʙᴇʟɪ ᴘʀᴇᴍɪᴜᴍ", callback_data: "buy_premium" }], [{ text: "⬅️ ᴋᴇᴍʙᴀʟɪ", callback_data: "start_back" }]] });
        }
        userStates.set(chatId, { step: 'get_host' });
        return refreshMenu(`<blockquote>⌨️ <b>ɪɴᴘᴜᴛ ʜᴏꜱᴛɴᴀᴍᴇ</b>\n\nᴍᴀꜱᴜᴋᴋᴀɴ ʜᴏꜱᴛɴᴀᴍᴇ ʏᴀɴɢ ᴅɪɪɴɢɪɴᴋᴀɴ:\n(ᴄᴏɴᴛᴏʜ: <code>IsJackA-hosting</code>)</blockquote>`, { inline_keyboard: [[{ text: "❌ ʙᴀᴛᴀʟᴋᴀɴ", callback_data: "start_back" }]] });
    }

    if (data === "buy_premium") {
    await bot.answerCallbackQuery(query.id, {
        text: "⌛ Generating payment..."
    });

    try {
        const reff_id = `PREM-${Date.now()}`;

        // ===== CREATE DEPOSIT =====
        const res = await axios.post(
            "https://atlantich2h.com/deposit/create",
            `api_key=${SETTINGS.atlanticKey}&reff_id=${reff_id}&nominal=${SETTINGS.price}&type=ewallet&metode=qris`,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                timeout: 15000
            }
        );

        // VALIDASI RESPONSE
        if (!res.data || res.data.status !== true) {
            console.log("CREATE RESPONSE:", res.data);
            return bot.sendMessage(chatId, "❌ Gagal membuat pembayaran (API error).");
        }

        const dep = res.data.data;

        // ===== QR STRING → QR IMAGE =====
        const qrData = dep.qr_string;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

        try { await bot.deleteMessage(chatId, msgId); } catch {}

        // ===== SEND PAYMENT DETAIL =====
        await bot.sendPhoto(chatId, qrUrl, {
            caption: `<blockquote>💳 <b>PEMBAYARAN QRIS PREMIUM</b>

🆔 ID Deposit : <code>${dep.id}</code>
🧾 Reff ID : <code>${dep.reff_id}</code>
💰 Nominal : <b>Rp ${Number(dep.nominal).toLocaleString("id-ID")}</b>
💸 Fee : Rp ${Number(dep.fee).toLocaleString("id-ID")}
📥 Diterima : Rp ${Number(dep.get_balance).toLocaleString("id-ID")}
⌛ Status : Pending
🕒 Dibuat : ${dep.created_at}

Silakan scan QRIS di atas.
Premium aktif otomatis setelah pembayaran berhasil.</blockquote>`,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🔄 Cek Status", callback_data: `cek_${dep.id}` }],
                    [{ text: "❌ Batalkan", callback_data: `cancel_${dep.id}` }]
                ]
            }
        });

        // ===== AUTO CEK STATUS TIAP 2 DETIK =====
        let instantCalled = false;

        const checker = setInterval(async () => {
            try {
                const st = await axios.post(
                    "https://atlantich2h.com/deposit/status",
                    `api_key=${SETTINGS.atlanticKey}&id=${dep.id}`,
                    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
                );

                if (!st.data || !st.data.status) return;

                const status = st.data.data.status;

                // SUCCESS
                if (status === "success") {
    clearInterval(checker);

    grantPremium(userId);

    return bot.sendMessage(chatId,
        `<blockquote>✅ <b>PEMBAYARAN BERHASIL</b>

Premium kamu telah aktif 🎉</blockquote>`,
        { parse_mode: "HTML" }
    );
}

                // PROCESSING → INSTANT
                if (status === "processing" && !instantCalled) {
                    instantCalled = true;

                    await axios.post(
                        "https://atlantich2h.com/deposit/instant",
                        `api_key=${SETTINGS.atlanticKey}&id=${dep.id}&action=true`,
                        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
                    );

                    console.log("INSTANT TRIGGERED:", dep.id);
                }

            } catch (e) {
                console.log("STATUS CHECK ERROR:", e.message);
            }
        }, 2000);

        // STOP AFTER 10 MIN
        setTimeout(() => clearInterval(checker), 600000);

    } catch (err) {
        console.log("CREATE ERROR:", err.response?.data || err.message);
        bot.sendMessage(chatId, "❌ Gagal membuat pembayaran. Periksa API Key / koneksi.");
    }
}

   if (data.startsWith("cancel_")) {
    const depId = data.split("_")[1];

    try {
        const res = await axios.post(
            "https://atlantich2h.com/deposit/cancel",
            `api_key=${SETTINGS.atlanticKey}&id=${depId}`,
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        if (!res.data?.status) {
            return bot.answerCallbackQuery(query.id, {
                text: "❌ Gagal membatalkan",
                show_alert: true
            });
        }

        if (paymentChecker[userId]) {
            clearInterval(paymentChecker[userId]);
            delete paymentChecker[userId];
        }

        await bot.editMessageCaption(
            `<blockquote>❌ <b>PEMBAYARAN DIBATALKAN</b>

ID Deposit: <code>${depId}</code></blockquote>`,
            {
                chat_id: chatId,
                message_id: msgId,
                parse_mode: "HTML"
            }
        );

        return bot.answerCallbackQuery(query.id, { text: "Pembayaran dibatalkan" });

    } catch (e) {
        return bot.answerCallbackQuery(query.id, {
            text: "❌ Error cancel",
            show_alert: true
        });
    }
}

    if (data.startsWith("cek_")) {
    const depId = data.split("_")[1];

    const res = await axios.post(
        "https://atlantich2h.com/deposit/status",
        `api_key=${SETTINGS.atlanticKey}&id=${depId}`,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const d = res.data.data;

    if (d.status === "success") {
        grantPremium(userId);
    }

    return bot.answerCallbackQuery(query.id, {
        text: `Status: ${d.status.toUpperCase()}`,
        show_alert: true
    });
}

    if (data.startsWith("exec_subdo_")) {
        const [_, index, host, ip] = data.split("|");
        const tld = Object.keys(global.subdomain)[index];
        const cfg = global.subdomain[tld];
        const anim = ["⌛ 10%", "⏳ 30%", "⌛ 50%", "⏳ 80%", "✅ 100%"];
        
        try { await bot.deleteMessage(chatId, msgId); } catch {}
        let l = await bot.sendMessage(chatId, "<blockquote>🚀 <b>ꜱᴛᴀʀᴛɪɴɢ ᴘʀᴏᴄᴇꜱꜱ...</b></blockquote>", { parse_mode: 'HTML' });

        for (let a of anim) {
            await sleep(500);
            await bot.editMessageText(`<blockquote>${a}\nᴅɴꜱ ʀᴇɢɪꜱᴛʀᴀᴛɪᴏɴ ɪɴ ᴘʀᴏɢʀᴇꜱꜱ...</blockquote>`, { chat_id: chatId, message_id: l.message_id, parse_mode: 'HTML' });
        }

        try {
            const res = await axios.post(`https://api.cloudflare.com/client/v4/zones/${cfg.zone}/dns_records`, 
                { type: "A", name: `${host}.${tld}`, content: ip, ttl: 1, proxied: false },
                { headers: { "Authorization": `Bearer ${cfg.apitoken}`, "Content-Type": "application/json" } }
            );

            if (res.data.success) {
                bot.editMessageText(`<blockquote>✅ <b>ꜱᴜʙᴅᴏᴍᴀɪɴ ᴄʀᴇᴀᴛᴇᴅ!</b>\n\n🌐 ʜᴏꜱᴛ: <code>${res.data.result.name}</code>\n📌 ɪᴘ: <code>${res.data.result.content}</code>\n✨ ꜱᴛᴀᴛᴜꜱ: ᴀᴄᴛɪᴠᴇ\n\nᴛᴇʀɪᴍᴀ ᴋᴀꜱɪʜ ᴛᴇʟᴀʜ ᴍᴇɴɢɢᴜɴᴀᴋᴀɴ ᴊᴀꜱᴀ ᴋᴀᴍɪ!</blockquote>`, { 
                    chat_id: chatId, message_id: l.message_id, parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: [[{ text: "🏠 ᴋᴇᴍʙᴀʟɪ ᴋᴇ ᴍᴇɴᴜ", callback_data: "start_back" }]] }
                });
            }
        } catch {
            bot.editMessageText("<blockquote>❌ <b>ᴘʀᴏᴄᴇꜱꜱ ꜰᴀɪʟᴇᴅ</b>\n\nʜᴏꜱᴛɴᴀᴍᴇ ꜱᴜᴅᴀʜ ᴀᴅᴀ ᴀᴛᴀᴜ ᴀᴘɪ ᴄʟᴏᴜᴅꜰʟᴀʀᴇ ᴇʀʀᴏʀ.</blockquote>", { 
                chat_id: chatId, message_id: l.message_id, parse_mode: 'HTML',
                reply_markup: { inline_keyboard: [[{ text: "🔄 ᴄᴏʙᴀ ʟᴀɢɪ", callback_data: "menu_create" }]] }
            });
        }
    }
});

// --- INPUT HANDLER ---
bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    // HARD LOCK JOIN TEXT
    const isSub = await checkSub(msg.from.id);
    if (!isSub) return;

    const chatId = msg.chat.id;
    const state = userStates.get(chatId);

    if (state?.step === 'get_host') {
        state.host = msg.text.toLowerCase().replace(/[^a-z0-9]/g, '');
        state.step = 'get_ip';
        userStates.set(chatId, state);
        bot.sendMessage(chatId, "<blockquote>📍 <b>ɪɴᴘᴜᴛ ɪᴘ ᴀᴅᴅʀᴇꜱꜱ</b>\n\nᴍᴀꜱᴜᴋᴋᴀɴ ɪᴘ ᴠᴘꜱ ᴀɴᴅᴀ (ᴠ4):\n(ᴄᴏɴᴛᴏʜ: <code>1.1.1.1</code>)</blockquote>", { parse_mode: 'HTML' });
    } 
    else if (state?.step === 'get_ip') {
        const ip = msg.text.trim();
        const btns = Object.keys(global.subdomain).map((d, i) => ([{ text: `🌐 ${d}`, callback_data: `exec_subdo_|${i}|${state.host}|${ip}` }]));
        userStates.delete(chatId);
        bot.sendMessage(chatId, "<blockquote>🌍 <b>ꜱᴇʟᴇᴄᴛ ᴅᴏᴍᴀɪɴ</b>\n\nᴘɪʟɪʜ ᴅᴏᴍᴀɪɴ ᴜᴛᴀᴍᴀ ʏᴀɴɢ ᴀᴋᴀɴ ᴅɪɢᴜɴᴀᴋᴀɴ:</blockquote>", { parse_mode: 'HTML', reply_markup: { inline_keyboard: btns } });
    }
});

bot.onText(/\/broadcast$/, async (msg) => {
    // CEK OWNER
    if (msg.from.id !== SETTINGS.ownerId) return;

    // HARUS REPLY PESAN
    if (!msg.reply_to_message) {
        return bot.sendMessage(
            msg.chat.id,
            "<blockquote>⚠️ <b>Cara Broadcast</b>\n\nReply pesan yang ingin dibroadcast lalu ketik <code>/broadcast</code></blockquote>",
            { parse_mode: 'HTML' }
        );
    }

    const fromChatId = msg.chat.id;
    const messageId = msg.reply_to_message.message_id;

    let success = 0;
    let failed = 0;

    await bot.sendMessage(
        msg.chat.id,
        `<blockquote>📣 <b>Broadcast Dimulai</b>\n\n👥 Total user: ${Object.keys(db.users).length}</blockquote>`,
        { parse_mode: 'HTML' }
    );

    for (const uid of Object.keys(db.users)) {
        try {
            await bot.forwardMessage(
                Number(uid),
                fromChatId,
                messageId
            );
            success++;
            await sleep(80); // anti flood
        } catch (e) {
            failed++;
        }
    }

    bot.sendMessage(
        msg.chat.id,
        `<blockquote>✅ <b>Broadcast Selesai</b>\n\n📨 Berhasil: ${success}\n❌ Gagal: ${failed}</blockquote>`,
        { parse_mode: 'HTML' }
    );
});

bot.onText(/\/addprem (.+)/, (msg, match) => {
    if (msg.from.id !== SETTINGS.ownerId) return;
    const id = parseInt(match[1]);
    if (!db.premium.includes(id)) db.premium.push(id);
    bot.sendMessage(msg.chat.id, `<blockquote>✅ ᴜꜱᴇʀ <code>${id}</code> ʙᴇʀʜᴀꜱɪʟ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ ᴋᴇ ᴘʀᴇᴍɪᴜᴍ.</blockquote>`, { parse_mode: 'HTML' });
});
