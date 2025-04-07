const { Product, Location } = require('../models');
const logger = require('../config/logger');
const db = require('../models');

const locationController = {
    // Tüm lokasyonları getir
    getAllLocations: async (req, res) => {
        try {
            const locations = await Location.findAll({
                include: [{
                    model: Product,
                    as: 'products',
                    attributes: ['id', 'name', 'quantity', 'locationCode']
                }]
            });
            res.json({ success: true, data: locations });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 3D görünüm için lokasyon verilerini getir
    get3DView: async (req, res) => {
        try {
            const locations = await Location.findAll({
                attributes: [
                    'id', 'code', 'section', 'row', 'level',
                    'position', 'capacity', 'occupied', 'status',
                    'coordinates'
                ],
                include: [{
                    model: Product,
                    as: 'products',
                    attributes: ['id', 'name', 'quantity', 'position3D']
                }]
            });

            // 3D görünüm için veriyi formatla
            const view3D = {
                sections: {},
                dimensions: {
                    maxX: 0,
                    maxY: 0,
                    maxZ: 0
                }
            };

            locations.forEach(loc => {
                if (!view3D.sections[loc.section]) {
                    view3D.sections[loc.section] = [];
                }

                view3D.sections[loc.section].push({
                    id: loc.id,
                    code: loc.code,
                    position: {
                        x: loc.coordinates.x,
                        y: loc.coordinates.y,
                        z: loc.coordinates.z
                    },
                    dimensions: {
                        width: 1,  // standart birim
                        height: 1,
                        depth: 1
                    },
                    status: loc.status,
                    products: loc.products
                });

                // Maksimum boyutları güncelle
                view3D.dimensions.maxX = Math.max(view3D.dimensions.maxX, loc.coordinates.x);
                view3D.dimensions.maxY = Math.max(view3D.dimensions.maxY, loc.coordinates.y);
                view3D.dimensions.maxZ = Math.max(view3D.dimensions.maxZ, loc.coordinates.z);
            });

            res.json({ success: true, data: view3D });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Ürün yerleştirme
    assignProduct: async (req, res) => {
        try {
            const { productId, locationId, position3D } = req.body;
            
            const location = await Location.findByPk(locationId);
            const product = await Product.findByPk(productId);

            if (!location || !product) {
                return res.status(404).json({
                    success: false,
                    message: 'Lokasyon veya ürün bulunamadı'
                });
            }

            if (location.occupied + product.quantity > location.capacity) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu lokasyonda yeterli alan yok'
                });
            }

            await product.update({
                locationId,
                position3D
            });

            await location.update({
                occupied: location.occupied + product.quantity,
                status: location.occupied + product.quantity >= location.capacity ? 'full' : 'partial'
            });

            res.json({
                success: true,
                message: 'Ürün başarıyla yerleştirildi',
                data: { product, location }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Yeni lokasyon oluşturma
    createLocation: async (req, res) => {
        try {
            const locationData = {
                code: req.body.code,
                section: req.body.section,
                row: req.body.row,
                level: req.body.level,
                position: req.body.position,
                capacity: req.body.capacity,
                coordinates: req.body.coordinates || {
                    x: req.body.row - 1,
                    y: req.body.level - 1,
                    z: req.body.position - 1
                },
                occupied: 0,
                status: 'empty'
            };

            const location = await Location.create(locationData);

            logger.info('Location created', {
                locationId: location.id,
                userId: req.user?.id,
                action: 'create_location'
            });

            res.status(201).json({
                success: true,
                data: location
            });
        } catch (error) {
            logger.error('Location creation failed', {
                error: error.message,
                userId: req.user?.id
            });
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    getLocations: async (req, res) => {
        try {
            console.log('getLocations çağrıldı');  // Debug log
            const locations = await Location.findAll({
                attributes: ['id', 'code', 'rackNumber', 'level', 'position']
            });

            console.log('Bulunan lokasyonlar:', locations); // Debug log

            res.json({
                success: true,
                data: locations
            });
        } catch (error) {
            console.error('Get locations error:', error);
            res.status(500).json({
                success: false,
                message: 'Lokasyonlar yüklenirken bir hata oluştu'
            });
        }
    },

    // Belirli bir rafın lokasyonlarını getir
    getRackLocations: async (req, res) => {
        try {
            const { rackNumber } = req.params;
            console.log('Requested rack number:', rackNumber);

            // Lokasyonları getir
            const locations = await Location.findAll({
                where: { 
                    rackNumber: parseInt(rackNumber)
                },
                include: [{
                    model: Product,
                    as: 'Product',
                    required: false
                }],
                attributes: [
                    'id', 'code', 'rackNumber', 'level', 
                    'position', 'isOccupied', 'productId',
                    'width', 'height', 'depth'
                ]
            });
            
            // Duplicate lokasyonları filtrele ve hücre durumlarını düzelt
            const uniqueLocations = [];
            const seenCodes = new Set();
            
            locations.forEach(location => {
                const plainLocation = location.get({ plain: true });
                
                // Lokasyon kodunu kontrol et - tekrar eden locationları filtrele
                if (!seenCodes.has(plainLocation.code)) {
                    seenCodes.add(plainLocation.code);
                    
                    // İsOccupied ve Product durumunu kontrol et - tutarsızlıkları düzelt
                    if (plainLocation.Product && plainLocation.Product.id) {
                        plainLocation.isOccupied = true;
                    } else {
                        plainLocation.isOccupied = false;
                        plainLocation.Product = null;
                    }
                    
                    uniqueLocations.push(plainLocation);
                }
            });
            
            console.log(`Found ${uniqueLocations.length} unique locations for rack ${rackNumber}`);
            
            res.json({
                success: true,
                data: uniqueLocations
            });
        } catch (error) {
            console.error('Raf lokasyonları getirme hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Raf lokasyonları alınırken bir hata oluştu'
            });
        }
    },

    // Tüm rafları getir (benzersiz raf numaralarını)
    getRacks: async (req, res) => {
        try {
            console.log('Getting racks from Locations table');
            
            // Locations tablosundan benzersiz raf numaralarını getir
            const racks = await db.sequelize.query(`
                SELECT 
                    "rackNumber",
                    COUNT(*) as "totalCells",
                    SUM(CASE WHEN "isOccupied" = true THEN 1 ELSE 0 END) as "occupiedCells",
                    MIN("code") as "rackCode"
                FROM "Locations"
                GROUP BY "rackNumber"
                ORDER BY "rackNumber" ASC
            `, { type: db.sequelize.QueryTypes.SELECT });
            
            console.log(`Retrieved ${racks.length} racks`);
            
            // Her raf için id oluştur (frontend'in beklediği formata uygun olması için)
            const formattedRacks = racks.map((rack, index) => ({
                id: index + 1,
                position: rack.rackNumber,
                name: `Raf ${rack.rackNumber}`,
                totalCells: parseInt(rack.totalCells),
                occupiedCells: parseInt(rack.occupiedCells),
                availableCells: parseInt(rack.totalCells) - parseInt(rack.occupiedCells),
                rackCode: rack.rackCode
            }));

            res.json({
                success: true,
                data: formattedRacks
            });
        } catch (error) {
            console.error('Get racks error:', error);
            res.status(500).json({
                success: false,
                message: 'Raflar yüklenirken bir hata oluştu'
            });
        }
    },

    // Belirli bir rafın hücrelerini getir
    getRackCells: async (req, res) => {
        try {
            const { rackNumber } = req.params;
            console.log(`Getting cells for rack ${rackNumber} from Locations table`);
            
            // Belirli raf numarasına sahip tüm hücreleri getir
            const cells = await db.Location.findAll({
                where: { rackNumber: parseInt(rackNumber) },
                attributes: [
                    'id',
                    'code',
                    'level',
                    'position',
                    'isOccupied',
                    'productId',
                    'availableCapacity', // Eğer bu alan yoksa SQL tarafında hesaplanabilir
                    'width',
                    'height',
                    'depth'
                ],
                order: [
                    ['level', 'ASC'],
                    ['position', 'ASC']
                ]
            });
            
            console.log(`Retrieved ${cells.length} cells for rack ${rackNumber}`);
            
            // Her hücre için frontend'in beklediği şekilde availableCapacity ekleyelim
            const formattedCells = cells.map(cell => {
                const plainCell = cell.get({ plain: true });
                // Eğer availableCapacity alanı yoksa, isOccupied durumuna göre belirle
                if (plainCell.availableCapacity === undefined) {
                    plainCell.availableCapacity = plainCell.isOccupied ? 0 : 4; // Varsayılan kapasite 4
                }
                return plainCell;
            });

            res.json({
                success: true,
                data: formattedCells
            });
        } catch (error) {
            console.error('Get rack cells error:', error);
            res.status(500).json({
                success: false,
                message: 'Raf hücreleri yüklenirken bir hata oluştu'
            });
        }
    },

    // Konum kodu ile lokasyonu getir
    getLocationByCode: async (req, res) => {
        try {
            const { code } = req.params;
            
            const location = await Location.findOne({
                where: { code },
                attributes: ['id', 'code', 'rackNumber', 'level', 'position', 'isOccupied', 'productId', 'width', 'height', 'depth', 'createdAt', 'updatedAt'],
                include: [{
                    model: Product,
                    as: 'Product',
                    required: false
                }]
            });

            if (!location) {
                return res.status(404).json({
                    success: false,
                    message: 'Lokasyon bulunamadı'
                });
            }

            // Lokasyon verisini düzenle
            const plainLocation = location.get({ plain: true });
            if (plainLocation.Product && plainLocation.Product.id) {
                plainLocation.isOccupied = true;
            } else {
                plainLocation.isOccupied = false;
                plainLocation.Product = null;
            }

            res.json({
                success: true,
                data: plainLocation
            });
        } catch (error) {
            console.error('Lokasyon getirme hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Lokasyon alınırken bir hata oluştu'
            });
        }
    },

    // Lokasyon güncelleme (ürün ekleme/çıkarma)
    updateLocation: async (req, res) => {
        const transaction = await db.sequelize.transaction();
        
        try {
            const { code, productId, isOccupied } = req.body;
            
            // Lokasyonu bul - sadece mevcut kolonları seç
            const location = await Location.findOne({
                where: { code },
                attributes: ['id', 'code', 'rackNumber', 'level', 'position', 'isOccupied', 'productId', 'width', 'height', 'depth', 'createdAt', 'updatedAt'],
                transaction
            });

            if (!location) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Lokasyon bulunamadı'
                });
            }

            // Eğer ürün eklenmek isteniyorsa
            if (isOccupied && productId) {
                // Ürünü bul
                const product = await Product.findByPk(productId, { transaction });
                
                if (!product) {
                    await transaction.rollback();
                    return res.status(404).json({
                        success: false,
                        message: 'Ürün bulunamadı'
                    });
                }

                // Eğer lokasyonda başka bir ürün varsa
                if (location.isOccupied && location.productId && location.productId !== productId) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: 'Bu lokasyonda başka bir ürün bulunuyor'
                    });
                }

                // Lokasyonu güncelle
                await location.update({
                    productId,
                    isOccupied: true
                }, { transaction });
                
                // Ürünü güncelle (lokasyon bilgisi ekle)
                await product.update({
                    locationId: location.id
                }, { transaction });
            } 
            // Ürün çıkarılmak isteniyorsa
            else {
                // Eğer lokasyonda bir ürün varsa
                if (location.productId) {
                    // Ürünü bul
                    const product = await Product.findByPk(location.productId, { transaction });
                    
                    if (product) {
                        // Ürünün lokasyon bağlantısını kaldır
                        await product.update({
                            locationId: null
                        }, { transaction });
                    }
                }
                
                // Lokasyonu güncelle
                await location.update({
                    productId: null,
                    isOccupied: false
                }, { transaction });
            }

            await transaction.commit();
            
            // Güncellenmiş lokasyonu getir - sadece mevcut kolonları seç
            const updatedLocation = await Location.findByPk(location.id, {
                attributes: ['id', 'code', 'rackNumber', 'level', 'position', 'isOccupied', 'productId', 'width', 'height', 'depth', 'createdAt', 'updatedAt'],
                include: [{
                    model: Product,
                    as: 'Product',
                    required: false
                }]
            });
            
            res.json({
                success: true,
                message: isOccupied ? 'Ürün başarıyla yerleştirildi' : 'Ürün başarıyla kaldırıldı',
                data: updatedLocation
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Lokasyon güncelleme hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Lokasyon güncellenirken bir hata oluştu'
            });
        }
    }
};

const calculateStorageUsage = async () => {
    try {
        const locations = await Location.findAll({
            attributes: ['id', 'width', 'height', 'depth']
        });

        const products = await Product.findAll({
            attributes: ['width', 'height', 'length', 'quantity', 'locationId']
        });

        // Toplam raf hacmi
        const totalCapacity = locations.reduce((sum, loc) => 
            sum + (loc.width * loc.height * loc.depth), 0);

        // Kullanılan hacim
        const usedCapacity = products.reduce((sum, prod) => 
            sum + (prod.width * prod.height * prod.length * prod.quantity), 0);

        return {
            totalCapacity,
            usedCapacity,
            usagePercentage: (usedCapacity / totalCapacity) * 100
        };
    } catch (error) {
        console.error('Storage usage calculation error:', error);
        throw error;
    }
};

module.exports = locationController; 