/**
 * whatsapp-report-bot-main/bot.js
 * Elite Cyber Ops Center - Strict Access Control, Role-Based Keyboard & Smart Unban Check
 * (With HTTP Server Integration for Render Health Checks & Timeout Protection)
 */

require('dotenv').config();
const http = require('http');
const { Telegraf, Markup } = require('telegraf');
const reportService = require('./services/report-service');
const emailService = require('./services/email-service');
const nodemailer = require('nodemailer');

// ==========================================
// 🌐 خادم HTTP مصغر لتلبية متطلبات Render (Port Binding Fix)
// ==========================================
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WhatsApp Cyber Ops Bot is Healthy & Running!\n');
}).listen(PORT, () => {
    console.log(`🌐 HTTP Server active on port ${PORT} for Render health checks.`);
});

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error("❌ TELEGRAM_BOT_TOKEN is not defined in environment variables!");
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// معالجة الأخطاء العامة لضمان عدم انهيار البوت
bot.catch((err, ctx) => {
    console.error(`🚨 Error for ${ctx.updateType}:`, err);
    if (ctx && ctx.reply) {
        ctx.reply(`⚠️ حدث خطأ أثناء المعالجة: ${err.message}`).catch(() => {});
    }
});

// ==========================================
// 🛡️ المالك الأساسي والمشرفين المعتمدين
// ==========================================
const OWNER_ID = 6734384045; // آيدي المالك الأساسي حصرياً

// المشرفون المعتمدون (الآيدي والاسم)
const authorizedAdmins = new Map([
    [OWNER_ID, "المالك الأساسي"]
]);

// حراسة أمنية صارمة: منع أي شخص غريب من استخدام البوت نهائياً
bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    
    // إذا لم يكن المستخدم مسجلاً في القائمة، يتم رفض دخوله تماماً ولن يظهر له أي زر
    if (!authorizedAdmins.has(userId)) {
        return ctx.reply("⛔ **[ وصول مرفوض ]**\nعذراً، هذا البوت خاص ومحمي بالكامل. لا يمكنك استخدامه أو الوصول إليه.", { parse_mode: 'Markdown' });
    }
    return next();
});

const userState = {};
const userTargetPhone = {};

const stats = {
    totalReports: 0,
    totalUnbans: 0,
    totalOsint: 0,
    lastTarget: "لا يوجد"
};

let lastOperationLog = "⚠️ لم يتم تنفيذ أي عملية حتى الآن.";

// صيغ فك حظر واتساب المتنوعة
const unbanTemplates = [
    {
        subject: "Account Ban Review Request: +{phone}",
        text: `WhatsApp Support Team,\n\nHello,\n\nMy WhatsApp account +{phone} has been banned unexpectedly. I believe this might have been a mistake by the automated systems, as I strictly follow WhatsApp's Terms of Service.\n\nThis account is extremely important for my daily communication, work, and studies. Kindly review this case and restore my account as soon as possible.\n\nThank you for your time and assistance.\n\nBest regards,\nAccount Holder`
    },
    {
        subject: "Urgent: Unban My Suspended Number +{phone}",
        text: `Dear WhatsApp Support,\n\nI am writing to appeal the sudden suspension of my phone number +{phone}. I have not violated any terms or policies, and I use the application strictly for personal and educational communication.\n\nPlease investigate this wrongful ban and reactivate my account promptly. I appreciate your swift support.\n\nSincerely,\nUser`
    },
    {
        subject: "Account Restoration Appeal - +{phone}",
        text: `Hello WhatsApp Team,\n\nMy primary account +{phone} was restricted without clear reasons. I rely on this number for all my essential contacts and daily tasks.\n\nKindly lift this restriction and restore access to my account. Thank you for your cooperation.\n\nBest regards,\nDedicated User`
    }
];

// دالة الكيبورد الذكي: (لوحة المشرفين تظهر للمالك الأساسي فقط، ولا تظهر للمشرفين المضافين)
function getKeyboardMenu(userId) {
    const menu = [
        ['⚡ مركز العمليات السيبرانية ⚡'],
        ['🚀 إبلاغ واتساب', '🔓 فك حظر واتساب'],
        ['🕵️‍♂️ فحص استخباراتي (OSINT)'],
        ['🔓 فك حظر تيليجرام', '🚨 بلاغ تيليجرام'],
        ['📊 إحصائيات العمليات', '⚡ فحص السيرفرات'],
        ['📋 سجل العمليات الشامل']
    ];

    // زر لوحة المشرفين يظهر للمالك الأساسي فقط
    if (userId === OWNER_ID) {
        menu.push(['⚙️ لوحة المشرفين']);
    }

    return Markup.keyboard(menu).resize().persistent();
}

// رسالة البداية
bot.start((ctx) => {
    const userId = ctx.from.id;
    delete userState[userId];
    ctx.reply(
        "⚡ **[ WHATSAPP & TELEGRAM CYBER OPS CENTER ]** ⚡\n" +
        "─────────────────────────────\n" +
        "أهلاً بك يا بطل في لوحة التحكم السيبرانية المتقدمة.\n" +
        "اختر المهمة المطلوبة من الكيبورد السفلي:",
        {
            parse_mode: 'Markdown',
            ...getKeyboardMenu(userId)
        }
    );
});

bot.hears('⚡ مركز العمليات السيبرانية ⚡', async (ctx) => {
    await ctx.reply("🔥 النظام يعمل بكفاءة وأمان تام تحت إشرافك المباشر.", { parse_mode: 'Markdown', ...getKeyboardMenu(ctx.from.id) });
});

bot.hears('🚀 إبلاغ واتساب', async (ctx) => {
    userState[ctx.from.id] = 'WAITING_FOR_REPORT_PHONE';
    await ctx.reply("🎯 أرسل الآن رقم الهاتف المستهدف مع مفتاح الدولة\n*(مثال: `96770000000`)*", { parse_mode: 'Markdown' });
});

bot.hears('🔓 فك حظر واتساب', async (ctx) => {
    userState[ctx.from.id] = 'WAITING_FOR_UNBAN_PHONE';
    await ctx.reply("🛡️ أرسل الآن رقم الهاتف المحظور مع مفتاح الدولة\n*(مثال: `96770000000`)*", { parse_mode: 'Markdown' });
});

bot.hears('🕵️‍♂️ فحص استخباراتي (OSINT)', async (ctx) => {
    userState[ctx.from.id] = 'WAITING_FOR_OSINT_PHONE';
    await ctx.reply("🕵️‍♂️ أرسل الآن الرقم المراد فحص بياناته مع مفتاح الدولة\n*(مثال: `96770000000`)*", { parse_mode: 'Markdown' });
});

bot.hears('🔓 فك حظر تيليجرام', async (ctx) => {
    await ctx.reply(
        `🔓 **[ دليل فك حظر حسابات تيليجرام ]**\n` +
        `─────────────────────────────\n` +
        `1️⃣ اذهب إلى البوت الرسمي: [@SpamBot](https://t.me/SpamBot)\n` +
        `2️⃣ أرسل له أمر البدء \`/start\` وسيخبرك بحالة حظرك.\n` +
        `3️⃣ اتبع التعليمات التي يطلبها لإرسال طلب الاستئناف.`,
        { parse_mode: 'Markdown' }
    );
});

bot.hears('🚨 بلاغ تيليجرام', async (ctx) => {
    await ctx.reply(
        `🚨 **[ التوجيهات الرسمية لبلاغات تيليجرام ]**\n` +
        `─────────────────────────────\n` +
        `1️⃣ اذهب للملف الشخصي أو القناة المخالفة.\n` +
        `2️⃣ اضغط على (...) ثم اختر **إبلاغ (Report)**.\n` +
        `3️⃣ حدد سبب الانتهاك بدقة.`,
        { parse_mode: 'Markdown' }
    );
});

bot.hears('📊 إحصائيات العمليات', async (ctx) => {
    await ctx.reply(
        `📊 **[ لوحة إحصائيات العمليات ]**\n` +
        `─────────────────────────────\n` +
        `🚀 **إجمالي بلاغات الأرقام:** \`${stats.totalReports} عملية\`\n` +
        `🔓 **إجمالي طلبات فك الحظر:** \`${stats.totalUnbans} عملية\`\n` +
        `🕵️‍♂️ **إجمالي الفحوصات:** \`${stats.totalOsint} عملية\`\n` +
        `🎯 **آخر رقم تم التعامل معه:** \`+${stats.lastTarget}\`\n` +
        `👥 **عدد المشرفين المعتمدين:** \`${authorizedAdmins.size}\``,
        { parse_mode: 'Markdown' }
    );
});

bot.hears('⚡ فحص السيرفرات', async (ctx) => {
    await ctx.reply("⏳ جاري فحص اتصال واختبار استجابة خادم البريد (`Brevo SMTP Relay`)...");
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER || 'c11443001@smtp-brevo.com',
                pass: process.env.SMTP_PASS || 'xsmtpsib-8ecf1ac034cd7a8159fd0c53ec37f1b84391425b13872ca572b2e519d253fbde-7yLLjuAsjnhvE2Ox'
            },
            connectionTimeout: 10000
        });
        await transporter.verify();
        await ctx.reply(`⚡ **[ تقرير حالة السيرفر - SMTP Healthy ]**\n🌐 المضيف متصل وجاهز بنسبة 100% للإرسال الفوري!`, { parse_mode: 'Markdown' });
    } catch (error) {
        await ctx.reply(`🚨 **[ تحذير: مشكلة في السيرفر ]**\n${error.message}`);
    }
});

bot.hears('📋 سجل العمليات الشامل', async (ctx) => {
    await ctx.reply(`📋 **[ سجل العمليات والتدقيق الشامل ]**\n─────────────────────────────\n` + lastOperationLog, { parse_mode: 'Markdown' });
});

// لوحة المشرفين (للمالك حصرياً)
bot.hears('⚙️ لوحة المشرفين', async (ctx) => {
    if (ctx.from.id !== OWNER_ID) {
        return ctx.reply("⛔ هذه اللوحة مخصصة لمالك البوت الأساسي فقط!");
    }
    await ctx.reply(
        `⚙️ **[ لوحة إدارة المشرفين السيبرانية ]**\n` +
        `─────────────────────────────\n` +
        `اختر العملية المطلوبة أدناه:`,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('👥 عرض المستخدمين', 'admin_list_users')],
                [Markup.button.callback('➕ إضافة مستخدم جديد', 'admin_add_user')]
            ])
        }
    );
});

// عرض المستخدمين
bot.action('admin_list_users', async (ctx) => {
    if (ctx.from.id !== OWNER_ID) return ctx.answerCbQuery("مرفوض!", { show_alert: true });
    await ctx.answerCbQuery();
    let usersList = "";
    let index = 1;
    for (const [id, name] of authorizedAdmins.entries()) {
        usersList += `${index}️⃣\nالاسم : \`${name}\`\nالأيدي : \`${id}\`\n─────────────────\n`;
        index++;
    }
    await ctx.reply(
        `👥 **[ قائمة المستخدمين والمشرفين المعتمدين ]**\n` +
        `*(اضغط على النص لنسخه مباشرة)*\n` +
        `─────────────────────────────\n` +
        usersList,
        { parse_mode: 'Markdown' }
    );
});

bot.action('admin_add_user', async (ctx) => {
    if (ctx.from.id !== OWNER_ID) return ctx.answerCbQuery("مرفوض!", { show_alert: true });
    userState[ctx.from.id] = 'WAITING_FOR_NEW_ADMIN_DETAILS';
    await ctx.answerCbQuery();
    await ctx.reply(
        `➕ **[ إضافة مستخدم جديد ]**\n` +
        `─────────────────────────────\n` +
        `أرسل الآن بيانات المستخدم الجديد بالصيغة التالية:\n` +
        `\`الآيدي, الاسم\`\n\n` +
        `*(مثال: ` + `6734384045, أحمد محمد` + `)*`,
        { parse_mode: 'Markdown' }
    );
});

// استقبال النصوص والحالات البرمجية
bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const text = ctx.message.text.trim();

    const menuButtons = [
        '⚡ مركز العمليات السيبرانية ⚡',
        '🚀 إبلاغ واتساب', 
        '🔓 فك حظر واتساب', 
        '🕵️‍♂️ فحص استخباراتي (OSINT)', 
        '📊 إحصائيات العمليات', 
        '🔓 فك حظر تيليجرام',
        '🚨 بلاغ تيليجرام',
        '⚡ فحص السيرفرات', 
        '📋 سجل العمليات الشامل',
        '⚙️ لوحة المشرفين'
    ];

    if (menuButtons.includes(text)) return;
    if (text.startsWith('/')) {
        if (text === '/start' || text === '/menu') {
            delete userState[userId];
            return ctx.reply("⚡ **[ لوحة التحكم السيبرانية ]**", { parse_mode: 'Markdown', ...getKeyboardMenu(userId) });
        }
        return;
    }

    const currentState = userState[userId];

    // إضافة مستخدم/مشرف جديد (للمالك حصرياً)
    if (currentState === 'WAITING_FOR_NEW_ADMIN_DETAILS') {
        if (userId !== OWNER_ID) {
            delete userState[userId];
            return ctx.reply("⛔ عذراً، هذه الصلاحية للمالك الأساسي فقط.");
        }
        delete userState[userId];
        const parts = text.split(',');
        if (parts.length < 2) {
            return ctx.reply("❌ صيغة غير صحيحة. يرجى الإرسال بالشكل التالي: `الآيدي, الاسم`", { parse_mode: 'Markdown' });
        }
        const newId = parseInt(parts[0].trim());
        const newName = parts[1].trim();

        if (!newId || !newName) {
            return ctx.reply("❌ بيانات غير صالحة. تأكد من كتابة الآيدي والاسم بشكل صحيح.");
        }

        authorizedAdmins.set(newId, newName);
        await ctx.reply(`✅ **[ تمت إضافة المستخدم بنجاح ]**\nالاسم : \`${newName}\`\nالأيدي : \`${newId}\``, { parse_mode: 'Markdown', ...getKeyboardMenu(userId) });
        return;
    }

    // 1. إبلاغ - استقبال الرقم
    if (currentState === 'WAITING_FOR_REPORT_PHONE') {
        const targetPhone = text.replace(/[^0-9]/g, '');
        userTargetPhone[userId] = targetPhone;
        userState[userId] = 'WAITING_FOR_REPORT_COUNT';
        await ctx.reply(`🎯 الرقم المستهدف: \`+${targetPhone}\`\n\n🔢 **أدخل الآن عدد الدفعات البريدية للإبلاغ:**\n*(أدخل رقماً فقط مثل ` + `3` + `)*`, { parse_mode: 'Markdown' });

    } else if (currentState === 'WAITING_FOR_REPORT_COUNT') {
        delete userState[userId];
        const targetPhone = userTargetPhone[userId];
        const count = parseInt(text) || 1;

        stats.totalReports += count;
        stats.lastTarget = targetPhone;

        await ctx.reply(`⏳ جاري إرسال عدد (${count}) دفعات بلاغات بصيغ متنوعة للرقم: +${targetPhone}...`);

        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER || 'c11443001@smtp-brevo.com',
                    pass: process.env.SMTP_PASS || 'xsmtpsib-8ecf1ac034cd7a8159fd0c53ec37f1b84391425b13872ca572b2e519d253fbde-7yLLjuAsjnhvE2Ox'
                },
                connectionTimeout: 10000
            });

            let successCount = 0;
            let allSentMessages = "";
            const reportTypes = ['false_positive', 'compromised', 'tos_violation'];

            for (let i = 1; i <= count; i++) {
                const rType = reportTypes[(i - 1) % reportTypes.length];
                const payload = await reportService.compile(targetPhone, 'report', rType);
                
                await transporter.sendMail({
                    from: `"WhatsApp Abuse Desk" <${process.env.SMTP_USER || 'c11443001@smtp-brevo.com'}>`,
                    to: process.env.WHATSAPP_ABUSE_EMAIL || 'abuse@whatsapp.net',
                    subject: `Urgent Abuse Report: +${targetPhone}`,
                    html: `<div style="font-family: Arial; padding: 20px;">${payload.body.replace(/\n/g, '<br>')}</div>`
                });

                allSentMessages += `--- [ الدفعة رقم ${i} (${rType}) ] ---\n${payload.body}\n\n`;
                successCount++;
                if (i < count) await new Promise(resolve => setTimeout(resolve, 1000));
            }

            lastOperationLog = `📌 **نوع العملية:** إبلاغ عن رقم (Report)\n🎯 **الرقم المستهدف:** \`+${targetPhone}\`\n📊 **عدد الدفعات:** \`${successCount} دفعات\`\n📤 **السيرفر:** \`Brevo SMTP Relay\`\n\n📝 **نصوص التقارير المُرسلة بالكامل:**\n\`\`\`text\n${allSentMessages}\`\`\``;

            await ctx.reply(`✅ **[ تم إرسال البلاغات بنجاح ]**\nتم إرسال (${successCount}) دفعات بصيغ مختلفة للرقم +${targetPhone}.`, { parse_mode: 'Markdown', ...getKeyboardMenu(userId) });
        } catch (error) {
            console.error("Report Error:", error);
            await ctx.reply(`🚨 حدث خطأ أثناء الإرسال:\n${error.message}`, { ...getKeyboardMenu(userId) });
        }

    // 2. فك حظر - استقبال الرقم
    } else if (currentState === 'WAITING_FOR_UNBAN_PHONE') {
        const targetPhone = text.replace(/[^0-9]/g, '');
        userTargetPhone[userId] = targetPhone;
        userState[userId] = 'WAITING_FOR_UNBAN_COUNT';
        await ctx.reply(`🛡️ الرقم المستهدف لفك الحظر: \`+${targetPhone}\`\n\n🔢 **أدخل الآن عدد رسائل الاستئناف البريدية:**\n*(أدخل رقماً فقط مثل ` + `1` + ` أو ` + `3` + `)*`, { parse_mode: 'Markdown' });

    // فك حظر - تنفيذ وإرسال الطلبات مع توضيح حالة الرقم بحسب استجابة النظام
    } else if (currentState === 'WAITING_FOR_UNBAN_COUNT') {
        delete userState[userId];
        const targetPhone = userTargetPhone[userId];
        const count = parseInt(text) || 1;

        stats.totalUnbans += count;
        stats.lastTarget = targetPhone;

        await ctx.reply(`⏳ جاري إرسال عدد (${count}) طلبات استئناف بأساليب متغيرة للرقم: +${targetPhone}...`);

        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER || 'c11443001@smtp-brevo.com',
                    pass: process.env.SMTP_PASS || 'xsmtpsib-8ecf1ac034cd7a8159fd0c53ec37f1b84391425b13872ca572b2e519d253fbde-7yLLjuAsjnhvE2Ox'
                },
                connectionTimeout: 10000
            });

            let successCount = 0;
            let allUnbanMessages = "";

            for (let i = 1; i <= count; i++) {
                const template = unbanTemplates[(i - 1) % unbanTemplates.length];
                const currentSubject = template.subject.replace('{phone}', targetPhone);
                const currentText = template.text.replace(/{phone}/g, targetPhone);

                await transporter.sendMail({
                    from: `"WhatsApp Support Appeals" <${process.env.SMTP_USER || 'c11443001@smtp-brevo.com'}>`,
                    to: `support@whatsapp.net, android_support@whatsapp.net`,
                    subject: currentSubject,
                    html: `<div style="font-family: Arial; padding: 20px;">${currentText.replace(/\n/g, '<br>')}</div>`
                });

                allUnbanMessages += `--- [ الاستئناف رقم ${i} ] ---\nالعنوان: ${currentSubject}\n${currentText}\n\n`;
                successCount++;
                if (i < count) await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // توضيح حالة الرقم بدقة للمستخدم
            const statusReport = 
                `📌 **[ نتيجة فحص وحالة الرقم ]**\n` +
                `• **الرقم المفحوص:** \`+${targetPhone}\`\n` +
                `• **حالة البلاغات البريدية:** تم إرسال (${successCount}) طلبات استئناف لدعم واتساب بنجاح.\n` +
                `• **التوجيه الفني:**\n` +
                `  1️⃣ إذا كان الرقم **محظوراً حالياً**: ستتم مراجعة الطلب من قبل الدعم الفني، وعند فك الحظر سيطلب منك تطبيق واتساب **"تسجيل رقم جديد"**.\n` +
                `  2️⃣ إذا كان الرقم **غير محظور (سليم)**: فلن تتأثر خدمته وسيستقبل الرسائل بشكل طبيعي.\n` +
                `  💡 *قم بتجربة فتح الرقم عبر تطبيق واتساب الرسمي بعد قليل للتحقق الفوري.*`;

            lastOperationLog = `📌 **نوع العملية:** فك حظر (Unban Appeal)\n🛡️ **الرقم المستهدف:** \`+${targetPhone}\`\n📊 **الرسائل:** \`${successCount} رسائل\`\n\n📝 **نصوص الاستئناف المُرسلة بالكامل:**\n\`\`\`text\n${allUnbanMessages}\`\`\``;

            await ctx.reply(
                `✅ **[ تم إرسال طلبات فك الحظر بنجاح ]**\n\n` +
                statusReport,
                { parse_mode: 'Markdown', ...getKeyboardMenu(userId) }
            );
        } catch (error) {
            console.error("Unban Error:", error);
            await ctx.reply(`🚨 حدث خطأ أثناء الإرسال:\n${error.message}`, { ...getKeyboardMenu(userId) });
        }

    // 3. فحص استخباراتي OSINT
    } else if (currentState === 'WAITING_FOR_OSINT_PHONE') {
        delete userState[userId];
        const targetPhone = text.replace(/[^0-9]/g, '');

        stats.totalOsint++;
        stats.lastTarget = targetPhone;

        const osintReport = 
            `🕵️‍♂️ **[ تقرير الفحص الاستخباراتي OSINT ]**\n` +
            `─────────────────────────────\n` +
            `🎯 **الرقم المفحوص:** \`+${targetPhone}\`\n\n` +
            `💬 **روابط التواصل السريع:**\n` +
            `• [فتح محادثة واتساب المباشرة](https://wa.me/${targetPhone})\n\n` +
            `🔍 **روابط التفتيش والبحث المتقدم المباشرة:**\n` +
            `• [بحث في Google عن الرقم](https://www.google.com/search?q=%2B${targetPhone})\n` +
            `• [بحث عبر Truecaller Web](https://www.truecaller.com/search/ar/${targetPhone})\n` +
            `─────────────────────────────\n` +
            `💡 تم توليد الروابط الاستخباراتية النشطة بنجاح.`;

        lastOperationLog = `📌 **نوع العملية:** فحص استخباراتي OSINT\n🎯 **الرقم:** \`+${targetPhone}\``;

        await ctx.reply(osintReport, { parse_mode: 'Markdown', ...getKeyboardMenu(userId) });

    } else {
        await ctx.reply("⚠️ يرجى الضغط على أحد أزرار لوحة التحكم لإجراء العمليات.", { parse_mode: 'Markdown', ...getKeyboardMenu(userId) });
    }
});

// التشغيل
bot.launch().then(() => {
    console.log("🔥 Secure Cyber Ops Center Bot with Strict Access & Status Report is active...");
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
