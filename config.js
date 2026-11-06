/**
 * whatsapp-report-bot-main/config.js
 * MASTER ARCHITECTURE: Immutable Configuration Graph
 */

const dotenv = require('dotenv');
dotenv.config();

const configurationMatrix = {
    env: process.env.NODE_ENV || 'production',
    engine: {
        concurrency: parseInt(process.env.CONCURRENT_JOBS, 10) || 5,
        logLevel: process.env.LOG_LEVEL || 'info'
    },
    stealth: {
        minDelay: parseInt(process.env.MIN_DELAY_MS, 10) || 2000,
        maxDelay: parseInt(process.env.MAX_DELAY_MS, 10) || 5000,
        rotateFootprints: true
    },
    smtp: {
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        user: process.env.SMTP_USER || process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD
    },
    targets: {
        abuseEmail: process.env.WHATSAPP_ABUSE_EMAIL || "abuse@whatsapp.net",
        supportEmail: process.env.WHATSAPP_SUPPORT_EMAIL || "support@whatsapp.net"
    },
    telegram: {
        token: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID,
        apiBase: `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`
    }
};

// Deep Freeze Utility to guarantee absolute runtime configuration immutability
const deepFreeze = (object) => {
    Object.keys(object).forEach(name => {
        const property = object[name];
        if (property && typeof property === 'object') deepFreeze(property);
    });
    return Object.freeze(object);
};

module.exports = deepFreeze(configurationMatrix);