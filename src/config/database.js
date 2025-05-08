const { Sequelize } = require('sequelize');
require('dotenv').config();

const config = {
    dialect: 'postgres',  // Direkt string olarak belirtiyoruz
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'your_password',
    database: process.env.DB_NAME || 'warehouse_db',
    logging: false
};

const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
        host: config.host,
        port: config.port,
        dialect: config.dialect,
        logging: config.logging
    }
);

// Veritabanı bağlantısını test et
(async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL veritabanı bağlantısı başarıyla kuruldu.');
    } catch (error) {
        console.error('Veritabanına bağlanılamadı:', error);
    }
})();

module.exports = sequelize;module.exports.config = config;  // Migration için config'i de export ediyoruz
