const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./src/models');
const helmet = require('helmet');
const { authLimiter, apiLimiter } = require('./src/middleware/rateLimiter');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Security middleware
app.use(helmet());

// Rate limiters
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

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

// Ana route
app.get('/', (req, res) => {
    res.json({ message: 'Depo Yönetim Sistemi API' });
});

// Route'ları kullan
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stock-alerts', stockAlertRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/locations', locationRoutes);

// Error handler
app.use(errorHandler);

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
});

module.exports = app;