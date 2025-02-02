const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

// Debug log'unu kaldıralım
// console.log('Dashboard Controller:', dashboardController);

// Route'ları tanımlayalım
router.get('/stats', auth, (req, res) => dashboardController.getStats(req, res));
router.get('/trends', auth, (req, res) => dashboardController.getTrends(req, res));
router.get('/predictions', auth, (req, res) => dashboardController.getPredictions(req, res));
router.get('/recent-movements', auth, (req, res) => dashboardController.getRecentMovements(req, res));

module.exports = router;
