const { Product, StockMovement, Location, Category, User } = require('../models');
const { Op, Sequelize } = require('sequelize');
const logger = require('../config/logger');

const dashboardController = {
    getDashboardStats: async (req, res) => {
        try {
            const [
                totalProducts,
                lowStockProducts,
                recentProducts,
                recentMovements,
                activeLocations,
                categoryDistribution
            ] = await Promise.all([
                // Toplam ürün sayısı
                Product.count(),
                
                // Düşük stoklu ürünler
                Product.count({
                    where: {
                        quantity: {
                            [Op.lte]: Sequelize.col('minStockLevel')
                        }
                    }
                }),
                
                // Son eklenen ürünler
                Product.findAll({
                    attributes: ['id', 'name', 'sku', 'quantity', 'price'],
                    limit: 5,
                    order: [['createdAt', 'DESC']],
                    include: [{
                        model: Category,
                        attributes: ['name']
                    }]
                }),
                
                // Son hareketler
                StockMovement.findAll({
                    attributes: ['id', 'type', 'quantity', 'createdAt'],
                    limit: 10,
                    order: [['createdAt', 'DESC']],
                    include: [{
                        model: Product,
                        attributes: ['name', 'sku']
                    }]
                }),
                
                // Aktif lokasyonlar (geçici olarak tüm lokasyonları sayalım)
                Location.count(),
                
                // Kategori dağılımı
                Product.findAll({
                    attributes: [
                        [Sequelize.fn('COUNT', Sequelize.col('Product.id')), 'count']
                    ],
                    include: [{
                        model: Category,
                        attributes: ['name']
                    }],
                    group: ['Category.id', 'Category.name']
                })
            ]);

            res.json({
                success: true,
                data: {
                    totalProducts,
                    lowStockProducts,
                    recentProducts,
                    recentMovements,
                    activeLocations,
                    categoryDistribution
                }
            });

        } catch (error) {
            logger.error('Dashboard stats error:', error);
            res.status(500).json({
                success: false,
                message: 'İstatistikler alınırken bir hata oluştu'
            });
        }
    },

    getStockTrends: async (req, res) => {
        try {
            // Son 30 günlük stok hareketleri
            const movements = await StockMovement.findAll({
                attributes: [
                    'type',
                    'createdAt',
                    [Sequelize.fn('SUM', Sequelize.col('quantity')), 'total']
                ],
                where: {
                    createdAt: {
                        [Op.gte]: Sequelize.literal("NOW() - INTERVAL '30 days'")
                    }
                },
                group: ['type', 'createdAt'],
                order: [['createdAt', 'ASC']]
            });

            // Kategori dağılımı - ilişki düzeltmesi
            const categories = await Product.findAll({
                attributes: [
                    [Sequelize.col('Category.name'), 'name'],
                    [Sequelize.fn('COUNT', Sequelize.col('Product.id')), 'count'],
                    [Sequelize.fn('SUM', Sequelize.col('Product.quantity')), 'totalQuantity']
                ],
                include: [{
                    model: Category,
                    as: 'Category',  // as ekledik
                    attributes: []
                }],
                group: ['Category.id', 'Category.name']  // Category.id ekledik
            });

            res.json({
                success: true,
                data: {
                    movements: movements.map(m => ({
                        type: m.type,
                        createdAt: m.createdAt,
                        total: parseInt(m.dataValues.total || 0)
                    })),
                    categories: categories.map(c => ({
                        name: c.dataValues.name,
                        count: parseInt(c.dataValues.count || 0),
                        totalQuantity: parseInt(c.dataValues.totalQuantity || 0)
                    }))
                }
            });
        } catch (error) {
            console.error('Get stock trends error:', error);
            res.status(500).json({
                success: false,
                message: 'Stok trendleri alınırken bir hata oluştu'
            });
        }
    },

    getRecentMovements: async (req, res) => {
        try {
            const movements = await StockMovement.findAll({
                limit: 10,
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: Product,
                        attributes: ['name', 'sku']
                    },
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['username']
                    }
                ]
            });

            res.json({
                success: true,
                data: movements
            });
        } catch (error) {
            console.error('Recent movements error:', error);
            res.status(500).json({
                success: false,
                message: 'Son hareketler alınırken bir hata oluştu'
            });
        }
    },

    getStats: async (req, res) => {
        try {
            const totalProducts = await Product.countDocuments()
            const totalUsers = await User.countDocuments()
            const lowStock = await Product.countDocuments({ stock: { $lt: 10 } })

            res.json({
                totalProducts,
                totalUsers,
                lowStock
            })
        } catch (error) {
            res.status(500).json({ message: 'Sunucu hatası' })
        }
    },

    getSummaryCards: async (req, res) => {
        try {
            // Toplam ürün sayısı
            const totalProducts = await Product.count();

            // Toplam stok değeri (raw query kullanarak)
            const [stockValueResult] = await Product.sequelize.query(
                'SELECT SUM(price * quantity) as total FROM "Products"'
            );
            const stockValue = stockValueResult[0]?.total || 0;

            // Düşük stoklu ürünler (raw query kullanarak)
            const [lowStockResult] = await Product.sequelize.query(
                'SELECT COUNT(*) as count FROM "Products" WHERE quantity <= "minStockLevel"'
            );
            const lowStockProducts = lowStockResult[0]?.count || 0;

            // Son 7 günlük stok hareketleri
            const weeklyMovements = await StockMovement.count({
                where: {
                    createdAt: {
                        [Op.gte]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            });

            // Depolama alanı kullanımı hesaplaması
            const [storageResult] = await Location.sequelize.query(`
                SELECT 
                    COUNT(*) as total_locations,
                    COUNT(CASE WHEN "isOccupied" = true THEN 1 END) as occupied_locations
                FROM "Locations"
            `);
            
            const totalLocations = parseInt(storageResult[0]?.total_locations || 0);
            const occupiedLocations = parseInt(storageResult[0]?.occupied_locations || 0);
            const storageUsage = totalLocations > 0 ? (occupiedLocations / totalLocations) * 100 : 0;

            // Aktif kullanıcı sayısı
            const activeUsers = await User.count({
                where: { isActive: true }
            });

            res.json({
                success: true,
                data: {
                    totalProducts,
                    stockValue: parseFloat(stockValue).toFixed(2),
                    lowStockProducts: parseInt(lowStockProducts),
                    weeklyMovements,
                    storageUsage: parseFloat(storageUsage).toFixed(2),
                    activeUsers
                }
            });
        } catch (error) {
            console.error('Dashboard summary error:', error);
            res.status(500).json({
                success: false,
                message: 'Özet bilgiler alınırken bir hata oluştu'
            });
        }
    },

    getCriticalStock: async (req, res) => {
        try {
            // Kritik stok seviyesindeki ürünleri listeleme
            const criticalStock = await Product.findAll({
                where: {
                    quantity: {
                        [Op.lte]: Sequelize.col('minStockLevel')
                    }
                },
                include: [{
                    model: Category,
                    as: 'Category',
                    attributes: ['name']
                }],
                attributes: ['id', 'name', 'sku', 'quantity', 'minStockLevel'],
                limit: 5,
                order: [['quantity', 'ASC']]
            });

            res.json({
                success: true,
                data: criticalStock
            });
        } catch (error) {
            console.error('Critical stock error:', error);
            res.status(500).json({
                success: false,
                message: 'Kritik stok ürünleri alınırken bir hata oluştu'
            });
        }
    },

    getPopularProducts: async (req, res) => {
        try {
            // En çok hareket gören ürünler
            const popularProducts = await StockMovement.findAll({
                attributes: [
                    'productId',
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'movementCount'],
                    [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity']
                ],
                include: [{
                    model: Product,
                    attributes: ['name', 'sku'],
                    include: [{
                        model: Category,
                        as: 'Category',
                        attributes: ['name']
                    }]
                }],
                group: ['productId', 'Product.id', 'Product.name', 'Product.sku', 'Product.Category.name'],
                order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
                limit: 5
            });

            res.json({
                success: true,
                data: popularProducts
            });
        } catch (error) {
            console.error('Popular products error:', error);
            res.status(500).json({
                success: false,
                message: 'Popüler ürünler alınırken bir hata oluştu'
            });
        }
    }
};

module.exports = dashboardController;
