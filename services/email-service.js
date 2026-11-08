/**
 * whatsapp-report-bot-main/services/email-service.js
 * SMTP Transport & Dispatch Engine (Direct Hardcoded Fix)
 */

const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.smtpUser = 'c11443001@smtp-brevo.com';
        this.smtpPass = 'xsmtpsib-8ecf1ac034cd7a8159fd0c53ec37f1b84391425b13872ca572b2e519d253fbde-7yLLjuAsjnhvE2Ox';
        this.smtpHost = 'smtp-relay.brevo.com';
        this.smtpPort = 587;

        this.transporter = nodemailer.createTransport({
            host: this.smtpHost,
            port: this.smtpPort,
            secure: false,
            auth: {
                user: this.smtpUser,
                pass: this.smtpPass
            }
        });
    }

    async sendReport(targetPhone, htmlContent) {
        try {
            const mailOptions = {
                from: `"Security Operations Desk" <${this.smtpUser}>`,
                to: `abuse@whatsapp.net, support@whatsapp.net`,
                subject: `Urgent Report Regarding WhatsApp Account: +${targetPhone}`,
                html: htmlContent
            };

            const info = await this.transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            throw new Error(`SMTP Transmission Failed: ${error.message}`);
        }
    }
}

module.exports = new EmailService();
