const sequelize = require('../../src/config/database');
const { DataTypes } = require('sequelize');
const Location = require('../../src/models/location');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
    try {
        // 1. Önce rolleri oluştur
        const Role = sequelize.model('Role');
        const roles = await Role.bulkCreate([
            { name: 'admin', description: 'Sistem yöneticisi' },
            { name: 'manager', description: 'Depo yöneticisi' },
            { name: 'staff', description: 'Depo personeli' }
        ]);
        console.log('Roller oluşturuldu');

        // 2. Sonra kullanıcıları oluştur
        const User = sequelize.model('User');
        const users = await User.bulkCreate([
            {
                username: 'admin',
                email: 'admin@example.com',
                password: await bcrypt.hash('admin123', 10),
                roleId: 1,
                isActive: true
            },
            {
                username: 'manager',
                email: 'manager@example.com',
                password: await bcrypt.hash('manager123', 10),
                roleId: 2,
                isActive: true
            },
            {
                username: 'staff',
                email: 'staff@example.com',
                password: await bcrypt.hash('staff123', 10),
                roleId: 3,
                isActive: true
            }
        ]);
        console.log('Kullanıcılar oluşturuldu');

        // 3. Kategorileri oluştur
        const Category = sequelize.model('Category');
        const categories = await Category.bulkCreate([
            { name: 'Elektronik', description: 'Elektronik ürünler' },
            { name: 'Giyim', description: 'Giyim ürünleri' },
            { name: 'Ev & Yaşam', description: 'Ev ve yaşam ürünleri' },
            { name: 'Spor', description: 'Spor malzemeleri' },
            { name: 'Kitap', description: 'Kitaplar' },
            { name: 'Kozmetik', description: 'Kozmetik ürünleri' },
            { name: 'Oyuncak', description: 'Oyuncaklar' },
            { name: 'Ofis', description: 'Ofis malzemeleri' }
        ]);
        console.log('Kategoriler oluşturuldu');

        // 4. Lokasyonları oluştur
        const Location = sequelize.model('Location');
        const locations = await Location.bulkCreate([
            {
                code: 'A1-1-1',
                section: 'A',
                row: 1,
                level: 1,
                position: 1,
                capacity: 100,
                coordinates: { x: 0, y: 0, z: 0 }
            },
            {
                code: 'A1-1-2',
                section: 'A',
                row: 1,
                level: 1,
                position: 2,
                capacity: 100,
                coordinates: { x: 1, y: 0, z: 0 }
            },
            {
                code: 'A1-2-1',
                section: 'A',
                row: 2,
                level: 1,
                position: 1,
                capacity: 100,
                coordinates: { x: 0, y: 1, z: 0 }
            },
            {
                code: 'A1-2-2',
                section: 'A',
                row: 2,
                level: 1,
                position: 2,
                capacity: 100,
                coordinates: { x: 1, y: 1, z: 0 }
            }
        ]);
        console.log('Lokasyonlar oluşturuldu');

        // 5. Örnek ürünleri oluştur
        const Product = sequelize.model('Product');
        const products = await Product.bulkCreate([
            {
                name: 'Laptop',
                sku: 'EL0001',
                price: 5000,
                quantity: 10,
                categoryId: 1,
                locationId: 1,
                createdBy: 1,
                minStockLevel: 5
            },
            {
                name: 'T-Shirt',
                sku: 'GY0001',
                price: 100,
                quantity: 50,
                categoryId: 2,
                locationId: 2,
                createdBy: 1,
                minStockLevel: 20
            }
        ]);
        console.log('Ürünler oluşturuldu');

        // Ürünlere random lokasyon ata
        for (const product of products) {
            const randomLocation = locations[Math.floor(Math.random() * locations.length)];
            await product.update({
                locationId: randomLocation.id,
                position3D: {
                    x: randomLocation.coordinates.x,
                    y: randomLocation.coordinates.y,
                    z: randomLocation.coordinates.z
                }
            });
        }

        // Stok hareketleri
        const StockMovement = sequelize.model('StockMovement');
        const stockMovements = [];
        const movementTypes = ['IN', 'OUT'];
        const descriptions = ['Yeni stok girişi', 'Satış', 'İade', 'Sayım farkı', 'Hasar'];

        for (let i = 0; i < 200; i++) {
            const randomProduct = products[Math.floor(Math.random() * products.length)];
            const type = movementTypes[Math.floor(Math.random() * movementTypes.length)];
            const quantity = Math.floor(Math.random() * 20) + 1;

            stockMovements.push({
                productId: randomProduct.id,
                type,
                quantity,
                description: descriptions[Math.floor(Math.random() * descriptions.length)],
                previousStock: randomProduct.quantity,
                newStock: type === 'IN' ? randomProduct.quantity + quantity : randomProduct.quantity - quantity,
                createdBy: users[Math.floor(Math.random() * users.length)].id
            });
        }

        await StockMovement.bulkCreate(stockMovements);
        console.log('Stok hareketleri oluşturuldu');

        console.log('Dummy data başarıyla eklendi!');
        return true;
    } catch (error) {
        console.error('Dummy data eklenirken hata:', error);
        return false;
    }
};

module.exports = seedDatabase;