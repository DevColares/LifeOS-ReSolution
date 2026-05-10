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

        console.log("--- Texto do PDF (Resumo) ---");
        console.log(fullText ? `${fullText.substring(0, 500)}...` : "(Vazio)");
        console.log("----------------------------");
        
        // Regex aprimorada: 
        const valueRegex = /(?:R\$|\$|RS|VALOR|TOTAL|PAGO)\s*[:=]?\s*([\d\.,]+)(?:[\s\n,.]+([0-9]{2}))?\b/i;
        const match = fullText.match(valueRegex);

        if (match) {
            let integerPart = match[1];
            let centsPart = match[2];

            if (integerPart.includes(',')) {
                const parts = integerPart.split(',');
                if (parts[1].length === 2) {
                    centsPart = parts[1];
                    integerPart = parts[0].replace(/[\.\s]/g, '');
                } else {
                    integerPart = integerPart.replace(/[\.\s,]/g, '');
                }
            } else if (integerPart.includes('.')) {
                const parts = integerPart.split('.');
                if (parts[parts.length - 1].length === 2) {
                    centsPart = parts[parts.length - 1];
                    integerPart = parts.slice(0, -1).join('').replace(/[\s,]/g, '');
                } else {
                    integerPart = integerPart.replace(/[\.\s,]/g, '');
                }
            }

            if (!centsPart && match[2]) {
                centsPart = match[2];
                integerPart = integerPart.replace(/[\.\s,]/g, '');
            }

            if (!centsPart) {
                if (integerPart.length >= 3) {
                    centsPart = integerPart.slice(-2);
                    integerPart = integerPart.slice(0, -2);
                } else {
                    centsPart = "00";
                }
            }

            const value = parseFloat(`${integerPart}.${centsPart}`);

            if (!isNaN(value)) {
                const sessionRef = db.collection("botSessions").doc(chatId.toString());
                await sessionRef.set({ step: "waiting_type", value, chatId });
                const keyboard = { reply_markup: { keyboard: [[{ text: "Saída 🔴" }, { text: "Entrada 🟢" }]], one_time_keyboard: true, resize_keyboard: true }};
                bot.sendMessage(chatId, `💰 *R$ ${value.toFixed(2)}* detectado no PDF!\n\nO que é isso?`, keyboard);
                return;
            }
        }

        // Busca genérica (fallback)
        const genericValueRegex = /(\d+[\d\.]*)(?:[\s\n,.]+([0-9]{2}))\b/g;
        let genericMatch;
        let lastFoundValue = null;

        while ((genericMatch = genericValueRegex.exec(fullText)) !== null) {
            const intP = genericMatch[1].replace(/[\.\s]/g, '');
            const centsP = genericMatch[2];
            const val = parseFloat(`${intP}.${centsP}`);
            if (!isNaN(val)) lastFoundValue = val;
        }

        if (lastFoundValue === null) {
            const rawNumbers = fullText.match(/\b\d{3,}\b/g);
            if (rawNumbers) {
                const lastNum = rawNumbers[rawNumbers.length - 1];
                const val = parseFloat(`${lastNum.slice(0, -2)}.${lastNum.slice(-2)}`);
                if (!isNaN(val)) lastFoundValue = val;
            }
        }

        if (lastFoundValue !== null) {
            const sessionRef = db.collection("botSessions").doc(chatId.toString());
            await sessionRef.set({ step: "waiting_type", value: lastFoundValue, chatId });
            const keyboard = { reply_markup: { keyboard: [[{ text: "Saída 🔴" }, { text: "Entrada 🟢" }]], one_time_keyboard: true, resize_keyboard: true }};
            bot.sendMessage(chatId, `💰 *R$ ${lastFoundValue.toFixed(2)}* detectado no PDF!\n\nO que é isso?`, keyboard);
        } else {
            bot.sendMessage(chatId, "❌ Não encontrei o valor no PDF.");
        }
    } catch (error) {
        console.error("Erro PDF:", error.message || error);
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

        console.log("--- Texto extraído (Resumo) ---");
        console.log(fullText ? `${fullText.substring(0, 500)}...` : "(Vazio)");
        console.log("------------------------------");

        if (!fullText) {
            bot.sendMessage(chatId, "❌ Não consegui ler nenhum texto nesta imagem. Tente uma foto mais nítida.");
            return;
        }

        // Regex aprimorada: 
        // Captura a parte numérica principal e tenta identificar centavos separados por espaço/newline
        const valueRegex = /(?:R\$|\$|RS|VALOR|TOTAL|PAGO)\s*[:=]?\s*([\d\.,]+)(?:[\s\n,.]+([0-9]{2}))?\b/i;
        const match = fullText.match(valueRegex);

        if (match) {
            let integerPart = match[1];
            let centsPart = match[2];

            // Verificação prioritária: Se match[1] já tem formato de decimal (ex: 65,00)
            if (integerPart.includes(',')) {
                const parts = integerPart.split(',');
                if (parts[1].length === 2) {
                    centsPart = parts[1];
                    integerPart = parts[0].replace(/[\.\s]/g, '');
                } else {
                    // Se a vírgula não separa 2 dígitos, removemos e tratamos como parte do inteiro
                    integerPart = integerPart.replace(/[\.\s,]/g, '');
                }
            } else if (integerPart.includes('.')) {
                // Se tem ponto, pode ser decimal (ex: 65.00) ou milhar (ex: 1.500)
                const parts = integerPart.split('.');
                if (parts[parts.length - 1].length === 2) {
                    centsPart = parts[parts.length - 1];
                    integerPart = parts.slice(0, -1).join('').replace(/[\s,]/g, '');
                } else {
                    integerPart = integerPart.replace(/[\.\s,]/g, '');
                }
            }

            // Se ainda não temos centsPart mas o regex capturou o grupo 2
            if (!centsPart && match[2]) {
                centsPart = match[2];
                integerPart = integerPart.replace(/[\.\s,]/g, '');
            }

            // Fallback para números sem separador (ex: 568 -> 5,68)
            if (!centsPart) {
                if (integerPart.length >= 3) {
                    centsPart = integerPart.slice(-2);
                    integerPart = integerPart.slice(0, -2);
                } else {
                    centsPart = "00";
                }
            }

            const value = parseFloat(`${integerPart}.${centsPart}`);

            if (!isNaN(value)) {
                const sessionRef = db.collection("botSessions").doc(chatId.toString());
                await sessionRef.set({ step: "waiting_type", value, chatId });
                const keyboard = { reply_markup: { keyboard: [[{ text: "Saída 🔴" }, { text: "Entrada 🟢" }]], one_time_keyboard: true, resize_keyboard: true }};
                bot.sendMessage(chatId, `💰 *R$ ${value.toFixed(2)}* detectado!\n\nO que é isso?`, keyboard);
                return;
            }
        }

        // Busca genérica (fallback)
        const genericValueRegex = /(\d+[\d\.]*)(?:[\s\n,.]+([0-9]{2}))\b/g;
        let genericMatch;
        let lastFoundValue = null;

        while ((genericMatch = genericValueRegex.exec(fullText)) !== null) {
            const intP = genericMatch[1].replace(/[\.\s]/g, '');
            const centsP = genericMatch[2];
            const val = parseFloat(`${intP}.${centsP}`);
            if (!isNaN(val)) lastFoundValue = val;
        }

        // Se não encontrou no formato acima, tenta buscar qualquer número de 3+ dígitos e assume centavos
        if (lastFoundValue === null) {
            const rawNumbers = fullText.match(/\b\d{3,}\b/g);
            if (rawNumbers) {
                const lastNum = rawNumbers[rawNumbers.length - 1];
                const val = parseFloat(`${lastNum.slice(0, -2)}.${lastNum.slice(-2)}`);
                if (!isNaN(val)) lastFoundValue = val;
            }
        }

        if (lastFoundValue !== null) {
            const sessionRef = db.collection("botSessions").doc(chatId.toString());
            await sessionRef.set({ step: "waiting_type", value: lastFoundValue, chatId });
            const keyboard = { reply_markup: { keyboard: [[{ text: "Saída 🔴" }, { text: "Entrada 🟢" }]], one_time_keyboard: true, resize_keyboard: true }};
            bot.sendMessage(chatId, `💰 *R$ ${lastFoundValue.toFixed(2)}* detectado!\n\nO que é isso?`, keyboard);
        } else {
            bot.sendMessage(chatId, "❌ Valor não encontrado na imagem. Tente digitar o valor manualmente.");
        }
    } catch (error) {
        console.error("ERRO VISION:", error.message || error);
        bot.sendMessage(chatId, `⚠️ Erro ao processar imagem: ${error.message}`);
    }
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : "";

    // Ignorar se for foto ou documento (já tratados nos handlers específicos)
    if (msg.photo || msg.document) return;
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
                await sessionRef.set({ step: "waiting_type", value, chatId });
                const keyboard = { reply_markup: { keyboard: [[{ text: "Saída 🔴" }, { text: "Entrada 🟢" }]], one_time_keyboard: true, resize_keyboard: true }};
                bot.sendMessage(chatId, `💰 *R$ ${value.toFixed(2)}* registrado!\n\nO que é isso?`, keyboard);
            }
            return;
        }

        if (session.step === "waiting_type") {
            const type = text.includes("Entrada") ? "income" : "expense";
            await sessionRef.update({ step: "waiting_description", type });
            bot.sendMessage(chatId, "📝 Agora, me diga a *Descrição*:", { parse_mode: 'Markdown' });
            return;
        }

        if (session.step === "waiting_description") {
            await sessionRef.update({ step: "waiting_category", description: text });
            const catSnap = await db.doc(`users/${YOUR_FIREBASE_UID}/settings/categories`).get();
            const defaultCats = session.type === "income" ? ["Salário", "Investimento", "Presente", "Outros"] : ["Alimentação", "Transporte", "Moradia", "Lazer", "Outros"];
            const categories = catSnap.exists ? (catSnap.data()[session.type] || defaultCats) : defaultCats;
            
            const keyboard = { reply_markup: { keyboard: categories.map(cat => [{ text: cat }]), one_time_keyboard: true, resize_keyboard: true }};
            bot.sendMessage(chatId, "📂 Escolha a *Categoria*:", keyboard);
            return;
        }

        if (session.step === "waiting_category") {
            await sessionRef.update({ step: "waiting_method", category: text });
            if (session.type === "income") {
                // Para entradas, geralmente vai direto para o saldo
                return finalize(chatId, sessionRef, { ...session, category: text, paymentMethod: "balance" });
            } else {
                const keyboard = { reply_markup: { keyboard: [[{ text: "Saldo em Conta" }], [{ text: "Cartão de Crédito" }]], one_time_keyboard: true, resize_keyboard: true }};
                bot.sendMessage(chatId, "💳 Como pagou?", keyboard);
            }
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
        console.error("Erro no fluxo:", e.message || e);
        bot.sendMessage(chatId, "❌ Ocorreu um erro no processamento. Tente novamente ou use /cancel.");
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
            type: data.type || 'expense',
            isCompleted: data.type === 'income' || data.paymentMethod === 'balance',
            paymentMethod: data.paymentMethod,
            creditCardId: data.creditCardId || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection(`users/${YOUR_FIREBASE_UID}/finance`).add(transaction);
        await sessionRef.delete();

        const typeIcon = data.type === 'income' ? '🟢' : '🔴';
        const methodDesc = data.paymentMethod === 'credit' ? `Cartão ${data.cardName}` : 'Saldo em Conta';
        bot.sendMessage(chatId, `✅ *Lançamento Confirmado!* ${typeIcon}\n\n📝 *${data.description}*\n💰 R$ ${data.value.toFixed(2)}\n💳 ${methodDesc}`, { parse_mode: 'Markdown' });

        // Enviar notificação no celular imediatamente para feedback rápido
        try {
            console.log(`Enviando notificação para o UID: ${YOUR_FIREBASE_UID}`);
            const typeIcon = data.type === 'income' ? '🟢' : '🔴';
            await db.collection(`users/${YOUR_FIREBASE_UID}/notifications`).add({
                title: "Lançamento via Telegram",
                message: `${typeIcon} Confirmado: ${data.description} - R$ ${data.value.toFixed(2)}`,
                type: "success",
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                read: false
            });
            console.log("Notificação enviada com sucesso.");
        } catch (err) {
            console.error("Erro ao enviar notificação:", err);
        }

    } catch (e) {
        bot.sendMessage(chatId, "❌ Erro ao salvar.");
    }
}

app.get('/', (req, res) => res.send('Bot Online com OCR e Notificações'));
app.listen(port, () => console.log(`Rodando na porta ${port}`));
