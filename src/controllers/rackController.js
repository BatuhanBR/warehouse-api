const { Shelf, Cell, CellProduct, Product } = require('../models');
const db = require('../models');

// shelfController'ın aynısını kullanarak rackController oluşturuyoruz
// Bu şekilde /api/racks endpoint'i /api/shelves endpoint'ine yönlendirilmiş oluyor
const rackController = {
    // Tüm rafları ve içindeki ürünleri getir
    getRacks: async (req, res) => {
        try {
            console.log('getRacks API called');
            
            const shelves = await Shelf.findAll({
                include: [{
                    model: Cell,
                    as: 'cells',
                    include: [{
                        model: CellProduct,
                        as: 'products',
                        include: [{
                            model: Product,
                            as: 'product'
                        }]
                    }]
                }],
                order: [
                    ['position', 'ASC']
                ]
            });

            console.log(`Retrieved ${shelves.length} shelves`);

            res.json({
                success: true,
                data: shelves
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
            console.log(`getRackCells API called for rackNumber: ${rackNumber}`);

            // Shelf tablosunda position alanı, raf numarasına denk gelir
            const shelf = await Shelf.findOne({
                where: { position: parseInt(rackNumber) }
            });

            if (!shelf) {
                console.log(`Shelf not found for position: ${rackNumber}`);
                return res.status(404).json({
                    success: false,
                    message: 'Raf bulunamadı'
                });
            }

            console.log(`Found shelf with ID: ${shelf.id}`);

            // Rafın hücrelerini getir
            const cells = await Cell.findAll({
                where: { shelfId: shelf.id },
                order: [['position', 'ASC']]
            });

            console.log(`Retrieved ${cells.length} cells for shelf ID: ${shelf.id}`);

            res.json({
                success: true,
                data: cells
            });
        } catch (error) {
            console.error('Get rack cells error:', error);
            res.status(500).json({
                success: false,
                message: 'Raf hücreleri yüklenirken bir hata oluştu'
            });
        }
    }
};

module.exports = rackController; 