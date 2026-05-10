const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');
const express = require('express');
require('dotenv').config();

// --- CONFIGURAÇÕES ---
const token = process.env.TELEGRAM_TOKEN;
const port = process.env.PORT || 3000;
const YOUR_FIREBASE_UID = process.env.FIREBASE_UID;

// Inicializar Firebase Admin
// No Render, você deve colar o conteúdo do seu serviceAccountKey.json na variável de ambiente FIREBASE_SERVICE_ACCOUNT
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} else {
    console.error("ERRO: FIREBASE_SERVICE_ACCOUNT não configurada!");
    process.exit(1);
}

const db = admin.firestore();
const bot = new TelegramBot(token, { polling: true });
const app = express();
app.use(express.json());

console.log("Bot de Finanças LifeOS iniciado...");

// --- LÓGICA DO BOT ---

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : "";

    if (!text) return;

    // Comando de cancelamento
    if (text.toLowerCase() === '/cancel' || text.toLowerCase() === '/start') {
        await db.collection("botSessions").doc(chatId.toString()).delete();
        if (text === '/start') {
            bot.sendMessage(chatId, "👋 Olá! Envie um valor (ex: 50.00) para começar um lançamento.");
        } else {
            bot.sendMessage(chatId, "❌ Lançamento cancelado.");
        }
        return;
    }

    // 1. Buscar sessão ativa
    const sessionRef = db.collection("botSessions").doc(chatId.toString());
    const sessionSnap = await sessionRef.get();
    let session = sessionSnap.exists ? sessionSnap.data() : { step: "idle" };

    try {
        // PASSO 0: Recebeu um valor
        if (session.step === "idle") {
            const cleanValue = text.replace(',', '.').replace('R$', '').trim();
            const value = parseFloat(cleanValue);
            
            if (!isNaN(value)) {
                await sessionRef.set({ step: "waiting_description", value, chatId });
                bot.sendMessage(chatId, `💰 *R$ ${value.toFixed(2)}* registrado!\n\nAgora me diga a *Descrição* (ex: Almoço, Uber, Mercado):`, { parse_mode: 'Markdown' });
            } else {
                bot.sendMessage(chatId, "Por favor, envie um valor numérico válido (ex: 25,50).");
            }
            return;
        }

        // PASSO 1: Recebeu a Descrição
        if (session.step === "waiting_description") {
            await sessionRef.update({ step: "waiting_category", description: text });
            
            // Buscar categorias do sistema
            const catSnap = await db.doc(`users/${YOUR_FIREBASE_UID}/settings/categories`).get();
            const categories = catSnap.exists ? catSnap.data().expense : ["Alimentação", "Transporte", "Lazer", "Outros"];
            
            const keyboard = {
                reply_markup: {
                    keyboard: categories.map(cat => [{ text: cat }]),
                    one_time_keyboard: true,
                    resize_keyboard: true
                }
            };
            bot.sendMessage(chatId, "📂 Selecione a *Categoria*:", { parse_mode: 'Markdown', ...keyboard });
            return;
        }

        // PASSO 2: Recebeu a Categoria
        if (session.step === "waiting_category") {
            await sessionRef.update({ step: "waiting_method", category: text });
            
            const keyboard = {
                reply_markup: {
                    keyboard: [[{ text: "Saldo em Conta" }], [{ text: "Cartão de Crédito" }]],
                    one_time_keyboard: true,
                    resize_keyboard: true
                }
            };
            bot.sendMessage(chatId, "💳 Como você pagou?", keyboard);
            return;
        }

        // PASSO 3: Recebeu o Método de Pagamento
        if (session.step === "waiting_method") {
            if (text === "Cartão de Crédito") {
                await sessionRef.update({ step: "waiting_card", paymentMethod: "credit" });
                
                const cardsSnap = await db.collection(`users/${YOUR_FIREBASE_UID}/creditCards`).get();
                const cards = cardsSnap.docs.map(d => [{ text: d.data().name }]);
                
                if (cards.length === 0) {
                    bot.sendMessage(chatId, "Você não tem cartões cadastrados. Vou salvar como Saldo.");
                    return finalize(chatId, sessionRef, { ...session, paymentMethod: "balance" });
                }

                const keyboard = {
                    reply_markup: {
                        keyboard: cards,
                        one_time_keyboard: true,
                        resize_keyboard: true
                    }
                };
                bot.sendMessage(chatId, "💳 Qual *Cartão* você usou?", { parse_mode: 'Markdown', ...keyboard });
            } else {
                return finalize(chatId, sessionRef, { ...session, paymentMethod: "balance" });
            }
            return;
        }

        // PASSO 4: Recebeu o Cartão
        if (session.step === "waiting_card") {
            const cardsSnap = await db.collection(`users/${YOUR_FIREBASE_UID}/creditCards`).get();
            const selectedCard = cardsSnap.docs.find(d => d.data().name === text);
            
            return finalize(chatId, sessionRef, { 
                ...session, 
                paymentMethod: "credit",
                creditCardId: selectedCard ? selectedCard.id : null,
                cardName: text
            });
        }

    } catch (error) {
        console.error("Erro no bot:", error);
        bot.sendMessage(chatId, "❌ Ocorreu um erro ao processar. Tente novamente com /cancel.");
    }
});

async function finalize(chatId, sessionRef, data) {
    try {
        const transaction = {
            description: data.description,
            category: data.category,
            value: data.value,
            date: new Date().toISOString().split('T')[0],
            type: 'expense',
            isCompleted: data.paymentMethod === 'balance',
            paymentMethod: data.paymentMethod,
            creditCardId: data.creditCardId || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection(`users/${YOUR_FIREBASE_UID}/finance`).add(transaction);
        await sessionRef.delete();

        const methodDesc = data.paymentMethod === 'credit' ? `Cartão ${data.cardName}` : 'Saldo em Conta';
        bot.sendMessage(chatId, `✅ *Lançamento Confirmado!*\n\n📝 *${data.description}*\n📂 ${data.category}\n💰 R$ ${data.value.toFixed(2)}\n💳 ${methodDesc}\n\nO Dashboard já foi atualizado!`, { parse_mode: 'Markdown' });
    } catch (e) {
        bot.sendMessage(chatId, "❌ Erro ao salvar no banco de dados.");
    }
}

// Health check para o Render
app.get('/', (req, res) => res.send('Bot Financeiro LifeOS está ONLINE!'));
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
