const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');
const express = require('express');
const vision = require('@google-cloud/vision');
const axios = require('axios');
const pdf = require('pdf-parse');
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

// Tratar Documentos (PDF)
bot.on('document', async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.document || msg.document.mime_type !== 'application/pdf') return;

    try {
        bot.sendMessage(chatId, "📄 Lendo PDF...");
        const fileLink = await bot.getFileLink(msg.document.file_id);
        
        const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
        const data = await pdf(response.data);
        const fullText = data.text;

        console.log("--- Texto do PDF ---");
        console.log(fullText || "(Vazio)");
        console.log("--------------------");
        
        // Regex aprimorada: 
        const valueRegex = /(?:R\$|\$|RS|VALOR|TOTAL|PAGO)\s*[:=]?\s*([\d\.,]+)(?:[\s\n,.]+([0-9]{2}))?\b/i;
        const match = fullText.match(valueRegex);

        if (match) {
            let integerPart = match[1];
            let centsPart = match[2];

            if (integerPart.includes(',')) {
                const parts = integerPart.split(',');
                if (parts[1].length === 2 && !centsPart) {
                    centsPart = parts[1];
                    integerPart = parts[0];
                }
            }

            const cleanInteger = integerPart.replace(/[\.\s]/g, '');
            const finalCents = centsPart || "00";
            const value = parseFloat(`${cleanInteger}.${finalCents}`);

            if (!isNaN(value)) {
                const sessionRef = db.collection("botSessions").doc(chatId.toString());
                await sessionRef.set({ step: "waiting_description", value, chatId });
                bot.sendMessage(chatId, `💰 *R$ ${value.toFixed(2)}* detectado no PDF!\n\nAgora, me diga a *Descrição*:`, { parse_mode: 'Markdown' });
                return;
            }
        }

        // Tenta busca genérica
        const genericValueRegex = /(\d+[\d\.]*)(?:[\s\n,.]+([0-9]{2}))\b/g;
        let genericMatch;
        let lastFoundValue = null;

        while ((genericMatch = genericValueRegex.exec(fullText)) !== null) {
            const integerPart = genericMatch[1].replace(/[\.\s]/g, '');
            const centsPart = genericMatch[2];
            const val = parseFloat(`${integerPart}.${centsPart}`);
            if (!isNaN(val)) lastFoundValue = val;
        }

        if (lastFoundValue !== null) {
            const sessionRef = db.collection("botSessions").doc(chatId.toString());
            await sessionRef.set({ step: "waiting_description", value: lastFoundValue, chatId });
            bot.sendMessage(chatId, `💰 *R$ ${lastFoundValue.toFixed(2)}* detectado no PDF!\n\nAgora, me diga a *Descrição*:`, { parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, "❌ Não encontrei o valor no PDF.");
        }
    } catch (error) {
        console.error("Erro PDF:", error);
        bot.sendMessage(chatId, "⚠️ Erro ao processar PDF.");
    }
});

// Tratar Fotos (Comprovantes)
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const fileId = msg.photo[msg.photo.length - 1].file_id;

    try {
        bot.sendMessage(chatId, "🔍 Lendo comprovante...");

        const fileLink = await bot.getFileLink(fileId);
        
        // Baixar a imagem como buffer para maior confiabilidade
        const imageResponse = await axios.get(fileLink, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data, 'binary');

        const [result] = await visionClient.textDetection({ image: { content: imageBuffer } });
        const fullText = result.fullTextAnnotation?.text || "";

        console.log("--- Texto extraído ---");
        console.log(fullText || "(Vazio)");
        console.log("----------------------");

        if (!fullText) {
            bot.sendMessage(chatId, "❌ Não consegui ler nenhum texto nesta imagem. Tente uma foto mais nítida.");
            return;
        }

        // Regex aprimorada: 
        // 1. Procura por palavras-chave
        // 2. Captura a parte inteira (com possíveis pontos de milhar)
        // 3. Captura centavos que podem estar separados por espaço, vírgula, ponto ou quebra de linha
        const valueRegex = /(?:R\$|\$|RS|VALOR|TOTAL|PAGO)\s*[:=]?\s*([\d\.,]+)(?:[\s\n,.]+([0-9]{2}))?\b/i;
        const match = fullText.match(valueRegex);

        if (match) {
            let integerPart = match[1];
            let centsPart = match[2];

            // Se o match[1] já contém uma vírgula, provavelmente já tem os centavos
            if (integerPart.includes(',')) {
                const parts = integerPart.split(',');
                // Se a parte após a vírgula tem 2 dígitos, ela é o centavo
                if (parts[1].length === 2 && !centsPart) {
                    centsPart = parts[1];
                    integerPart = parts[0];
                }
            }

            // Limpa pontos de milhar da parte inteira
            const cleanInteger = integerPart.replace(/[\.\s]/g, '');
            const finalCents = centsPart || "00";
            const value = parseFloat(`${cleanInteger}.${finalCents}`);

            if (!isNaN(value)) {
                const sessionRef = db.collection("botSessions").doc(chatId.toString());
                await sessionRef.set({ step: "waiting_description", value, chatId });
                bot.sendMessage(chatId, `💰 *R$ ${value.toFixed(2)}* detectado!\n\nAgora, me diga a *Descrição*:`, { parse_mode: 'Markdown' });
                return;
            }
        }

        // Tenta uma busca genérica se a regex de palavra-chave falhar
        // Busca por: [número][separador opcional][2 dígitos de centavos]
        const genericValueRegex = /(\d+[\d\.]*)(?:[\s\n,.]+([0-9]{2}))\b/g;
        let genericMatch;
        let lastFoundValue = null;

        while ((genericMatch = genericValueRegex.exec(fullText)) !== null) {
            const integerPart = genericMatch[1].replace(/[\.\s]/g, '');
            const centsPart = genericMatch[2];
            const val = parseFloat(`${integerPart}.${centsPart}`);
            if (!isNaN(val)) lastFoundValue = val;
        }

        if (lastFoundValue !== null) {
            const sessionRef = db.collection("botSessions").doc(chatId.toString());
            await sessionRef.set({ step: "waiting_description", value: lastFoundValue, chatId });
            bot.sendMessage(chatId, `💰 *R$ ${lastFoundValue.toFixed(2)}* detectado!\n\nAgora, me diga a *Descrição*:`, { parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, "❌ Valor não encontrado na imagem. Tente digitar o valor manualmente.");
        }
    } catch (error) {
        console.error("ERRO DETALHADO VISION:", error);
        bot.sendMessage(chatId, `⚠️ Erro ao processar imagem: ${error.message}`);
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
