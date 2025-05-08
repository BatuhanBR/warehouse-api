const { Location, Product } = require('../models');

const warehouseController = {
    get3DViewData: async (req, res) => {
        console.log('get3DViewData endpoint hit');
        try {
            // Test verisi
            const testData = [];
            
            // 3x3x3'lük bir raf sistemi
            for (let x = 0; x < 3; x++) {
                for (let y = 0; y < 3; y++) {
                    for (let z = 0; z < 3; z++) {
                        testData.push({
                            rackNumber: x,
                            level: y,
                            position: z,
                            width: 100,
                            height: 100,
                            depth: 100,
                            isOccupied: Math.random() > 0.5
                        });
                    }
                }
            }

            console.log('Sending test data:', testData);
            res.json({
                success: true,
                data: testData
            });

        } catch (error) {
            console.error('Controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Depo verisi alınırken bir hata oluştu',
                error: error.message
            });
        }
    }
};

module.exports = warehouseController;