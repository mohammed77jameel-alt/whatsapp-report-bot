/**
 * whatsapp-report-bot-main/services/email-service.js
 * SMTP Transport & Dispatch Engine (Optimized & Timeout-Protected Fix)
 */

const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        // تعبئة البيانات مباشرة لضمان عدم ظهور أي خطأ في الاعتماديات
        this.smtpUser = 'c11443001@smtp-brevo.com';
        this.smtpPass = 'xsmtpsib-8ecf1ac034cd7a8159fd0c53ec37f1b84391425b13872ca572b2e519d253fbde-7yLLjuAsjnhvE2Ox';
        this.smtpHost = 'smtp-relay.brevo.com';
        this.smtpPort = 587;

        this.transporter = nodemailer.createTransport({
            host: this.smtpHost,
            port: this.smtpPort,
            secure: false,
            requireTLS: true,
            auth: {
                user: this.smtpUser,
                pass: this.smtpPass
            },
            // إعدادات حماية وتحديد أوقات الانتظار لمنع تعليق السيرفر (Timeout) نهائياً
            connectionTimeout: 10000, // 10 ثوانٍ كحد أقصى لمحاولة الاتصال
            greetingTimeout: 10000,   // 10 ثوانٍ لانتظار رد خادم Brevo
            socketTimeout: 15000      // 15 ثانية كحد أقصى لنشاط الـ Socket
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
