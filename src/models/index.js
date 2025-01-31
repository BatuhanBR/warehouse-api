const sequelize = require('../config/database');
const User = require('./user');
const Product = require('./product');
const StockMovement = require('./stockMovement');
const Category = require('./category');
const Role = require('./role');
const seedDatabase = require('../../migrations/seeders/dummyData');

const models = {
    User,
    Product,
    StockMovement,
    Category,
    Role
};

// İlişkileri tanımla
Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

// Veritabanını senkronize et ve rolleri oluştur
const initializeDatabase = async () => {
    try {
        // Tüm tabloları oluştur
        await sequelize.sync({ force: true });
        console.log('Tablolar oluşturuldu');

        // Rolleri oluştur
        await Role.bulkCreate([
            {
                name: 'admin',
                description: 'Sistem yöneticisi',
                permissions: {
                    "all": true,
                    "dashboard": true
                }
            },
            {
                name: 'manager',
                description: 'Yönetici',
                permissions: {
                    "products": {
                        "read": true,
                        "create": true,
                        "update": true,
                        "delete": true
                    },
                    "categories": {
                        "read": true,
                        "create": true,
                        "update": true,
                        "delete": true
                    },
                    "stock": {
                        "read": true,
                        "create": true,
                        "update": true,
                        "reports": true
                    },
                    "users": {
                        "read": true,
                        "create": false,
                        "update": false,
                        "delete": false
                    },
                    "dashboard": {
                        "view": true
                    }
                }
            },
            {
                name: 'warehouse_staff',
                description: 'Depo personeli',
                permissions: {
                    "products": {
                        "read": true,
                        "create": false,
                        "update": true,
                        "delete": false
                    },
                    "stock": {
                        "read": true,
                        "create": true,
                        "update": true,
                        "reports": true
                    },
                    "dashboard": {
                        "view": false
                    }
                }
            }
        ]);

        console.log('Roller başarıyla oluşturuldu');

        // Biraz bekleyelim, tabloların tam oluşması için
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Dummy data ekle
        await seedDatabase();

        return true;
    } catch (error) {
        console.error('Veritabanı başlatma hatası:', error);
        return false;
    }
};

// Veritabanını başlat
initializeDatabase();

module.exports = {
    sequelize,
    ...models,
    initializeDatabase
};