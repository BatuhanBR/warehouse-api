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
            const { timeRange = 'monthly' } = req.query;
            const now = new Date();
            let startDate;

            // Zaman aralığına göre başlangıç tarihini belirle
            switch (timeRange) {
                case 'daily':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
                    break;
                case 'weekly':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'monthly':
                default:
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
            }

            // Günün sonuna kadar olan verileri almak için bitiş tarihini ayarla
            const endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);

            const movements = await StockMovement.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                limit: 10,
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: Product,
                        as: 'Product',
                        attributes: ['name', 'sku'],
                        include: [{
                            model: Category,
                            as: 'Category',
                            attributes: ['name']
                        }]
                    },
                    {
                        model: Location,
                        as: 'Location',
                        attributes: ['code']
                    },
                    {
                        model: User,
                        as: 'Creator',
                        attributes: ['username']
                    }
                ]
            });

            const formattedMovements = movements.map(movement => ({
                id: movement.id,
                type: movement.type,
                quantity: movement.quantity,
                product: {
                    name: movement.Product?.name || 'Bilinmeyen Ürün',
                    sku: movement.Product?.sku || 'N/A',
                    category: movement.Product?.Category?.name || 'Kategorisiz'
                },
                location: movement.Location?.code || 'Belirsiz',
                creator: movement.Creator?.username || 'Bilinmeyen',
                createdAt: movement.createdAt
            }));

            res.json({
                success: true,
                data: formattedMovements
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
    },

    getProductStats: async (req, res) => {
        try {
            // Min, max ve toplam değerleri al
            const [statsResult] = await Product.sequelize.query(`
                SELECT 
                    MIN(price) as min_price,
                    MAX(price) as max_price,
                    MIN(quantity) as min_quantity,
                    MAX(quantity) as max_quantity,
                    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as median_price,
                    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY quantity) as median_quantity
                FROM "Products"
            `);

            const stats = statsResult[0];

            res.json({
                success: true,
                data: {
                    price: {
                        min: parseFloat(stats.min_price || 0).toFixed(2),
                        max: parseFloat(stats.max_price || 0).toFixed(2),
                        median: parseFloat(stats.median_price || 0).toFixed(2)
                    },
                    quantity: {
                        min: parseInt(stats.min_quantity || 0),
                        max: parseInt(stats.max_quantity || 0),
                        median: parseInt(stats.median_quantity || 0)
                    }
                }
            });
        } catch (error) {
            console.error('Product stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Ürün istatistikleri alınırken bir hata oluştu'
            });
        }
    },

    getCategoryDistribution: async (req, res) => {
        try {
            const { timeRange = 'monthly' } = req.query;
            const now = new Date();
            let startDate;

            // Zaman aralığına göre başlangıç tarihini belirle
            switch (timeRange) {
                case 'daily':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
                    break;
                case 'weekly':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'monthly':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                case 'all':
                    startDate = new Date(1970, 0, 1); // Çok eski bir tarih, tüm verileri kapsar
                    break;
                default:
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
            }

            // Günün sonuna kadar olan verileri almak için bitiş tarihini ayarla
            const endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);

            const whereCondition = timeRange === 'all' 
                ? {} 
                : {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                };

            const distribution = await Product.findAll({
                attributes: [
                    [Sequelize.fn('COUNT', Sequelize.col('Product.id')), 'count'],
                    [Sequelize.fn('SUM', Sequelize.literal('price * quantity')), 'totalValue']
                ],
                where: whereCondition,
                include: [{
                    model: Category,
                    as: 'Category',
                    attributes: ['name']
                }],
                group: ['Category.id', 'Category.name'],
                raw: true
            });

            const formattedData = distribution.map(item => ({
                name: item['Category.name'],
                value: parseInt(item.count),
                totalValue: parseFloat(item.totalValue) || 0
            }));

            res.json({
                success: true,
                data: formattedData
            });
        } catch (error) {
            console.error('Category distribution error:', error);
            res.status(500).json({
                success: false,
                message: 'Kategori dağılımı alınırken bir hata oluştu'
            });
        }
    },

    getMonthlyProductMovements: async (req, res) => {
        try {
            const { timeRange = 'monthly' } = req.query;
            const now = new Date();
            let startDate;
            let dateFormat;
            let dateGrouping;

            // Zaman aralığına göre başlangıç tarihini ve format ayarlarını belirle
            switch (timeRange) {
                case 'daily':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
                    dateFormat = { day: 'numeric', month: 'short' };
                    dateGrouping = 'day';
                    break;
                case 'weekly':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    dateFormat = { day: 'numeric', month: 'short' };
                    dateGrouping = 'day';
                    break;
                case 'monthly':
                default:
                    startDate = new Date(now.getFullYear(), 0, 1);
                    dateFormat = { month: 'long' };
                    dateGrouping = 'month';
                    break;
            }

            // Günün sonuna kadar olan verileri almak için bitiş tarihini ayarla
            const endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);

            // Aylık giriş ve çıkışları al
            const movements = await StockMovement.findAll({
                attributes: [
                    [Sequelize.fn('date_trunc', dateGrouping, Sequelize.col('createdAt')), 'date'],
                    [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN type = 'IN' THEN quantity ELSE 0 END")), 'incoming'],
                    [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN type = 'OUT' THEN quantity ELSE 0 END")), 'outgoing']
                ],
                where: {
                    createdAt: {
                        [Op.gte]: startDate,
                        [Op.lte]: endDate
                    }
                },
                group: [Sequelize.fn('date_trunc', dateGrouping, Sequelize.col('createdAt'))],
                order: [[Sequelize.fn('date_trunc', dateGrouping, Sequelize.col('createdAt')), 'ASC']],
                raw: true
            });

            // Tarih aralığındaki tüm günleri/ayları oluştur
            let allDates = [];
            let currentDate = new Date(startDate);
            
            while (currentDate <= endDate) {
                allDates.push(new Date(currentDate));
                if (dateGrouping === 'day') {
                    currentDate.setDate(currentDate.getDate() + 1);
                } else {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                }
            }

            // Tüm tarihler için veri hazırla
            const formattedData = allDates.map(date => {
                const matchingData = movements.find(m => {
                    const movementDate = new Date(m.date);
                    return dateGrouping === 'day' 
                        ? movementDate.toDateString() === date.toDateString()
                        : movementDate.getMonth() === date.getMonth() && 
                          movementDate.getFullYear() === date.getFullYear();
                });

                return {
                    date: date.toLocaleDateString('tr-TR', dateFormat),
                    incoming: parseInt(matchingData?.incoming || 0),
                    outgoing: parseInt(matchingData?.outgoing || 0),
                    total: parseInt(matchingData?.incoming || 0) - parseInt(matchingData?.outgoing || 0)
                };
            });

            res.json({
                success: true,
                data: formattedData
            });
        } catch (error) {
            console.error('Monthly movements error:', error);
            res.status(500).json({
                success: false,
                message: 'Aylık hareket verileri alınırken bir hata oluştu'
            });
        }
    },

    getTotalStockStatus: async (req, res) => {
        try {
            const { timeRange = 'monthly' } = req.query;
            const now = new Date();
            let startDate;
            let dateFormat;
            let dateGrouping;

            // Zaman aralığına göre başlangıç tarihini ve format ayarlarını belirle
            switch (timeRange) {
                case 'daily':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
                    dateFormat = { day: 'numeric', month: 'short' };
                    dateGrouping = 'day';
                    break;
                case 'weekly':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    dateFormat = { day: 'numeric', month: 'short' };
                    dateGrouping = 'day';
                    break;
                case 'monthly':
                default:
                    startDate = new Date(now.getFullYear(), 0, 1);
                    dateFormat = { month: 'long' };
                    dateGrouping = 'month';
                    break;
            }

            // Günün sonuna kadar olan verileri almak için bitiş tarihini ayarla
            const endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);

            // Her gün için toplam ürün miktarı ve palet sayısını al
            const dailyStats = await Product.sequelize.query(`
                WITH dates AS (
                    SELECT date_trunc('${dateGrouping}', d)::date as stat_date
                    FROM generate_series(
                        :startDate::timestamp,
                        :endDate::timestamp,
                        '1 ${dateGrouping}'::interval
                    ) d
                )
                SELECT 
                    d.stat_date,
                    COALESCE(SUM(p.quantity), 0) as total_quantity,
                    COUNT(DISTINCT p.id) as pallet_count
                FROM dates d
                LEFT JOIN "Products" p ON date_trunc('${dateGrouping}', p."createdAt") <= d.stat_date
                GROUP BY d.stat_date
                ORDER BY d.stat_date ASC
            `, {
                replacements: { startDate, endDate },
                type: Sequelize.QueryTypes.SELECT
            });

            // Verileri formatla
            const formattedData = dailyStats.map(stat => ({
                date: new Date(stat.stat_date).toLocaleDateString('tr-TR', dateFormat),
                totalStock: parseInt(stat.total_quantity),
                palletCount: parseInt(stat.pallet_count)
            }));

            res.json({
                success: true,
                data: formattedData
            });
        } catch (error) {
            console.error('Total stock status error:', error);
            res.status(500).json({
                success: false,
                message: 'Toplam stok durumu alınırken bir hata oluştu'
            });
        }
    },

    getWarehouseOccupancy: async (req, res) => {
        try {
            const TOTAL_WAREHOUSE_AREA = 153.6; // Toplam depo alanı (m²)

            // Tüm ürünlerin kapladığı toplam alanı hesapla
            const products = await Product.findAll({
                attributes: [
                    'quantity',
                    'width',
                    'length'
                ],
                where: {
                    width: { [Op.gt]: 0 },
                    length: { [Op.gt]: 0 }
                },
                raw: true
            });

            // Her ürün için alan hesapla ve topla
            let totalOccupiedArea = 0;
            let totalQuantity = 0;

            for (const product of products) {
                const width = Math.abs(parseFloat(product.width || 0)) / 100; // cm to m
                const length = Math.abs(parseFloat(product.length || 0)) / 100; // cm to m
                const quantity = parseInt(product.quantity || 0);

                if (width && length) {
                    const areaPerUnit = width * length; // m² olarak alan
                    // Her ürün için sadece bir adet alan hesapla
                    totalOccupiedArea += areaPerUnit;
                    totalQuantity += quantity;
                }
            }

            // Değerleri kontrol et ve sınırla
            const validOccupiedArea = Math.min(totalOccupiedArea, TOTAL_WAREHOUSE_AREA);
            const availableArea = Math.max(0, TOTAL_WAREHOUSE_AREA - validOccupiedArea);
            const occupancyRate = Math.min(100, (validOccupiedArea / TOTAL_WAREHOUSE_AREA) * 100);

            res.json({
                success: true,
                data: {
                    totalArea: TOTAL_WAREHOUSE_AREA,
                    occupiedArea: parseFloat(validOccupiedArea.toFixed(2)),
                    availableArea: parseFloat(availableArea.toFixed(2)),
                    occupancyRate: parseFloat(occupancyRate.toFixed(2)),
                    totalProducts: products.length,
                    totalQuantity: totalQuantity
                }
            });
        } catch (error) {
            console.error('Warehouse occupancy error:', error);
            res.status(500).json({
                success: false,
                message: 'Depo doluluk oranı hesaplanırken bir hata oluştu'
            });
        }
    },

    getTopValuedProducts: async (req, res) => {
        try {
            const { timeRange = 'monthly' } = req.query;
            const now = new Date();
            let startDate;

            // Zaman aralığına göre başlangıç tarihini belirle
            switch (timeRange) {
                case 'daily':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
                    break;
                case 'weekly':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'monthly':
                default:
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
            }

            // Günün sonuna kadar olan verileri almak için bitiş tarihini ayarla
            const endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);

            // En değerli 5 ürünü al
            const topProducts = await Product.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    price: {
                        [Op.gt]: 0
                    }
                },
                attributes: [
                    'id', 'name', 'sku', 'quantity', 'price',
                    [Sequelize.literal('price * quantity'), 'totalValue']
                ],
                include: [
                    {
                        model: Category,
                        as: 'Category',
                        attributes: ['name']
                    },
                    {
                        model: Location,
                        as: 'Location',
                        attributes: ['code']
                    }
                ],
                order: [[Sequelize.literal('price * quantity'), 'DESC']],
                limit: 5
            });

            const formattedProducts = topProducts.map(product => {
                const plainProduct = product.get({ plain: true });
                return {
                    ...plainProduct,
                    totalValue: parseFloat(product.dataValues.totalValue) || 0,
                    categoryName: plainProduct.Category?.name || 'Kategorisiz',
                    locationCode: plainProduct.Location?.code || 'Belirsiz'
                };
            });

            res.json({
                success: true,
                data: formattedProducts
            });
        } catch (error) {
            console.error('Top valued products error:', error);
            res.status(500).json({
                success: false,
                message: 'En değerli ürünler alınırken bir hata oluştu'
            });
        }
    },

    getLowStockProducts: async (req, res) => {
        try {
            const lowStockProducts = await Product.findAll({
                where: {
                    quantity: {
                        [Op.lte]: Sequelize.col('minStockLevel')
                    }
                },
                attributes: [
                    'id',
                    'name',
                    'sku',
                    'quantity',
                    'minStockLevel',
                    'sizeCategory'
                ],
                include: [{
                    model: Category,
                    as: 'Category',
                    attributes: ['name']
                }, {
                    model: Location,
                    as: 'Location',
                    attributes: ['code', 'level', 'position']
                }]
            });

            res.json({
                success: true,
                data: lowStockProducts
            });
        } catch (error) {
            console.error('Low stock products error:', error);
            res.status(500).json({
                success: false,
                message: 'Düşük stoklu ürünler alınırken bir hata oluştu'
            });
        }
    },

    getDailyMovementDetails: async (req, res) => {
        try {
            const { date } = req.query;
            
            if (!date) {
                return res.status(400).json({
                    success: false,
                    message: 'Tarih parametresi gerekli'
                });
            }

            console.log('Received date:', date); // Debug log

            // Tarih formatını kontrol et ve düzelt
            const startDate = new Date(date);
            if (isNaN(startDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Geçersiz tarih formatı'
                });
            }

            // Tarihi UTC'ye çevir ve gün başlangıcına ayarla
            startDate.setUTCHours(0, 0, 0, 0);
            
            const endDate = new Date(startDate);
            endDate.setUTCHours(23, 59, 59, 999);

            console.log('Searching movements between:', startDate.toISOString(), 'and', endDate.toISOString()); // Debug log

            const movements = await StockMovement.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                include: [
                    {
                        model: Product,
                        as: 'Product',
                        attributes: ['name', 'sku'],
                        include: [{
                            model: Category,
                            as: 'Category',
                            attributes: ['name']
                        }]
                    },
                    {
                        model: Location,
                        as: 'Location',
                        attributes: ['code', 'level', 'position']
                    },
                    {
                        model: User,
                        as: 'Creator',
                        attributes: ['username']
                    }
                ],
                order: [['createdAt', 'ASC']]
            });

            console.log('Found movements:', movements.length, 'for date:', date); // Debug log

            // Hareketleri formatlayarak gönder
            const formattedMovements = movements.map(movement => ({
                id: movement.id,
                type: movement.type,
                quantity: movement.quantity,
                product: {
                    name: movement.Product?.name || 'Bilinmeyen Ürün',
                    sku: movement.Product?.sku || 'N/A',
                    category: movement.Product?.Category?.name || 'Kategorisiz'
                },
                location: movement.Location?.code || 'Belirsiz',
                creator: movement.Creator?.username || 'Bilinmeyen',
                createdAt: movement.createdAt
            }));

            res.json({
                success: true,
                data: formattedMovements,
                debug: {
                    requestedDate: date,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    movementCount: movements.length,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                }
            });
        } catch (error) {
            console.error('Daily movement details error:', error);
            res.status(500).json({
                success: false,
                message: 'Günlük hareket detayları alınırken bir hata oluştu',
                error: error.message
            });
        }
    },

    // Gider verilerini dashboard için getir
    getExpenseSummary: async (req, res) => {
        try {
            const { timeRange = 'monthly' } = req.query;
            const now = new Date();
            let startDate;
            let dateFormat;
            let dateGrouping;

            // Zaman aralığına göre başlangıç tarihini ve format ayarlarını belirle
            switch (timeRange) {
                case 'daily':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
                    dateFormat = { day: 'numeric', month: 'short' };
                    dateGrouping = 'day';
                    break;
                case 'weekly':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    dateFormat = { day: 'numeric', month: 'short' };
                    dateGrouping = 'day';
                    break;
                case 'monthly':
                default:
                    startDate = new Date(now.getFullYear(), 0, 1);
                    dateFormat = { month: 'long' };
                    dateGrouping = 'month';
                    break;
            }

            // Günün sonuna kadar olan verileri almak için bitiş tarihini ayarla
            const endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);

            // Expense modelini doğrudan require ile alalım
            const { Expense } = require('../models');
            
            // TÜM giderleri getir - zaman filtresini kaldırdık
            const expenses = await Expense.findAll({
                order: [['expenseStartTime', 'DESC']]
            });

            // Sadece zaman aralığındaki giderleri de alalım (grafikler için)
            const timeFilteredExpenses = await Expense.findAll({
                where: {
                    expenseStartTime: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [['expenseStartTime', 'DESC']]
            });

            // Tüm zamanların toplam giderini hesapla
            const allTimeExpense = expenses.reduce((sum, expense) => sum + Number(expense.expenseAmount), 0);
            
            // 2025 ve sonrası için giderleri filtrele
            const currentYearExpenses = expenses.filter(expense => {
                const startDate = new Date(expense.expenseStartTime);
                return startDate.getFullYear() >= 2025;
            });
            
            // 2025 ve sonrası için toplam gideri hesapla
            const totalExpense = currentYearExpenses.reduce((sum, expense) => sum + Number(expense.expenseAmount), 0);
            
            // Yeni hesaplama mantığı - Periyodik dağılıma göre (sadece 2025 ve sonrası için)
            // Yıllık gider: 2025 ve sonrası toplam gider
            const yearlyExpense = totalExpense;
            
            // Aylık gider: Yıllık giderin 1/12'si
            const monthlyExpense = totalExpense / 12;
            
            // Haftalık gider: Aylık giderin 1/4'ü (bir ayda yaklaşık 4 hafta)
            const weeklyExpense = monthlyExpense / 4;
            
            // Kategori bazında toplam giderleri hesapla (zaman aralığı filtreli verilere göre)
            const expensesByCategory = {};
            for (const expense of timeFilteredExpenses) {
                const category = expense.expenseType;
                if (!expensesByCategory[category]) {
                    expensesByCategory[category] = 0;
                }
                expensesByCategory[category] += parseFloat(expense.expenseAmount);
            }

            // Kategori dağılımı için veri formatla
            const categoryDistribution = Object.entries(expensesByCategory).map(([category, amount]) => ({
                name: category,
                value: parseFloat(amount.toFixed(2))
            }));

            console.log('Dashboard expense summaries with periodic distribution:');
            console.log(`- All Time Total: ${allTimeExpense}`);
            console.log(`- Current Year Total (2025+): ${totalExpense}`);
            console.log(`- Monthly (1/12): ${monthlyExpense}`);
            console.log(`- Weekly (1/48): ${weeklyExpense}`);

            // Zaman dilimine göre günlük/haftalık/aylık gider dağılımını hesapla
            const timeDistribution = await Expense.sequelize.query(`
                WITH dates AS (
                    SELECT date_trunc('${dateGrouping}', d)::date as expense_date
                    FROM generate_series(
                        :startDate::timestamp,
                        :endDate::timestamp,
                        '1 ${dateGrouping}'::interval
                    ) d
                )
                SELECT 
                    d.expense_date,
                    COALESCE(SUM(e."expenseAmount"), 0) as total_amount
                FROM dates d
                LEFT JOIN "Expenses" e ON date_trunc('${dateGrouping}', e."expenseStartTime") = d.expense_date
                GROUP BY d.expense_date
                ORDER BY d.expense_date ASC
            `, {
                replacements: { startDate, endDate },
                type: Expense.sequelize.QueryTypes.SELECT
            });

            // Tarih bazlı gider dağılımını formatla
            const formattedTimeDistribution = timeDistribution.map(item => ({
                date: new Date(item.expense_date).toLocaleDateString('tr-TR', dateFormat),
                amount: parseFloat(item.total_amount)
            }));

            res.json({
                success: true,
                data: {
                    expenses: expenses.map(expense => ({
                        id: expense.id,
                        amount: parseFloat(expense.expenseAmount),
                        type: expense.expenseType,
                        description: expense.expenseDescription,
                        startDate: expense.expenseStartTime,
                        endDate: expense.expenseEndTime
                    })),
                    allTimeExpense: parseFloat(allTimeExpense.toFixed(2)),
                    totalExpense: parseFloat(totalExpense.toFixed(2)),
                    yearlyExpense: parseFloat(yearlyExpense.toFixed(2)),
                    monthlyExpense: parseFloat(monthlyExpense.toFixed(2)),
                    weeklyExpense: parseFloat(weeklyExpense.toFixed(2)),
                    categoryDistribution,
                    timeDistribution: formattedTimeDistribution
                }
            });
        } catch (error) {
            console.error('Get expense summary error:', error);
            res.status(500).json({
                success: false,
                message: 'Gider özeti alınırken bir hata oluştu'
            });
        }
    },

    // Ürün fiyat analizi için veri getir
    getProductPriceAnalysis: async (req, res) => {
        try {
            // Ürün modelini getirelim
            const { Product, Category } = require('../models');
            
            // Önce boş bir sonuç hazırlayalım
            const result = {
                products: [],
                categoryAnalysis: [],
                priceDistribution: []
            };

            try {
                // Tüm ürünleri ve fiyatlarını getirelim
                const products = await Product.findAll({
                    attributes: [
                        'id', 'name', 'sku', 'price', 'quantity'
                    ],
                    include: [{
                        model: Category,
                        as: 'Category',
                        attributes: ['name'],
                        required: false
                    }],
                    where: {
                        price: {
                            [Op.gt]: 0
                        }
                    },
                    order: [['price', 'DESC']],
                    limit: 15
                });
                
                // Ürün fiyat verilerini formatlayalım
                result.products = products.map(product => {
                    const plainProduct = product.get({ plain: true });
                    const price = parseFloat(plainProduct.price) || 0;
                    const quantity = parseInt(plainProduct.quantity) || 0;
                    
                    return {
                        id: plainProduct.id,
                        name: plainProduct.name || 'İsimsiz Ürün',
                        sku: plainProduct.sku || 'SKU Yok',
                        price: price,
                        category: plainProduct.Category?.name || 'Kategorisiz',
                        totalValue: price * quantity
                    };
                });
            } catch (productError) {
                console.error('Ürün verisi alınırken hata:', productError);
                // Hata olsa bile devam edelim
            }

            try {
                // Kategori bazında ortalama fiyat analizi - Daha basit sorgu
                const categorySql = `
                    SELECT 
                        COALESCE(c.name, 'Kategorisiz') as category_name,
                        AVG(p.price) as average_price,
                        COUNT(p.id) as product_count,
                        SUM(p.price * p.quantity) as total_value
                    FROM "Products" p
                    LEFT JOIN "Categories" c ON p."categoryId" = c.id
                    WHERE p.price > 0
                    GROUP BY c.name
                    ORDER BY AVG(p.price) DESC
                `;
                
                const [categoryResults] = await Product.sequelize.query(categorySql);
                
                // Kategori sonuçlarını formatlayalım
                result.categoryAnalysis = categoryResults.map(row => ({
                    category: row.category_name || 'Kategorisiz',
                    averagePrice: parseFloat(row.average_price) || 0,
                    productCount: parseInt(row.product_count) || 0,
                    totalValue: parseFloat(row.total_value) || 0
                }));
            } catch (categoryError) {
                console.error('Kategori analizi alınırken hata:', categoryError);
                // Hata olsa bile devam edelim
            }

            try {
                // Fiyat aralıkları analizi - Daha basit yaklaşım
                const priceRanges = [
                    { range: '0-100 TL', min: 0, max: 100 },
                    { range: '100-500 TL', min: 100, max: 500 },
                    { range: '500-1000 TL', min: 500, max: 1000 },
                    { range: '1000-5000 TL', min: 1000, max: 5000 },
                    { range: '5000+ TL', min: 5000, max: 999999999 }
                ];
                
                result.priceDistribution = await Promise.all(
                    priceRanges.map(async ({ range, min, max }) => {
                        try {
                            const count = await Product.count({
                                where: {
                                    price: {
                                        [Op.gt]: min,
                                        [Op.lte]: max
                                    }
                                }
                            });
                            return { name: range, value: count || 0 };
                        } catch (error) {
                            console.error(`Fiyat aralığı analizi hatası: ${range}`, error);
                            return { name: range, value: 0 };
                        }
                    })
                );
            } catch (rangeError) {
                console.error('Fiyat aralığı analizi hatası:', rangeError);
                // Varsayılan değerler kullanılsın
                result.priceDistribution = [
                    { name: '0-100 TL', value: 0 },
                    { name: '100-500 TL', value: 0 },
                    { name: '500-1000 TL', value: 0 },
                    { name: '1000-5000 TL', value: 0 },
                    { name: '5000+ TL', value: 0 }
                ];
            }

            // Sonucu döndür
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Product price analysis error:', error);
            res.status(500).json({
                success: false,
                message: 'Ürün fiyat analizi alınırken bir hata oluştu',
                error: error.message
            });
        }
    },

    // Gelir verilerini dashboard için getir
    getRevenueSummary: async (req, res) => {
        try {
            const { timeRange = 'monthly' } = req.query;
            const now = new Date();
            let startDate;
            let dateFormat;
            let dateGrouping;

            // Zaman aralığına göre başlangıç tarihini ve format ayarlarını belirle
            switch (timeRange) {
                case 'daily':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
                    dateFormat = { day: 'numeric', month: 'short' };
                    dateGrouping = 'day';
                    break;
                case 'weekly':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    dateFormat = { day: 'numeric', month: 'short' };
                    dateGrouping = 'day';
                    break;
                case 'monthly':
                default:
                    startDate = new Date(now.getFullYear(), 0, 1);
                    dateFormat = { month: 'long' };
                    dateGrouping = 'month';
                    break;
            }

            // Günün sonuna kadar olan verileri almak için bitiş tarihini ayarla
            const endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);

            // Revenue modelini doğrudan require ile alalım
            const { Revenue } = require('../models');
            
            // TÜM gelirleri getir
            const revenues = await Revenue.findAll({
                order: [['revenueDate', 'DESC']]
            });

            // Sadece zaman aralığındaki gelirleri de alalım (grafikler için)
            const timeFilteredRevenues = await Revenue.findAll({
                where: {
                    revenueDate: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [['revenueDate', 'DESC']]
            });

            // Tüm zamanların toplam gelirini hesapla
            const allTimeRevenue = revenues.reduce((sum, revenue) => sum + Number(revenue.amount), 0);
            
            // 2025 ve sonrası için gelirleri filtrele
            const currentYearRevenues = revenues.filter(revenue => {
                const revenueDate = new Date(revenue.revenueDate);
                return revenueDate.getFullYear() >= 2025;
            });
            
            // 2025 ve sonrası için toplam geliri hesapla
            const totalRevenue = currentYearRevenues.reduce((sum, revenue) => sum + Number(revenue.amount), 0);
            
            // Yeni hesaplama mantığı - Periyodik dağılıma göre (sadece 2025 ve sonrası için)
            // Yıllık gelir: 2025 ve sonrası toplam gelir
            const yearlyRevenue = totalRevenue;
            
            // Aylık gelir: Yıllık gelirin 1/12'si
            const monthlyRevenue = totalRevenue / 12;
            
            // Haftalık gelir: Aylık gelirin 1/4'ü (bir ayda yaklaşık 4 hafta)
            const weeklyRevenue = monthlyRevenue / 4;
            
            // Kategori bazında toplam gelirleri hesapla (zaman aralığı filtreli verilere göre)
            const revenuesByCategory = {};
            for (const revenue of timeFilteredRevenues) {
                const category = revenue.source || 'Diğer';
                if (!revenuesByCategory[category]) {
                    revenuesByCategory[category] = 0;
                }
                revenuesByCategory[category] += parseFloat(revenue.amount);
            }

            // Kategori dağılımı için veri formatla
            const categoryDistribution = Object.entries(revenuesByCategory).map(([category, amount]) => ({
                name: category,
                value: parseFloat(amount.toFixed(2))
            }));

            console.log('Dashboard revenue summaries with periodic distribution:');
            console.log(`- All Time Total: ${allTimeRevenue}`);
            console.log(`- Current Year Total (2025+): ${totalRevenue}`);
            console.log(`- Monthly (1/12): ${monthlyRevenue}`);
            console.log(`- Weekly (1/48): ${weeklyRevenue}`);

            // Zaman dilimine göre günlük/haftalık/aylık gelir dağılımını hesapla
            const timeDistribution = await Revenue.sequelize.query(`
                WITH dates AS (
                    SELECT date_trunc('${dateGrouping}', d)::date as revenue_date
                    FROM generate_series(
                        :startDate::timestamp,
                        :endDate::timestamp,
                        '1 ${dateGrouping}'::interval
                    ) d
                )
                SELECT 
                    d.revenue_date,
                    COALESCE(SUM(r."amount"), 0) as total_amount
                FROM dates d
                LEFT JOIN "Revenues" r ON date_trunc('${dateGrouping}', r."revenueDate") = d.revenue_date
                GROUP BY d.revenue_date
                ORDER BY d.revenue_date ASC
            `, {
                replacements: { startDate, endDate },
                type: Revenue.sequelize.QueryTypes.SELECT
            });

            // Tarih bazlı gelir dağılımını formatla
            const formattedTimeDistribution = timeDistribution.map(item => ({
                date: new Date(item.revenue_date).toLocaleDateString('tr-TR', dateFormat),
                amount: parseFloat(item.total_amount)
            }));

            res.json({
                success: true,
                data: {
                    revenues: revenues.map(revenue => ({
                        id: revenue.id,
                        amount: parseFloat(revenue.amount),
                        source: revenue.source,
                        description: revenue.description,
                        date: revenue.revenueDate
                    })),
                    allTimeRevenue: parseFloat(allTimeRevenue.toFixed(2)),
                    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                    yearlyRevenue: parseFloat(yearlyRevenue.toFixed(2)),
                    monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
                    weeklyRevenue: parseFloat(weeklyRevenue.toFixed(2)),
                    categoryDistribution,
                    timeDistribution: formattedTimeDistribution
                }
            });
        } catch (error) {
            console.error('Get revenue summary error:', error);
            res.status(500).json({
                success: false,
                message: 'Gelir özeti alınırken bir hata oluştu'
            });
        }
    }
};

module.exports = dashboardController;
