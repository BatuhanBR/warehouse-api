const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const seedDatabase = require('../../migrations/seeders/dummyData');
const User = require('./user');
const Product = require('./product');
const StockMovement = require('./stockMovement');
const Category = require('./category');
const Role = require('./role');
const Location = require('./location');

// Modelleri yükle
const models = {
    User,
    Product,
    StockMovement,
    Category,
    Role,
    Location
};
const modelsPath = path.join(__dirname);

// Modelleri dinamik olarak yükle
fs.readdirSync(modelsPath)
    .filter(file => file.indexOf('.') !== 0 && file !== 'index.js' && file.slice(-3) === '.js')
    .forEach(file => {
        const model = require(path.join(modelsPath, file));
        models[model.name] = model;
    });

// İlişkileri kur
Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

// Tabloları doğru sırayla oluştur
async function initializeDatabase() {
    try {
        // Sırayla tabloları oluştur
        await Role.sync();
        console.log('Role tablosu güncellendi');

        await User.sync();
        console.log('User tablosu güncellendi');

        await Category.sync();
        console.log('Category tablosu güncellendi');

        await Location.sync();
        console.log('Location tablosu güncellendi');

        await Product.sync();
        console.log('Product tablosu güncellendi');

        await StockMovement.sync();
        console.log('StockMovement tablosu güncellendi');

        // Test verilerini kontrol et
        const roleCount = await Role.count();
        if (roleCount === 0) {
            await seedDatabase();
            console.log('Test verileri eklendi');
        }

        console.log('Veritabanı başarıyla başlatıldı!');
    } catch (error) {
        console.error('Veritabanı başlatma hatası:', error);
        throw error;
    }
}

// Modelleri ve fonksiyonları export et
module.exports = {
    sequelize,
    Sequelize,
    ...models,
    initializeDatabase
};