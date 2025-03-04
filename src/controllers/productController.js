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
    'width', 'height', 'length',
    'dailyStorageRate', 'storageStartDate', 'expectedStorageDuration',
    'company',
    'createdAt', 'updatedAt'
];

const productController = {
    getProducts: async (req, res) => {
        try {
            const products = await Product.findAll({
                attributes: [
                    ...PRODUCT_ATTRIBUTES,
                    'company',
                    [
                        sequelize.literal(`COALESCE(("Product"."width" * "Product"."height" * "Product"."length") / 1000000.0, 0)`),
                        'volumePerUnit'
                    ],
                    [
                        sequelize.literal(`COALESCE(("Product"."width" * "Product"."height" * "Product"."length" * "Product"."quantity") / 1000000.0, 0)`),
                        'totalVolume'
                    ],
                    [
                        sequelize.literal(`
                            CASE 
                                WHEN "Product"."storageStartDate" IS NOT NULL AND "Product"."dailyStorageRate" IS NOT NULL THEN
                                    CASE
                                        WHEN DATE_PART('day', NOW() - "Product"."storageStartDate") > 180 THEN 
                                            COALESCE("Product"."dailyStorageRate", 0) * DATE_PART('day', NOW() - "Product"."storageStartDate") * 0.85
                                        WHEN DATE_PART('day', NOW() - "Product"."storageStartDate") > 90 THEN 
                                            COALESCE("Product"."dailyStorageRate", 0) * DATE_PART('day', NOW() - "Product"."storageStartDate") * 0.90
                                        WHEN DATE_PART('day', NOW() - "Product"."storageStartDate") > 30 THEN 
                                            COALESCE("Product"."dailyStorageRate", 0) * DATE_PART('day', NOW() - "Product"."storageStartDate") * 0.95
                                        ELSE 
                                            COALESCE("Product"."dailyStorageRate", 0) * DATE_PART('day', NOW() - "Product"."storageStartDate")
                                    END
                                ELSE 0
                            END
                        `),
                        'totalStorageCost'
                    ]
                ],
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

            res.json({
                success: true,
                data: products.map(product => product.get({ plain: true }))
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
            const product = await Product.findByPk(req.params.id, {
                attributes: PRODUCT_ATTRIBUTES,
                include: [
                    { 
                        model: User, 
                        as: 'creator', 
                        attributes: ['username', 'email'] 
                    }
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
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    createProduct: async (req, res) => {
        try {
            const userId = req.user.id;
            
            // Kategori bazlı günlük fiyat çarpanları
            const categoryDailyRates = {
                'Elektronik': 150,    // Elektronik ürünler için günlük 150₺
                'Giyim': 80,         // Giyim için günlük 80₺
                'Ev & Yaşam': 100,   // Ev & Yaşam için günlük 100₺
                'Spor': 90,          // Spor malzemeleri için günlük 90₺
                'Kitap': 50,         // Kitaplar için günlük 50₺
                'Kozmetik': 120,     // Kozmetik için günlük 120₺
                'Oyuncak': 70,       // Oyuncaklar için günlük 70₺
                'Ofis': 60,          // Ofis malzemeleri için günlük 60₺
                'Gıda': 200,         // Gıda ürünleri için günlük 200₺
                'Bahçe': 110         // Bahçe ürünleri için günlük 110₺
            };

            // Kategoriyi bul
            const category = await Category.findByPk(req.body.categoryId);
            const dailyRate = categoryDailyRates[category?.name] || 100; // Varsayılan günlük ücret 100₺

            // Beklenen depolama süresi (gün)
            const expectedDuration = parseInt(req.body.expectedStorageDuration) || 30; // Minimum 30 gün

            // Süreye göre indirim oranları
            let discountRate = 1.0;
            if (expectedDuration > 180) discountRate = 0.7;      // 6+ ay: %30 indirim
            else if (expectedDuration > 90) discountRate = 0.8;  // 3+ ay: %20 indirim
            else if (expectedDuration > 30) discountRate = 0.9;  // 1+ ay: %10 indirim

            // Final fiyat hesaplama
            const calculatedPrice = Math.max(dailyRate * expectedDuration * discountRate, 100);

            // Depolama ücreti hesaplama (hacme göre)
            const width = parseFloat(req.body.width) || 0;
            const height = parseFloat(req.body.height) || 0;
            const length = parseFloat(req.body.length) || 0;
            const volumeInCubicMeters = (width * height * length) / 1000000;
            const baseRate = 50;
            const dailyStorageRate = Math.max(baseRate * volumeInCubicMeters, 50);

            const productData = {
                name: req.body.name.trim(),
                description: req.body.description || '',
                sku: req.body.sku.trim(),
                quantity: parseInt(req.body.quantity) || 0,
                price: calculatedPrice, // Hesaplanan fiyat
                minStockLevel: parseInt(req.body.minStockLevel) || 0,
                maxStockLevel: parseInt(req.body.maxStockLevel) || 0,
                width: width,
                height: height,
                length: length,
                dailyStorageRate: dailyStorageRate,
                storageStartDate: req.body.storageStartDate || null,
                expectedStorageDuration: expectedDuration,
                categoryId: parseInt(req.body.categoryId),
                locationId: req.body.locationId || null,
                createdBy: userId,
                company: req.body.company || ''
            };

            const product = await Product.create(productData);

            // Lokasyonu güncelle
            if (productData.locationId) {
                await Location.update(
                    { isOccupied: true },
                    { where: { id: productData.locationId } }
                );
            }

            res.status(201).json({
                success: true,
                message: 'Ürün başarıyla oluşturuldu',
                data: product
            });
        } catch (error) {
            console.error('Create product error:', error);
            res.status(400).json({
                success: false,
                message: 'Ürün oluşturulurken bir hata oluştu',
                error: error.message
            });
        }
    },

    updateProduct: async (req, res) => {
        const transaction = await sequelize.transaction();
        
        try {
            const { id } = req.params;
            
            // Önce ürünü bulalım
            const product = await Product.findByPk(id);

            if (!product) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Ürün bulunamadı'
                });
            }

            // Güncellenecek verileri hazırla
            const updateData = {
                name: req.body.name.trim(),
                sku: req.body.sku.trim(),
                description: req.body.description || '',
                quantity: parseInt(req.body.stock) || 0,
                price: parseFloat(req.body.price) || 0,
                minStockLevel: parseInt(req.body.minStock) || 0,
                categoryId: parseInt(req.body.categoryId || req.body.category),
                locationId: req.body.locationId || null,
                company: req.body.company || ''
            };

            // Direkt SQL UPDATE sorgusu kullan
            await Product.update(updateData, {
                where: { id: id },
                transaction
            });

            await transaction.commit();

            // Güncellenmiş ürünü getir
            const updatedProduct = await Product.findByPk(id, {
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
                ]
            });

            res.json({
                success: true,
                message: 'Ürün başarıyla güncellendi',
                data: updatedProduct
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Update product error:', error);
            res.status(500).json({
                success: false,
                message: 'Ürün güncellenirken bir hata oluştu'
            });
        }
    },

    deleteProduct: async (req, res) => {
        const transaction = await sequelize.transaction();
        
        try {
            const { id } = req.params;

            // Önce ürünün stok hareketlerini silelim
            await StockMovement.destroy({
                where: { productId: id },
                transaction
            });

            // Sonra ürünü silelim
            const product = await Product.findByPk(id, {
                attributes: PRODUCT_ATTRIBUTES // Sadece var olan kolonları seç
            });

            if (!product) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Ürün bulunamadı'
                });
            }

            await product.destroy({ transaction });
            await transaction.commit();

            res.json({
                success: true,
                message: 'Ürün başarıyla silindi'
            });
        } catch (error) {
            await transaction.rollback();
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
                return res.status(400).json({
                    success: false,
                    message: 'Silinecek ürün ID\'leri geçerli değil'
                });
            }

            // Önce bu ürünlere ait tüm stok hareketlerini silelim
            await StockMovement.destroy({
                where: {
                    productId: {
                        [Op.in]: ids
                    }
                },
                transaction
            });

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

            res.json({
                success: true,
                message: `${deletedCount} ürün başarıyla silindi`,
                data: { deletedCount }
            });

        } catch (error) {
            await transaction.rollback();
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
                    Category: product.Category,  // Tüm kategori bilgisini gönder
                    stock: product.quantity,
                    minStock: product.minStockLevel,
                    price: product.price || 0,
                    description: product.description || '',
                    locationId: product.locationId,
                    location: product.Location?.code || 'Belirtilmemiş',
                    width: product.width,
                    height: product.height,
                    length: product.length,
                    dailyStorageRate: product.dailyStorageRate || 0,
                    storageStartDate: product.storageStartDate,
                    expectedStorageDuration: product.expectedStorageDuration,
                    totalStorageCost: product.totalStorageCost || 0,
                    totalVolume: product.totalVolume || 0
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
                include: [
                    {
                        model: Category,
                        as: 'Category'
                    },
                    {
                        model: Location,
                        as: 'Location'
                    }
                ]
            });
            res.json({ success: true, data: products });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = productController;