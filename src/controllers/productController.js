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
    'company', 'weight', 'sizeCategory',
    'width', 'height', 'length', 'dailyStorageRate',
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
            
            // SKU güncelleniyorsa formatını kontrol et
            if (req.body.sku) {
                const skuFormat = /^\d{2}-[A-Z]{5}$/;
                if (!skuFormat.test(req.body.sku.trim())) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: 'SKU formatı geçersiz. Format: XX-YYYYY (2 sayı - 5 büyük harf) şeklinde olmalıdır.'
                    });
                }
            }

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
                company: req.body.company || '',
                weight: req.body.weight || 0,
                sizeCategory: req.body.sizeCategory || ''
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