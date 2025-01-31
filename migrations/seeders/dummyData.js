const sequelize = require('../../src/config/database');
const { DataTypes } = require('sequelize');
const Location = require('../../src/models/location');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
    try {
        // Modelleri doğrudan import etmek yerine sequelize'dan alalım
        const Category = sequelize.model('Category');
        const User = sequelize.model('User');
        const Product = sequelize.model('Product');
        const StockMovement = sequelize.model('StockMovement');

        // Kategoriler
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

        // Test kullanıcıları
        const users = await User.bulkCreate([
            {
                username: 'admin',
                email: 'admin@example.com',
                password: await bcrypt.hash('admin123', 10),
                roleId: 1
            },
            {
                username: 'manager',
                email: 'manager@example.com',
                password: await bcrypt.hash('manager123', 10),
                roleId: 2
            },
            {
                username: 'staff',
                email: 'staff@example.com',
                password: await bcrypt.hash('staff123', 10),
                roleId: 3
            }
        ]);

        console.log('Kullanıcılar oluşturuldu');

        // Ürünler için örnek veriler
        const products = [];
        const skuPrefix = ['EL', 'GY', 'EV', 'SP', 'KT', 'KZ', 'OY', 'OF'];
        const locationCodes = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'];

        for (let i = 0; i < 80; i++) {
            const categoryIndex = Math.floor(i / 10);
            // Bazı ürünleri kritik stok seviyesinde oluştur
            const randomQuantity = i < 10 ? 
                Math.floor(Math.random() * 5) + 1 : // İlk 10 ürün için düşük stok
                Math.floor(Math.random() * 100) + 20;
            
            const minStockLevel = Math.floor(randomQuantity * 1.2); // Mevcut stoktan %20 fazla minimum seviye
            
            const randomPrice = parseFloat((Math.random() * 1000 + 10).toFixed(2));
            
            products.push({
                name: `${categories[categoryIndex % categories.length].name} Ürün ${i + 1}`,
                description: `${categories[categoryIndex % categories.length].name} kategorisinde örnek ürün ${i + 1}`,
                sku: `${skuPrefix[categoryIndex % skuPrefix.length]}${String(i + 1).padStart(4, '0')}`,
                quantity: randomQuantity,
                price: randomPrice,
                locationCode: locationCodes[Math.floor(Math.random() * locationCodes.length)],
                minStockLevel: minStockLevel,
                categoryId: categories[categoryIndex % categories.length].id,
                createdBy: users[Math.floor(Math.random() * users.length)].id,
                updatedBy: users[Math.floor(Math.random() * users.length)].id
            });
        }

        const createdProducts = await Product.bulkCreate(products);
        console.log('Ürünler oluşturuldu');

        // Lokasyonları oluştur
        const warehouseLocations = await Location.bulkCreate([
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

        // Ürünlere random lokasyon ata
        for (const product of createdProducts) {
            const randomLocation = warehouseLocations[Math.floor(Math.random() * warehouseLocations.length)];
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
        const stockMovements = [];
        const movementTypes = ['IN', 'OUT'];
        const descriptions = ['Yeni stok girişi', 'Satış', 'İade', 'Sayım farkı', 'Hasar'];

        for (let i = 0; i < 200; i++) {
            const randomProduct = createdProducts[Math.floor(Math.random() * createdProducts.length)];
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