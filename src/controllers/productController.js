const { Product, Category, User, StockMovement, sequelize, Location } = require('../models');
const { Op, Sequelize } = require('sequelize');
const logger = require('../config/logger');

// Debug için
console.log('Product Model:', Product);
console.log('User Model:', User);

const PRODUCT_ATTRIBUTES = [
    'id', 'name', 'description', 'sku', 
    'quantity', 'price', 'minStockLevel', 'maxStockLevel',
    'categoryId', 'locationId', 'createdBy',
    'storageStartDate', 'expectedStorageDuration',
    'company', 'weight', 
    'palletType', 'weightCategory',
    'dailyStorageRate',
    'createdAt', 'updatedAt'
];

const productController = {
    getProducts: async (req, res) => {
        try {
            const products = await Product.findAll({
                attributes: PRODUCT_ATTRIBUTES,
                include: [
                    {
                        model: Category,
                        as: 'Category',
                        attributes: ['id', 'name']
                    },
                    {
                        model: Location,
                        as: 'Location',
                        attributes: ['id', 'code', 'rackNumber', 'level', 'position']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            // Ürün verilerini düzenle
            const formattedProducts = products.map(product => {
                const plainProduct = product.get({ plain: true });
                return {
                    ...plainProduct,
                    width: parseFloat(plainProduct.width) || 0,
                    height: parseFloat(plainProduct.height) || 0,
                    length: parseFloat(plainProduct.length) || 0,
                    weight: parseFloat(plainProduct.weight) || 0,
                    price: parseFloat(plainProduct.price) || 0,
                    dailyStorageRate: parseFloat(plainProduct.dailyStorageRate) || 0
                };
            });

            res.json({
                success: true,
                data: formattedProducts
            });
        } catch (error) {
            console.error('Get products error:', error);
            res.status(500).json({
                success: false,
                message: 'Ürünler yüklenirken bir hata oluştu'
            });
        }
    },

    getProductById: async (req, res) => {
        try {
            const { id } = req.params;
            const product = await Product.findByPk(id, {
                include: [
                    { model: Category, as: 'Category', attributes: ['id', 'name'] },
                    { model: Location, as: 'Location', attributes: ['id', 'code', 'rackNumber', 'level', 'position'] }
                ],
                attributes: [
                    'id', 'name', 'sku', 'description', 'quantity', 'price', 
                    'minStockLevel', 'categoryId', 'locationId', 'company', 
                    'weight', 'width', 'height', 'length', 'sizeCategory', 'createdAt', 'updatedAt'
                ]
            });

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Ürün bulunamadı'
                });
            }

            res.json({
                success: true,
                data: product
            });

        } catch (error) {
            console.error('Get product by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Ürün getirilirken bir hata oluştu'
            });
        }
    },

    createProduct: async (req, res) => {
        const t = await sequelize.transaction();

        try {
            const userId = req.user.id;

            // SKU formatını kontrol et
            const skuFormat = /^\d{2}-[A-Z]{5}$/;
            if (!skuFormat.test(req.body.sku.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'SKU formatı geçersiz. Format: XX-YYYYY (2 sayı - 5 büyük harf) şeklinde olmalıdır.'
                });
            }

            const productData = {
                name: req.body.name.trim(),
                description: req.body.description || '',
                sku: req.body.sku.trim(),
                quantity: parseInt(req.body.quantity) || 0,
                minStockLevel: parseInt(req.body.minStockLevel) || 0,
                maxStockLevel: parseInt(req.body.maxStockLevel) || 0,
                storageStartDate: req.body.storageStartDate || null,
                expectedStorageDuration: parseInt(req.body.expectedStorageDuration) || 30,
                categoryId: parseInt(req.body.categoryId),
                locationId: req.body.locationId || null,
                createdBy: userId,
                company: req.body.company || '',
                weight: parseFloat(req.body.weight) || 0,
                width: parseFloat(req.body.width) || 0,
                height: parseFloat(req.body.height) || 0,
                length: parseFloat(req.body.length) || 0,
                dailyStorageRate: parseFloat(req.body.dailyStorageRate) || 0,
                price: parseFloat(req.body.price) || 0,
                sizeCategory: req.body.sizeCategory || ''
            };

            const product = await Product.create(productData, { transaction: t });

            // İlk stok hareketi kaydını oluştur
            if (productData.quantity > 0) {
                await StockMovement.create({
                    type: 'IN',
                    quantity: productData.quantity,
                    description: 'İlk stok girişi',
                    productId: product.id,
                    locationId: productData.locationId,
                    previousStock: 0,
                    newStock: productData.quantity,
                    createdBy: userId
                }, { transaction: t });
            }

            // Lokasyonu güncelle
            if (productData.locationId) {
                await Location.update(
                    { isOccupied: true },
                    { 
                        where: { id: productData.locationId },
                        transaction: t 
                    }
                );
            }

            await t.commit();

            res.status(201).json({
                success: true,
                message: 'Ürün başarıyla oluşturuldu',
                data: product
            });
        } catch (error) {
            await t.rollback();
            console.error('Create product error:', error);
            res.status(400).json({
                success: false,
                message: 'Ürün oluşturulurken bir hata oluştu',
                error: error.message
            });
        }
    },

    updateProduct: async (req, res) => {
        console.log('Received Body:', req.body);
        const transaction = await sequelize.transaction();
        
        try {
            const { id } = req.params;
            
            // Önce ürünü bulalım
            const product = await Product.findByPk(id, { transaction });

            if (!product) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Ürün bulunamadı'
                });
            }

            const updateData = {};
            const previousStock = product.quantity;
            let newStock = previousStock; // Stok gönderilmezse mevcut değeri koru

            // SKU güncelleniyorsa formatını kontrol et
            if (req.body.sku !== undefined) {
                const sku = req.body.sku.trim();
                const skuFormat = /^\d{2}-[A-Z]{5}$/;
                if (!skuFormat.test(sku)) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: 'SKU formatı geçersiz. Format: XX-YYYYY (2 sayı - 5 büyük harf) şeklinde olmalıdır.'
                    });
                }
                updateData.sku = sku;
            }
            
            // Diğer alanları sadece gönderilmişse güncelleme listesine ekle
            if (req.body.name !== undefined) updateData.name = req.body.name.trim();
            if (req.body.description !== undefined) updateData.description = req.body.description;
            
            // Stok/Quantity kontrolü (ikisi de gelebilir, quantity öncelikli)
            if (req.body.quantity !== undefined) {
                newStock = parseInt(req.body.quantity, 10);
                if (isNaN(newStock)) {
                    await transaction.rollback();
                    return res.status(400).json({ success: false, message: 'Geçersiz miktar değeri' });
                }
                updateData.quantity = newStock;
            } else if (req.body.stock !== undefined) {
                newStock = parseInt(req.body.stock, 10);
                 if (isNaN(newStock)) {
                    await transaction.rollback();
                    return res.status(400).json({ success: false, message: 'Geçersiz stok değeri' });
                }
                updateData.quantity = newStock;
            }
            
            if (req.body.price !== undefined) updateData.price = parseFloat(req.body.price);
            if (req.body.minStockLevel !== undefined) updateData.minStockLevel = parseInt(req.body.minStockLevel, 10);
            else if (req.body.minStock !== undefined) updateData.minStockLevel = parseInt(req.body.minStock, 10); // Eski 'minStock' ile uyumluluk

            if (req.body.categoryId !== undefined) updateData.categoryId = parseInt(req.body.categoryId, 10);
            else if (req.body.category !== undefined) updateData.categoryId = parseInt(req.body.category, 10); // Eski 'category' ile uyumluluk

            if (req.body.locationId !== undefined) updateData.locationId = req.body.locationId; // null değeri de kabul eder
            if (req.body.company !== undefined) updateData.company = req.body.company;
            if (req.body.weight !== undefined) updateData.weight = parseFloat(req.body.weight);
            if (req.body.width !== undefined) updateData.width = parseFloat(req.body.width);
            if (req.body.height !== undefined) updateData.height = parseFloat(req.body.height);
            if (req.body.length !== undefined) updateData.length = parseFloat(req.body.length);
            if (req.body.dailyStorageRate !== undefined) updateData.dailyStorageRate = parseFloat(req.body.dailyStorageRate);
            if (req.body.sizeCategory !== undefined) updateData.sizeCategory = req.body.sizeCategory;

            // Eksik olan palletType kontrolünü ekleyelim
            if (req.body.palletType !== undefined) {
                // Gelen değerin 'half' veya 'full' olduğundan emin olalım (opsiyonel)
                const palletType = req.body.palletType.trim().toLowerCase();
                if (palletType === 'half' || palletType === 'full') {
                    updateData.palletType = palletType;
                } else {
                    // Geçersiz palet tipi gelirse hata verebilir veya loglayabiliriz
                    logger.warn(`Invalid palletType received for product update (ID: ${id}): ${req.body.palletType}`);
                    // Hata vermek istiyorsak:
                    // await transaction.rollback();
                    // return res.status(400).json({ success: false, message: 'Geçersiz palet tipi' });
                }
            }

            if (req.body.weightCategory !== undefined) updateData.weightCategory = req.body.weightCategory;
            if (req.body.storageStartDate !== undefined) updateData.storageStartDate = req.body.storageStartDate;
            if (req.body.expectedStorageDuration !== undefined) updateData.expectedStorageDuration = parseInt(req.body.expectedStorageDuration);

            // Güncellenecek veri varsa işlemi yap
            if (Object.keys(updateData).length === 0) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: "Güncellenecek veri bulunamadı" });
            }
            
            // Stok Değişikliği Kontrolü ve Hareketi
            let quantityChange = 0;
            if (updateData.quantity !== undefined) {
                quantityChange = updateData.quantity - previousStock;
            }

            console.log('Update Data Object:', updateData);
            // Ürünü güncelle
            await product.update(updateData, { transaction });

            // Stok hareketi kaydı (eğer stok değiştiyse)
            if (quantityChange !== 0) {
                await StockMovement.create({
                    type: quantityChange > 0 ? 'IN' : 'OUT',
                    quantity: Math.abs(quantityChange),
                    description: 'Ürün güncelleme ile stok değişimi',
                    productId: product.id,
                    locationId: product.locationId, // Ürünün güncel lokasyonu
                    previousStock: previousStock,
                    newStock: updateData.quantity,
                    createdBy: req.user.id
                }, { transaction });
            }

            // Transaction'ı commit et
            await transaction.commit();

            // Başarı mesajı döndür, güncellenmiş veriyi tekrar çekme
            res.json({
                success: true,
                message: 'Ürün başarıyla güncellendi'
            });

        } catch (error) {
            // Hata durumunda rollback yapmayı dene (eğer commit edilmediyse)
            if (transaction && !transaction.finished) { // Kontrol ekleyelim
              try {
            await transaction.rollback();
              } catch (rollbackError) {
                  console.error('Rollback error:', rollbackError);
              }
            }
            console.error('Update product error:', error);
            res.status(500).json({
                success: false,
                message: 'Ürün güncellenirken bir hata oluştu',
                error: error.message
            });
        }
    },

    deleteProduct: async (req, res) => {
        const transaction = await sequelize.transaction();
        const { description } = req.body; // Açıklamayı request body'den al
        
        try {
            const { id } = req.params;

            // Önce ürünü bulalım (paranoid: false ile silinmişleri de bulabiliriz ama gerek yok)
            const product = await Product.findByPk(id, {
                attributes: PRODUCT_ATTRIBUTES,
                transaction // Transaction'a dahil edelim
            });

            if (!product) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Ürün bulunamadı'
                });
            }

            // Eğer ürünün ilişkili bir lokasyonu varsa, lokasyonu boşaltalım
            if (product.locationId) {
                await Location.update(
                    { isOccupied: false, productId: null },
                    { 
                        where: { id: product.locationId },
                        transaction
                    }
                );
            }

            // Ürünü silelim (artık soft delete)
            await product.destroy({ transaction });

            // Ürün silindiği için bir stok çıkış hareketi oluşturalım
            if (product.quantity > 0) {
                await StockMovement.create({
                    type: 'OUT',
                    quantity: product.quantity,
                    // Açıklama: Gelen açıklamayı kullan veya varsayılan bir metin kullan
                    description: description || `"${product.name}" isimli ürün silindi (ID: ${product.id})`,
                    previousStock: product.quantity,
                    newStock: 0,
                    locationId: product.locationId, // Eski lokasyonu kaydedebiliriz
                    productId: product.id, // Silinen ürüne referans veriyoruz
                    createdBy: req.user.id
                }, { transaction });
            }
            
            // Transaction'ı commit edelim
            await transaction.commit();

            res.json({
                success: true,
                message: 'Ürün başarıyla silindi (geçici olarak) ve stok hareketi kaydedildi'
            });

        } catch (error) {
            // Transaction henüz commit edilmediyse geri alalım
            if (transaction && !transaction.finished && !transaction.finished === 'commit') {
                await transaction.rollback();
            }
            console.error('Delete product error:', error);
            res.status(500).json({
                success: false,
                message: 'Ürün silinirken bir hata oluştu'
            });
        }
    },

    // Ürün arama ve filtreleme
    searchProducts: async (req, res) => {
        try {
            const {
                search,         // SKU veya isim için arama
                minStock,       // Minimum stok miktarı
                maxStock,       // Maximum stok miktarı
                location,       // Lokasyon
                sortBy,         // Sıralama kriteri
                sortOrder      // Sıralama yönü (ASC/DESC)
            } = req.query;

            // Filtreleme koşulları
            const whereConditions = {};

            // SKU veya isim araması
            if (search) {
                whereConditions[Op.or] = [
                    { sku: { [Op.iLike]: `%${search}%` } },
                    { name: { [Op.iLike]: `%${search}%` } }
                ];
            }

            // Stok miktarı filtresi
            if (minStock || maxStock) {
                whereConditions.quantity = {};
                if (minStock) {
                    whereConditions.quantity[Op.gte] = parseInt(minStock, 10);
                }
                if (maxStock) {
                    whereConditions.quantity[Op.lte] = parseInt(maxStock, 10);
                }
            }

            // Lokasyon filtresi
            if (location) {
                whereConditions.location = { [Op.iLike]: `%${location}%` };
            }

            // Sıralama seçenekleri
            const order = [];
            if (sortBy) {
                order.push([sortBy, (sortOrder || 'ASC').toUpperCase()]);
            }

            // Ürünleri getir
            const products = await Product.findAll({
                where: whereConditions,
                order: order.length ? order : [['createdAt', 'DESC']]
            });

            res.json({
                success: true,
                count: products.length,
                data: products
            });
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Düşük stok raporu
    getLowStockReport: async (req, res) => {
        try {
            const { threshold = 10 } = req.query; // Varsayılan kritik stok seviyesi: 10

            const lowStockProducts = await Product.findAll({
                where: {
                    quantity: {
                        [Op.lt]: parseInt(threshold, 10)
                    }
                },
                attributes: [
                    'id',
                    'name',
                    'sku',
                    'quantity',
                    'price',
                    'location',
                    'createdAt',
                    'updatedAt',
                    [
                        Sequelize.literal('CASE WHEN quantity = 0 THEN \'Stokta Yok\' WHEN quantity < 5 THEN \'Kritik\' ELSE \'Az\' END'),
                        'stockStatus'
                    ]
                ],
                order: [
                    ['quantity', 'ASC'],
                    ['name', 'ASC']
                ]
            });

            // Özet istatistikler
            const summary = {
                totalLowStock: lowStockProducts.length,
                outOfStock: lowStockProducts.filter(p => p.quantity === 0).length,
                critical: lowStockProducts.filter(p => p.quantity > 0 && p.quantity < 5).length,
                low: lowStockProducts.filter(p => p.quantity >= 5).length
            };

            res.json({
                success: true,
                summary,
                data: lowStockProducts
            });
        } catch (error) {
            console.error('Low stock report error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getStockValueReport: async (req, res) => {
        try {
            // Tüm ürünleri ve değerlerini getir
            const products = await Product.findAll({
                attributes: [
                    'id',
                    'name',
                    'sku',
                    'quantity',
                    'price',
                    'location',
                    [Sequelize.literal('price * quantity'), 'totalValue']
                ],
                order: [
                    [Sequelize.literal('price * quantity'), 'DESC']
                ]
            });

            // Özet istatistikler
            const summary = {
                totalProducts: products.length,
                totalItems: products.reduce((sum, p) => sum + p.quantity, 0),
                totalValue: products.reduce((sum, p) => sum + (p.price * p.quantity), 0),
                averageValue: products.reduce((sum, p) => sum + (p.price * p.quantity), 0) / products.length,
                highestValue: Math.max(...products.map(p => p.price * p.quantity)),
                lowestValue: Math.min(...products.map(p => p.price * p.quantity))
            };

            // Lokasyon bazında değerler
            const locationValues = {};
            products.forEach(product => {
                const location = product.location || 'Belirtilmemiş';
                if (!locationValues[location]) {
                    locationValues[location] = {
                        totalValue: 0,
                        itemCount: 0,
                        products: []
                    };
                }
                locationValues[location].totalValue += product.price * product.quantity;
                locationValues[location].itemCount += product.quantity;
                locationValues[location].products.push({
                    id: product.id,
                    name: product.name,
                    value: product.price * product.quantity
                });
            });

            // En değerli 5 ürün
            const topProducts = products
                .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
                .slice(0, 5);

            res.json({
                success: true,
                summary,
                locationAnalysis: locationValues,
                topValueProducts: topProducts,
                allProducts: products
            });
        } catch (error) {
            console.error('Stock value report error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    bulkUpdateProducts: async (req, res) => {
        const { products } = req.body;
        // Toplu güncelleme işlemi
    },

    // Toplu silme işlemi
    bulkDelete: async (req, res) => {
        const transaction = await sequelize.transaction();
        
        try {
            const { ids } = req.body;
            
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Silinecek ürün ID\'leri geçerli değil'
                });
            }

            // Önce ürünleri bulalım ve bilgilerini saklayalım
            const products = await Product.findAll({
                where: {
                    id: {
                        [Op.in]: ids
                    }
                }
            });

            // Silinecek ürünlerin bilgilerini saklayalım
            const productsData = products.map(product => ({
                id: product.id,
                name: product.name,
                quantity: product.quantity,
                locationId: product.locationId
            }));
            
            // Tüm bu ürünlere ait stok hareketlerini silelim
            await StockMovement.destroy({
                where: {
                    productId: {
                        [Op.in]: ids
                    }
                },
                transaction
            });

            // Ürünlere ait lokasyonları boşaltalım
            for (const product of products) {
                if (product.locationId) {
                    await Location.update(
                        { isOccupied: false, productId: null },
                        { 
                            where: { id: product.locationId },
                            transaction
                        }
                    );
                }
            }

            // Sonra ürünleri silelim
            const deletedCount = await Product.destroy({
                where: {
                    id: {
                        [Op.in]: ids
                    }
                },
                transaction
            });

            await transaction.commit();

            // Şimdi silinen ürünler için stok çıkış hareketleri oluşturalım
            try {
                for (const productData of productsData) {
                    if (productData.quantity > 0) {
                        await StockMovement.create({
                            type: 'OUT',
                            quantity: productData.quantity,
                            description: `"${productData.name}" isimli ürün toplu silme işleminde silindi`,
                            previousStock: productData.quantity,
                            newStock: 0,
                            locationId: productData.locationId,
                            createdBy: req.user.id
                            // productId belirtmiyoruz
                        });
                        
                        console.log('Toplu silme - Stok çıkış hareketi oluşturuldu:', {
                            type: 'OUT',
                            quantity: productData.quantity,
                            description: `"${productData.name}" isimli ürün toplu silme işleminde silindi`,
                            previousStock: productData.quantity,
                            newStock: 0,
                            locationId: productData.locationId
                        });
                    }
                }
            } catch (stockMovementError) {
                console.error('Stok hareketleri oluşturma hatası:', stockMovementError);
                // Bu hata ürün silme işlemini etkilemesin, sadece loglayalım
            }

            res.json({
                success: true,
                message: `${deletedCount} ürün başarıyla silindi`,
                data: { deletedCount }
            });

        } catch (error) {
            // Transaction henüz commit edilmediyse geri alalım
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }
            console.error('Bulk delete error:', error);
            res.status(500).json({
                success: false,
                message: 'Ürünler silinirken bir hata oluştu'
            });
        }
    },

    // Stok girişi kontrolü
    checkStockInCapacity: async (product, location, quantity) => {
        const newVolume = product.volumePerUnit * quantity;
        const availableSpace = location.availableCapacity;
        
        if (newVolume > availableSpace) {
            throw new Error(`Yetersiz raf kapasitesi. Gereken: ${newVolume}m³, Mevcut: ${availableSpace}m³`);
        }
        
        // Maksimum stok seviyesini güncelle
        product.maxStockLevel = Math.floor(location.totalCapacity / product.volumePerUnit);
    },

    // Stok hareketi öncesi kontrol
    handleStockMovement: async (req, res) => {
        try {
            const { productId, locationId, quantity, type } = req.body;
            const product = await Product.findByPk(productId);
            const location = await Location.findByPk(locationId);
            
            if (type === 'IN') {
                await this.checkStockInCapacity(product, location, quantity);
            }
            
            // Stok hareketi işlemleri...
        } catch (error) {
            // Hata yönetimi...
        }
    },

    fetchProducts: async (req, res) => {
        try {
            const response = await productService.getAllProducts();
            
            if (response.success && Array.isArray(response.data)) {
                const formattedProducts = response.data.map(product => ({
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                    quantity: product.quantity,
                    Category: product.Category,
                    stock: product.quantity,
                    minStock: product.minStockLevel,
                    price: product.price || 0,
                    description: product.description || '',
                    locationId: product.locationId,
                    location: product.Location?.code || 'Belirtilmemiş',
                    storageStartDate: product.storageStartDate,
                    expectedStorageDuration: product.expectedStorageDuration,
                    company: product.company || '',
                    weight: product.weight || 0,
                    sizeCategory: product.sizeCategory
                }));

                res.json({
                    success: true,
                    data: formattedProducts
                });
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({
                success: false,
                message: 'Ürünler yüklenirken bir hata oluştu!'
            });
        }
    },

    // Tüm ürünleri getir
    getAllProducts: async (req, res) => {
        try {
            const products = await Product.findAll({
                attributes: PRODUCT_ATTRIBUTES,
                include: [
                    {
                        model: Category,
                        as: 'Category'
                    },
                    {
                        model: Location,
                        as: 'Location'
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
            res.json({ success: true, data: products });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Ürünleri Excel olarak dışa aktarma
    exportToExcel: async (req, res) => {
        try {
            const Excel = require('exceljs');
            
            // Tüm ürünleri kategorileri ve lokasyonları ile birlikte al
            const products = await Product.findAll({
                include: [{
                    model: Category,
                    as: 'Category',
                    attributes: ['name']
                }, {
                    model: Location,
                    as: 'Location',
                    attributes: ['code', 'rackNumber', 'level', 'position']
                }],
                order: [['createdAt', 'DESC']]
            });
            
            // Excel dosyası oluştur
            const workbook = new Excel.Workbook();
            const worksheet = workbook.addWorksheet('Ürünler');
            
            // Sütun başlıklarını ekle
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Ürün Adı', key: 'name', width: 30 },
                { header: 'SKU', key: 'sku', width: 15 },
                { header: 'Kategori', key: 'category', width: 20 },
                { header: 'Lokasyon', key: 'location', width: 30 },
                { header: 'Miktar', key: 'quantity', width: 10 },
                { header: 'Fiyat (₺)', key: 'price', width: 15 },
                { header: 'Min. Stok', key: 'minStockLevel', width: 10 },
                { header: 'Genişlik (cm)', key: 'width', width: 15 },
                { header: 'Uzunluk (cm)', key: 'length', width: 15 },
                { header: 'Yükseklik (cm)', key: 'height', width: 15 },
                { header: 'Ağırlık (kg)', key: 'weight', width: 15 },
                { header: 'Açıklama', key: 'description', width: 40 },
                { header: 'Şirket', key: 'company', width: 30 },
                { header: 'Eklenme Tarihi', key: 'createdAt', width: 20 }
            ];
            
            // Başlıkları kalın yap ve arka plan rengini ayarla
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            // Ürün verilerini ekle
            products.forEach(product => {
                // Lokasyon bilgisini formatla
                const locationInfo = product.Location 
                    ? `Raf ${product.Location.rackNumber}, Kat ${product.Location.level}, Poz. ${product.Location.position}`
                    : 'Atanmamış';

                worksheet.addRow({
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                    category: product.Category ? product.Category.name : '',
                    location: locationInfo,
                    quantity: product.quantity,
                    price: product.price,
                    minStockLevel: product.minStockLevel,
                    width: product.width,
                    length: product.length,
                    height: product.height,
                    weight: product.weight,
                    description: product.description,
                    company: product.company,
                    createdAt: product.createdAt.toLocaleDateString('tr-TR')
                });
            });
            
            // Tüm hücrelere border ekle
            worksheet.eachRow((row) => {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            });

            // Sayısal değerleri sağa yasla
            ['quantity', 'price', 'minStockLevel', 'width', 'length', 'height', 'weight'].forEach(key => {
                worksheet.getColumn(key).alignment = { horizontal: 'right' };
                worksheet.getColumn(key).numFmt = '0.00';
            });
            
            // Excel dosyasını response olarak gönder
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=urunler.xlsx');
            
            // Buffer olarak gönder
            const buffer = await workbook.xlsx.writeBuffer();
            res.send(buffer);
            
        } catch (error) {
            console.error('Excel export error:', error);
            res.status(500).json({
                success: false,
                message: 'Excel dosyası oluşturulurken bir hata oluştu'
            });
        }
    }
};

module.exports = productController;