const sendEmail = require('../utils/emailService');
require('dotenv').config();

const contactController = {
    sendContactEmail: async (req, res) => {
        const { name, email, message } = req.body;

        // Basit doğrulama
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Lütfen tüm alanları doldurun.'
            });
        }

        // E-posta içeriği
        const subject = `Depo Yönetim Sistemi - Yeni İletişim Formu Mesajı`;
        const receiverEmail = process.env.REPORT_EMAIL || process.env.SMTP_USER; // .env'deki REPORT_EMAIL veya SMTP_USER'a gönder
        const emailHtml = `
            <h1>Yeni İletişim Formu Mesajı</h1>
            <p><strong>Gönderen Adı:</strong> ${name}</p>
            <p><strong>Gönderen Email:</strong> ${email}</p>
            <hr>
            <p><strong>Mesaj:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
        `;
        const emailText = `Yeni İletişim Formu Mesajı\nGönderen Adı: ${name}\nGönderen Email: ${email}\nMesaj: ${message}`;

        try {
            await sendEmail({
                to: receiverEmail,
                subject: subject,
                text: emailText,
                html: emailHtml
            });

            res.status(200).json({
                success: true,
                message: 'Mesajınız başarıyla gönderildi.'
            });
        } catch (error) {
            console.error('İletişim e-postası gönderme hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Mesaj gönderilirken bir sunucu hatası oluştu.'
            });
        }
    }
};

module.exports = contactController; 