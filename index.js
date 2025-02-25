const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

const groupChatId = process.env.GROUP_ID;

// 5 honali ID yaratish
function generateUserId() {
    return `#${Math.floor(10000 + Math.random() * 90000)}`; // 10000 dan 99999 gacha
}

let userState = {};

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userState[chatId] = { step: 0, data: {} };
    bot.sendMessage(chatId, "👋 Assalomu alaykum! Ro‘yxatdan o‘tish uchun ismingiz va familiyangizni kiriting:");
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (!userState[chatId]) return;

    const text = msg.text.trim();

    switch (userState[chatId].step) {
        case 0:
            userState[chatId].data.fullName = text;
            userState[chatId].data.userId = generateUserId();
            userState[chatId].data.telegramId = chatId;
            userState[chatId].data.username = msg.from.username ? `@${msg.from.username}` : "Username yo'q";
            userState[chatId].step++;
            bot.sendMessage(chatId, "📅 Tug‘ilgan kuningizni (kun.oy.yil) shaklida kiriting (masalan: 15.09.2005):");
            break;

        case 1:
            if (!/^\d{2}\.\d{2}\.\d{4}$/.test(text)) {
                bot.sendMessage(chatId, "❌ Xato! Tug‘ilgan sanani `kun.oy.yil` formatida faqat raqam bilan kiriting (masalan: 15.09.2005):");
                return;
            }
            userState[chatId].data.birthdate = text;
            userState[chatId].step++;
            bot.sendMessage(chatId, "📞 Telefon raqamingizni +998XXXXXXXXX shaklida kiriting:");
            break;

        case 2:
            if (!/^\+998\d{9}$/.test(text)) {
                bot.sendMessage(chatId, "❌ Xato! Telefon raqamini +998XXXXXXXXX shaklida kiriting:");
                return;
            }
            userState[chatId].data.phone = text;
            userState[chatId].step++;
            bot.sendMessage(chatId, "👶 Farzandlaringiz sonini kiriting:");
            break;

        case 3:
            if (!/^\d+$/.test(text)) {
                bot.sendMessage(chatId, "❌ Xato! Farzandlar sonini faqat raqam bilan kiriting:");
                return;
            }
            userState[chatId].data.childCount = parseInt(text);
            userState[chatId].data.children = [];
            if (userState[chatId].data.childCount > 0) {
                bot.sendMessage(chatId, "👶 Birinchi farzandingizning ismini kiriting:");
            } else {
                sendToGroup(chatId);
            }
            userState[chatId].step++;
            break;

        default:
            const childIndex = userState[chatId].data.children.length;

            if (childIndex % 2 === 0) {
                userState[chatId].data.children.push(text);
                bot.sendMessage(chatId, "📅 Farzandingizning tug‘ilgan kunini (kun.oy.yil) formatida kiriting:");
            } else {
                if (!/^\d{2}\.\d{2}\.\d{4}$/.test(text)) {
                    bot.sendMessage(chatId, "❌ Xato! Tug‘ilgan sanani `kun.oy.yil` formatida faqat raqam bilan kiriting (masalan: 15.09.2005):");
                    return;
                }
                userState[chatId].data.children.push(text);

                if (userState[chatId].data.children.length / 2 < userState[chatId].data.childCount) {
                    bot.sendMessage(chatId, "👶 Keyingi farzandingizning ismini kiriting:");
                } else {
                    sendToGroup(chatId);
                }
            }
            break;
    }
});

function sendToGroup(chatId) {
    const user = userState[chatId].data;
    let message = `🆔 ID: ${user.userId}\n👤 Ism: ${user.fullName}\n🎂 Tug‘ilgan sana: ${user.birthdate}\n📞 Telefon: ${user.phone}\n👶 Farzandlar soni: ${user.childCount}\n📩 Telegram ID: ${user.telegramId}\n🔗 Telegram Username: ${user.username}\n`;

    if (user.children.length > 0) {
        message += "\n👶 **Farzandlar:**\n";
        for (let i = 0; i < user.children.length; i += 2) {
            message += `   - ${user.children[i]} (${user.children[i + 1]})\n`;
        }
    }

    bot.sendMessage(groupChatId, message);
    bot.sendMessage(chatId, `✅ Ro‘yxatdan o‘tish muvaffaqiyatli yakunlandi! Sizning ID: ${user.userId}`);
    delete userState[chatId];
}
