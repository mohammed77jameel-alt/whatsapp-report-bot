/**
 * whatsapp-report-bot-main/services/email-service.js
 * Brevo HTTP API Dispatch Engine (Bypasses Render SMTP Port Blocking)
 */

class EmailService {
    constructor() {
        this.apiKey = 'xsmtpsib-8ecf1ac034cd7a8159fd0c53ec37f1b84391425b13872ca572b2e519d253fbde-7yLLjuAsjnhvE2Ox';
        this.senderEmail = 'c11443001@smtp-brevo.com';
    }

    async sendReport(targetPhone, htmlContent) {
        try {
            // استخدام fetch المدمج في Node.js للاتصال عبر بروتوكول HTTP الآمن (Port 443) غير المحظور
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': this.apiKey,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: {
                        name: "Security Operations Desk",
                        email: this.senderEmail
                    },
                    to: [
                        { email: "abuse@whatsapp.net" },
                        { email: "support@whatsapp.net" }
                    ],
                    subject: `Urgent Report Regarding WhatsApp Account: +${targetPhone}`,
                    htmlContent: htmlContent
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Brevo API Error (${response.status}): ${errorData}`);
            }

            const data = await response.json();
            return { success: true, messageId: data.messageId || 'api-success' };
        } catch (error) {
            throw new Error(`HTTP Transmission Failed: ${error.message}`);
        }
    }
}

module.exports = new EmailService();
