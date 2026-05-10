const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');
const express = require('express');
const vision = require('@google-cloud/vision');
require('dotenv').config();

// --- CONFIGURAÇÕES ---
const token = process.env.TELEGRAM_TOKEN;
const port = process.env.PORT || 3000;
const YOUR_FIREBASE_UID = process.env.FIREBASE_UID?.trim();

// Inicializar Firebase Admin e Vision
let visionClient;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    // Cliente de Visão do Google
    visionClient = new vision.ImageAnnotatorClient({
        credentials: serviceAccount
    });
} else {
    console.error("ERRO: FIREBASE_SERVICE_ACCOUNT não configurada!");
    process.exit(1);
}

const db = admin.firestore();
const bot = new TelegramBot(token, { polling: true });
const app = express();
app.use(express.json());

console.log(`Bot LifeOS (com OCR) iniciado para o UID: ${YOUR_FIREBASE_UID}`);

// --- LÓGICA DO BOT ---

// Tratar Fotos (Comprovantes)
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const fileId = msg.photo[msg.photo.length - 1].file_id;

    try {
        bot.sendMessage(chatId, "🔍 Lendo comprovante...");

        const fileLink = await bot.getFileLink(fileId);
        const [result] = await visionClient.textDetection(fileLink);
        const fullText = result.fullTextAnnotation?.text || "";

        console.log("Texto extraído:", fullText);

        // Regex aprimorada para PIX (procura R$ seguido de valor)
        // Captura formatos como R$ 10,00 ou R$1.200,50
        const valueRegex = /R\$\s?(\d{1,3}(\.\d{3})*,\d{2})/i;
        const match = fullText.match(valueRegex);

        if (match) {
            const rawValue = match[1];
            // Converte formato BR (1.200,50) para Number (1200.50)
            const value = parseFloat(rawValue.replace(/\./g, '').replace(',', '.'));

            if (!isNaN(value)) {
                const sessionRef = db.collection("botSessions").doc(chatId.toString());
                await sessionRef.set({ step: "waiting_description", value, chatId });

                bot.sendMessage(chatId, `💰 *R$ ${value.toFixed(2)}* detectado!\n\nAgora, me diga a *Descrição*:`, { parse_mode: 'Markdown' });
            }
        } else {
            bot.sendMessage(chatId, "❌ Não encontrei o valor 'R$' no comprovante. Tente digitar o valor manualmente.");
        }
    } catch (error) {
        console.error("Erro OCR:", error);
        bot.sendMessage(chatId, "⚠️ Erro ao processar a imagem. Certifique-se de que a API Vision está ativada.");
    }
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : "";

    // Ignorar se for foto (já tratada acima)
    if (msg.photo) return;
    if (!text) return;

    if (text.toLowerCase() === '/cancel' || text.toLowerCase() === '/start') {
        await db.collection("botSessions").doc(chatId.toString()).delete();
        if (text === '/start') {
            bot.sendMessage(chatId, "👋 Olá! Envie um valor ou a *foto do comprovante* para começar.");
        } else {
            bot.sendMessage(chatId, "❌ Cancelado.");
        }
        return;
    }

    const sessionRef = db.collection("botSessions").doc(chatId.toString());
    const sessionSnap = await sessionRef.get();
    let session = sessionSnap.exists ? sessionSnap.data() : { step: "idle" };

    try {
        if (session.step === "idle") {
            const value = parseFloat(text.replace(',', '.').replace('R$', '').trim());
            if (!isNaN(value)) {
                await sessionRef.set({ step: "waiting_description", value, chatId });
                bot.sendMessage(chatId, `💰 *R$ ${value.toFixed(2)}* registrado!\n\nDescrição:`, { parse_mode: 'Markdown' });
            }
            return;
        }

        if (session.step === "waiting_description") {
            await sessionRef.update({ step: "waiting_category", description: text });
            const catSnap = await db.doc(`users/${YOUR_FIREBASE_UID}/settings/categories`).get();
            const categories = catSnap.exists() ? catSnap.data().expense : ["Alimentação", "Transporte", "Moradia", "Lazer", "Outros"];
            const keyboard = { reply_markup: { keyboard: categories.map(cat => [{ text: cat }]), one_time_keyboard: true, resize_keyboard: true }};
            bot.sendMessage(chatId, "📂 Categoria:", keyboard);
            return;
        }

        if (session.step === "waiting_category") {
            await sessionRef.update({ step: "waiting_method", category: text });
            const keyboard = { reply_markup: { keyboard: [[{ text: "Saldo em Conta" }], [{ text: "Cartão de Crédito" }]], one_time_keyboard: true, resize_keyboard: true }};
            bot.sendMessage(chatId, "💳 Como pagou?", keyboard);
            return;
        }

        if (session.step === "waiting_method") {
            if (text === "Cartão de Crédito") {
                await sessionRef.update({ step: "waiting_card", paymentMethod: "credit" });
                const cardsSnap = await db.collection(`users/${YOUR_FIREBASE_UID}/creditCards`).get();
                const cards = cardsSnap.docs.map(d => [{ text: d.data().name }]);
                bot.sendMessage(chatId, "💳 Qual Cartão?", { reply_markup: { keyboard: cards, one_time_keyboard: true, resize_keyboard: true }});
            } else {
                return finalize(chatId, sessionRef, { ...session, paymentMethod: "balance" });
            }
            return;
        }

        if (session.step === "waiting_card") {
            const cardsSnap = await db.collection(`users/${YOUR_FIREBASE_UID}/creditCards`).get();
            const selectedCard = cardsSnap.docs.find(d => d.data().name === text);
            return finalize(chatId, sessionRef, { ...session, paymentMethod: "credit", creditCardId: selectedCard?.id, cardName: text });
        }
    } catch (e) {
        bot.sendMessage(chatId, "❌ Erro. Use /cancel.");
    }
});

async function finalize(chatId, sessionRef, data) {
    try {
        const now = new Date();
        const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
        const dateStr = brazilTime.toISOString().split('T')[0];

        const transaction = {
            description: data.description,
            category: data.category,
            value: data.value,
            date: dateStr,
            type: 'expense',
            isCompleted: data.paymentMethod === 'balance',
            paymentMethod: data.paymentMethod,
            creditCardId: data.creditCardId || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection(`users/${YOUR_FIREBASE_UID}/finance`).add(transaction);
        await sessionRef.delete();

        const methodDesc = data.paymentMethod === 'credit' ? `Cartão ${data.cardName}` : 'Saldo em Conta';
        bot.sendMessage(chatId, `✅ *Lançamento Confirmado!*\n\n📝 *${data.description}*\n💰 R$ ${data.value.toFixed(2)}\n💳 ${methodDesc}`, { parse_mode: 'Markdown' });

        // Agendar notificação no celular em 20 segundos
        setTimeout(async () => {
            try {
                await db.collection(`users/${YOUR_FIREBASE_UID}/notifications`).add({
                    title: "Lançamento via Telegram",
                    message: `✅ Confirmado: ${data.description} - R$ ${data.value.toFixed(2)}`,
                    type: "success",
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    read: false
                });
                console.log("Notificação agendada enviada com sucesso.");
            } catch (err) {
                console.error("Erro ao enviar notificação agendada:", err);
            }
        }, 20000);

    } catch (e) {
        bot.sendMessage(chatId, "❌ Erro ao salvar.");
    }
}

app.get('/', (req, res) => res.send('Bot Online com OCR e Notificações'));
app.listen(port, () => console.log(`Rodando na porta ${port}`));
