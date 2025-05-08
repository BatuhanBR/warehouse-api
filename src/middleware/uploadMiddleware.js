const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Yükleme dizinini belirle ve yoksa oluştur
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'profile-pictures'); // Ana dizinden uploads/profile-pictures
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Disk depolama ayarları
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Dosyaların kaydedileceği dizin
    },
    filename: function (req, file, cb) {
        // Dosya adını özelleştir: user-<userId>-<timestamp>.<extension>
        // req.user.id'nin var olduğundan emin olalım (authMiddleware sonrası çalışmalı)
        const userId = req.user && req.user.id ? req.user.id : 'unknown';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `user-${userId}-${uniqueSuffix}${extension}`);
    }
});

// Dosya tipi filtresi (sadece resimlere izin ver)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    // Hata nesnesi yerine callback ile hata mesajını iletmek daha standart
    cb(new Error('Geçersiz dosya tipi. Sadece resim dosyaları (jpeg, jpg, png, gif, webp) yükleyebilirsiniz.')); 
};

// Multer middleware instance'ı oluştur
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit: 5MB
    fileFilter: fileFilter
});

// Tek dosya yükleme için middleware ('profilePicture' alanı adı frontend'den gelecek)
// Hata yönetimi için try-catch bloğu ekleyelim
const uploadProfilePicture = (req, res, next) => {
    const uploader = upload.single('profilePicture');
    uploader(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // Multer kaynaklı hata (örn: limit aşımı)
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Dosya boyutu çok büyük. Maksimum 5MB.' });
            }
            return res.status(400).json({ message: `Multer hatası: ${err.message}` });
        } else if (err) {
            // Bizim fileFilter'dan gelen veya başka beklenmedik hata
            return res.status(400).json({ message: err.message || 'Dosya yüklenirken bir hata oluştu.' });
        }
        // Hata yoksa sonraki middleware'e (controller) geç
        next();
    });
};

module.exports = { uploadProfilePicture }; 