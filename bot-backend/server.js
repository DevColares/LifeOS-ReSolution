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

// Registrar comandos no menu do Telegram
bot.setMyCommands([
    { command: '/start', description: 'Iniciar o bot' },
    { command: '/resumo', description: 'Ver resumo financeiro do mês' },
    { command: '/analisar', description: '🧠 Analisar impacto de uma compra futura' },
    { command: '/cancel', description: 'Cancelar operação atual' }
]);

console.log(`Bot LifeOS (com OCR + Push) iniciado para o UID: ${YOUR_FIREBASE_UID}`);

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

    if (text.toLowerCase() === '/cancel' || text.toLowerCase() === '/start' || text.toLowerCase() === '/resumo' || text.toLowerCase() === '/analisar') {
        if (text.toLowerCase() === '/analisar') {
            const sessionRef = db.collection("botSessions").doc(chatId.toString());
            await sessionRef.set({ step: "analyst_name", chatId });
            bot.sendMessage(chatId, "🧠 *Modo Analista Financeiro ativo!*\n\nMe diga: o que você pretende comprar?", { parse_mode: 'Markdown' });
            return;
        }
        if (text.toLowerCase() === '/resumo') {
            try {
                bot.sendMessage(chatId, "📊 Gerando resumo detalhado...");
                
                const now = new Date();
                const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
                const currMonth = brazilTime.getMonth();
                const currYear = brazilTime.getFullYear();

                const financeSnap = await db.collection(`users/${YOUR_FIREBASE_UID}/finance`).get();
                const allTransactions = financeSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // --- 1. MOVIMENTAÇÕES EM CONTA (SALDO) ---
                const cashTransactions = allTransactions.filter(t => {
                    if (t.paymentMethod === 'credit') return false;
                    const tDate = new Date(t.date + 'T12:00:00');
                    return tDate.getMonth() === currMonth && tDate.getFullYear() === currYear;
                });

                const incomeTotal = cashTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + (parseFloat(t.value) || 0), 0);
                const incomeReceived = cashTransactions.filter(t => t.type === 'income' && t.isCompleted).reduce((acc, t) => acc + (parseFloat(t.value) || 0), 0);
                
                const expenseTotal = cashTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + (parseFloat(t.value) || 0), 0);
                const expensePaid = cashTransactions.filter(t => t.type === 'expense' && t.isCompleted).reduce((acc, t) => acc + (parseFloat(t.value) || 0), 0);

                // --- 3. TOTAIS GERAIS ---
                const realizedBalance = incomeReceived - expensePaid;
                const projectedBalance = incomeTotal - expenseTotal;

                const monthName = brazilTime.toLocaleString('pt-BR', { month: 'long' });
                const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
                
                let message = `📊 *Resumo de ${capitalize(monthName)}*\n\n`;
                
                message += `💰 *Movimentações em Conta (Saldo):*\n`;
                message += `🟢 Entradas: R$ ${incomeTotal.toFixed(2)} (Recebido: ${incomeReceived.toFixed(2)})\n`;
                message += `🔴 Saídas: R$ ${expenseTotal.toFixed(2)} (Pago: ${expensePaid.toFixed(2)})\n\n`;

                message += `⚖️ *Saldo Realizado:* R$ ${realizedBalance.toFixed(2)}\n`;
                message += `📉 *Saldo Final Previsto:* R$ ${projectedBalance.toFixed(2)}\n\n`;
                
                // Categorias (Baseadas no Ciclo Financeiro)
                const categories = {};
                allTransactions.forEach(t => {
                    if (t.type !== 'expense') return;
                    if (t.paymentMethod === 'credit') return; // ignore legacy credit

                    const tDate = new Date(t.date + 'T12:00:00');
                    if (tDate.getMonth() === currMonth && tDate.getFullYear() === currYear) {
                        const cat = t.category || 'Outros';
                        categories[cat] = (categories[cat] || 0) + (parseFloat(t.value) || 0);
                    }
                });

                if (Object.keys(categories).length > 0) {
                    message += `📂 *Gastos por Categoria (${capitalize(monthName)}):*\n`;
                    const sortedCats = Object.entries(categories).sort((a, b) => b[1] - a[1]);
                    sortedCats.forEach(([cat, val]) => {
                        message += `• ${cat}: R$ ${val.toFixed(2)}\n`;
                    });
                }

                bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            } catch (error) {
                console.error("Erro no resumo:", error.message || error);
                bot.sendMessage(chatId, "⚠️ Erro ao gerar resumo.");
            }
            return;
        }

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
            return finalize(chatId, sessionRef, { ...session, category: text, paymentMethod: "balance" });
        }

        // --- ANALISTA FINANCEIRO ---
        if (session.step === "analyst_name") {
            await sessionRef.update({ step: "analyst_value", productName: text });
            bot.sendMessage(chatId, `📦 *${text}*\n\n💰 Qual o valor total da compra?`, { parse_mode: 'Markdown' });
            return;
        }

        if (session.step === "analyst_value") {
            const value = parseFloat(text.replace(',', '.').replace('R$', '').trim());
            if (isNaN(value) || value <= 0) {
                bot.sendMessage(chatId, "❌ Valor inválido. Digite o valor em reais (ex: 3500 ou 3500,00):");
                return;
            }
            await sessionRef.update({ step: "analyst_installments", value });
            const keyboard = { reply_markup: { keyboard: [[{ text: "1" }, { text: "2" }, { text: "3" }], [{ text: "6" }, { text: "10" }, { text: "12" }]], one_time_keyboard: true, resize_keyboard: true }};
            bot.sendMessage(chatId, `💰 *R$ ${value.toFixed(2)}*\n\n🗓️ Em quantas vezes? (1 = à vista)`, { ...keyboard, parse_mode: 'Markdown' });
            return;
        }

        if (session.step === "analyst_installments") {
            const installments = parseInt(text);
            if (isNaN(installments) || installments < 1 || installments > 60) {
                bot.sendMessage(chatId, "❌ Número inválido. Digite de 1 a 60:");
                return;
            }
            bot.sendMessage(chatId, "🔍 Analisando suas finanças... Aguarde.");
            return analyzeAndReport(chatId, sessionRef, { ...session, installments });
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
            console.log("Notificação Firestore salva com sucesso.");
            
            // --- Enviar Push Notification Real ---
            const pushSnap = await db.doc(`users/${YOUR_FIREBASE_UID}/settings/notifications`).get();
            const tokens = pushSnap.exists ? pushSnap.data().tokens : null;

            if (tokens && Array.isArray(tokens) && tokens.length > 0) {
                console.log(`Enviando Push para ${tokens.length} dispositivos...`);
                const typeIcon = data.type === 'income' ? '🟢' : '🔴';
                const message = {
                    data: {
                        title: "Lançamento via Telegram",
                        message: `${typeIcon} Confirmado: ${data.description} - R$ ${data.value.toFixed(2)}`,
                        url: "/finance"
                    },
                    tokens: tokens
                };

                const response = await admin.messaging().sendEachForMulticast(message);
                console.log(`Push enviado: ${response.successCount} sucesso, ${response.failureCount} falha.`);
            }
        } catch (err) {
            console.error("Erro ao enviar notificação (Firestore/Push):", err.message || err);
        }

    } catch (e) {
        bot.sendMessage(chatId, "❌ Erro ao salvar.");
    }
}

// --- ANALISTA FINANCEIRO ---
async function analyzeAndReport(chatId, sessionRef, data) {
    try {
        const now = new Date();
        const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
        const currMonth = brazilTime.getMonth();
        const currYear = brazilTime.getFullYear();

        const financeSnap = await db.collection(`users/${YOUR_FIREBASE_UID}/finance`).get();
        const allTransactions = financeSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const totalValue = data.value;
        const installments = data.installments;
        const installmentValue = totalValue / installments;

        // Calcular entradas do mês atual como referência para meses futuros
        const currentMonthIncome = allTransactions
            .filter(t => {
                if (t.type !== 'income' || t.paymentMethod === 'credit') return false;
                const tDate = new Date(t.date + 'T12:00:00');
                return tDate.getMonth() === currMonth && tDate.getFullYear() === currYear;
            })
            .reduce((acc, t) => acc + (parseFloat(t.value) || 0), 0);

        const monthNames = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];

        let message = `🧠 *Análise de Compra: ${data.productName}*\n\n`;

        if (installments > 1) {
            message += `💳 Valor total: R$ ${totalValue.toFixed(2)} em ${installments}x de R$ ${installmentValue.toFixed(2)}\n\n`;
        } else {
            message += `💳 Valor total: R$ ${totalValue.toFixed(2)} (à vista)\n\n`;
        }

        message += `📊 *Impacto por Mês:*\n`;

        let worstBalance = Infinity;
        let worstMonthName = '';
        let dangerMonths = 0;
        let warningMonths = 0;

        for (let i = 0; i < installments; i++) {
            const targetDate = new Date(currYear, currMonth + i, 1);
            const tMonth = targetDate.getMonth();
            const tYear = targetDate.getFullYear();

            // Buscar transações reais desse mês
            const monthTransactions = allTransactions.filter(t => {
                if (t.paymentMethod === 'credit') return false;
                const tDate = new Date(t.date + 'T12:00:00');
                return tDate.getMonth() === tMonth && tDate.getFullYear() === tYear;
            });

            const monthIncome = monthTransactions
                .filter(t => t.type === 'income')
                .reduce((acc, t) => acc + (parseFloat(t.value) || 0), 0);

            const monthExpense = monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((acc, t) => acc + (parseFloat(t.value) || 0), 0);

            // Se não tem entradas nesse mês, usa a referência do mês atual
            const effectiveIncome = monthIncome > 0 ? monthIncome : currentMonthIncome;
            const isProjected = monthIncome === 0 && i > 0;

            const currentBalance = effectiveIncome - monthExpense;
            const balanceWithPurchase = currentBalance - installmentValue;

            // Margem = quanto sobra em relação às entradas
            const margin = effectiveIncome > 0 ? (balanceWithPurchase / effectiveIncome) * 100 : -100;

            let riskIcon, riskText;
            if (balanceWithPurchase < 0) {
                riskIcon = '🔴';
                riskText = `PERIGO! Ficará negativo: R$ ${balanceWithPurchase.toFixed(2)}`;
                dangerMonths++;
            } else if (margin < 20) {
                riskIcon = '🟡';
                riskText = `Atenção: apenas ${margin.toFixed(0)}% de margem livre`;
                warningMonths++;
            } else {
                riskIcon = '🟢';
                riskText = `Tranquilo: ${margin.toFixed(0)}% de margem livre`;
            }

            if (balanceWithPurchase < worstBalance) {
                worstBalance = balanceWithPurchase;
                worstMonthName = `${monthNames[tMonth]}/${tYear}`;
            }

            message += `\n*${monthNames[tMonth]}/${tYear}*${isProjected ? ' _(projetado)_' : ''}\n`;
            message += `  ✅ Entradas: R$ ${effectiveIncome.toFixed(2)}\n`;
            message += `  📤 Saídas: R$ ${monthExpense.toFixed(2)}\n`;
            message += `  💰 Saldo atual: R$ ${currentBalance.toFixed(2)}\n`;
            message += `  🛒 Com a compra: R$ ${balanceWithPurchase.toFixed(2)}\n`;
            message += `  ${riskIcon} ${riskText}\n`;
        }

        // Resumo Final
        message += `\n━━━━━━━━━━━━━━━━━━\n`;
        message += `⚠️ *Resumo Geral:*\n`;
        message += `• Menor saldo: R$ ${worstBalance.toFixed(2)} em ${worstMonthName}\n`;
        message += `• Total comprometido: R$ ${totalValue.toFixed(2)} ao longo de ${installments} ${installments === 1 ? 'mês' : 'meses'}\n`;

        if (dangerMonths > 0) {
            message += `\n🔴 *RECOMENDAÇÃO: NÃO COMPRE!*\n`;
            message += `Você ficará no vermelho em ${dangerMonths} ${dangerMonths === 1 ? 'mês' : 'meses'}. `;
            message += `Essa compra pode comprometer seriamente suas finanças.`;
        } else if (warningMonths > 0) {
            message += `\n🟡 *RECOMENDAÇÃO: COMPRE COM CAUTELA*\n`;
            message += `Nenhum mês fica negativo, mas ${warningMonths} ${warningMonths === 1 ? 'mês ficará' : 'meses ficarão'} apertado${warningMonths === 1 ? '' : 's'}. `;
            message += `Avalie se é essencial.`;
        } else {
            message += `\n🟢 *RECOMENDAÇÃO: PODE COMPRAR!*\n`;
            message += `Todos os meses ficam com margem confortável. Compra segura!`;
        }

        await sessionRef.delete();
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    } catch (e) {
        console.error("Erro na análise:", e.message || e);
        bot.sendMessage(chatId, "⚠️ Erro ao analisar. Tente novamente.");
    }
}

app.get('/', (req, res) => res.send('Bot Online com OCR e Notificações'));
app.listen(port, () => console.log(`Rodando na porta ${port}`));
