const nodemailer = require('nodemailer');
require('dotenv').config(); // .env değişkenlerini yükle

// Nodemailer taşıyıcısını oluştur
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'), // Port numarasını integer yap
    secure: process.env.SMTP_SECURE === 'true', // port 465 için true, diğerleri için false
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Uygulama şifresi
    },
    // TLS ayarları (özellikle yerel geliştirme veya self-signed sertifikalar için)
    // tls: {
    //     rejectUnauthorized: false
    // }
});

/**
 * E-posta gönderme fonksiyonu
 * @param {string} to - Alıcı e-posta adresi
 * @param {string} subject - E-posta konusu
 * @param {string} text - E-posta metin içeriği (isteğe bağlı)
 * @param {string} html - E-posta HTML içeriği
 * @param {Array} [attachments] - E-posta ekleri (isteğe bağlı)
 * @returns {Promise<object>} - Nodemailer gönderim sonucu
 */
const sendEmail = async ({ to, subject, text, html, attachments }) => {
    const mailOptions = {
        from: `"Depo Yönetim Sistemi" <${process.env.SMTP_FROM}>`, // Gönderen adı ve adresi
        to: to, // Alıcı
        subject: subject, // Konu
        text: text, // Düz metin içeriği
        html: html, // HTML içeriği
        attachments: attachments // Ekler (varsa)
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('E-posta gönderildi: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('E-posta gönderme hatası:', error);
        throw new Error('E-posta gönderilirken bir sorun oluştu.');
    }
};

module.exports = sendEmail; 