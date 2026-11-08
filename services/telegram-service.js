const axios = require('axios');
const config = require('../config.js');

class TelegramService {
    constructor() {
        this.endpoint = `${config.telegram.apiBase}/sendMessage`;
    }

    async sendLiveDashboard(telemetry) {
        const layout = 
            `🌟 *ENGINE OPERATIONAL UPDATE* 🌟\n\n` +
            `▪️ *State Engine:* \`ISOLATED_PROXIED\`\n` +
            `▪️ *Throughput Nodes:* \`${telemetry.activeNodes}\`\n` +
            `▪️ *Success Quota:* \`${telemetry.successRate}\`\n\n` +
            `_System operating normally within standard performance metrics._`;

        this.fireAndForget(layout);
    }

    async logAlert(alertString) {
        const format = `⚠️ *CRITICAL STRUCTURAL NOTICE* ⚠️\n\n\`\`\`\n${alertString}\n\`\`\``;
        this.fireAndForget(format);
    }

    fireAndForget(payloadText) {
        if (!config.telegram.token || !config.telegram.chatId) return;
        
        axios.post(this.endpoint, {
            chat_id: config.telegram.chatId,
            text: payloadText,
            parse_mode: 'Markdown'
        }).catch(err => console.error(`[Telemetry Drop]: ${err.message}`));
    }
}

module.exports = new TelegramService();