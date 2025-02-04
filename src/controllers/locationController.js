const Location = require('../models/location');
const Product = require('../models/Product');
const logger = require('../config/logger');

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
    }
};

module.exports = locationController; 