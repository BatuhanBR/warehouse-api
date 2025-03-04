const express = require('express');
const warehouseController = require('../controllers/warehouseController');
const auth = require('../middleware/auth');

const router = express.Router();

// Debug için log ekleyelim
console.log('warehouseRoutes loaded');

router.get('/3d-view', auth, (req, res) => {
    console.log('3d-view endpoint hit');
    warehouseController.get3DViewData(req, res);
});

module.exports = router;