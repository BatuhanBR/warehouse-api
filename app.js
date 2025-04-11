const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./src/models');
const helmet = require('helmet');
const { authLimiter, apiLimiter } = require('./src/middleware/rateLimiter');
const errorHandler = require('./src/middleware/errorHandler');
const morgan = require('morgan');
const logger = require('./src/config/logger');
const logActivity = require('./src/middleware/activityLogger');
const { initializeDatabase } = require('./src/models');
require('./src/jobs/stockAlertJob');  // Cron job'ları başlat
const activityLogger = require('./src/middleware/activityLogger');
const path = require('path');

const app = express();

// Geniş CORS ayarları (tüm originlere izin ver)
const corsOptions = {
  origin: '*', // veya spesifik origin: 'http://localhost:3001'
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions)); // CORS'u seçeneklerle uygula

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiters
app.use('/api/auth', authLimiter);
app.use('/api/', apiLimiter);

// Morgan'ı özelleştirilmiş formatta kullan
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"', {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));

// Statik dosyaları sunmadan ÖNCE CORS'un uygulandığından emin olalım
// (Yukarıdaki genel app.use(cors(corsOptions)) aslında yeterli olmalı,
// ama express.static'in davranışına karşı ek güvence olarak düşünebiliriz.
// Bu satır muhtemelen gereksiz ama zararı da olmaz.)
// app.use('/uploads', cors(corsOptions)); 

// Statik dosyaları sun
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Activity logger'ı ekle
app.use(logActivity);
app.use(activityLogger);  // Aktivite logger'ı ekle

// Debug için log ekleyelim
console.log('Loading routes...');

// Route'ları import et
const productRoutes = require('./src/routes/productRoutes');
const authRoutes = require('./src/routes/authRoutes');
const stockRoutes = require('./src/routes/stockRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const roleRoutes = require('./src/routes/roleRoutes');
const userRoutes = require('./src/routes/userRoutes');
const stockAlertRoutes = require('./src/routes/stockAlertRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const locationRoutes = require('./src/routes/locationRoutes');
const importExportRoutes = require('./src/routes/importExportRoutes');
const testRoutes = require('./src/routes/testRoutes');
const stockMovementRoutes = require('./src/routes/stockMovementRoutes');
const warehouseRoutes = require('./src/routes/warehouseRoutes');
const shelfRoutes = require('./src/routes/shelfRoutes');
const expenseRoutes = require('./src/routes/expenseRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
console.log('All routes loaded');

// Ana route
app.get('/', (req, res) => {
    res.json({ message: 'Depo Yönetim Sistemi API' });
});

// Route'ları kullan
console.log('Registering API routes:');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/stock-movements', stockMovementRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/stock-alerts', stockAlertRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/import-export', importExportRoutes);
app.use('/api/test', testRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/shelves', shelfRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/contact', contactRoutes);

console.log('All API routes registered');

// 404 handler - bilinen tüm rotaları kontrol ettikten sonra
app.use((req, res, next) => {
    console.log(`[404] Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: 'Endpoint bulunamadı'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Bir hata oluştu'
    });
});

// Veritabanı bağlantısı ve sunucuyu başlat
db.sequelize.authenticate().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        logger.info(`Server ${PORT} portunda çalışıyor`);
    });
}).catch(err => {
    logger.error('Veritabanı bağlantı hatası:', err);
});

module.exports = app;