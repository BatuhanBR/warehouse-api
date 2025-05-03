const dssService = require('../services/dssService');

/**
 * Karar Destek Sistemi'nden önerileri alır ve yanıt olarak döner.
 * Gelen isteğin query parametresindeki 'type' değerini servise iletir.
 */
const getRecommendations = async (req, res) => {
    console.log('DSS Controller: getRecommendations çağrıldı.');
    // İstekten query parametresini al (eğer varsa)
    const recommendationType = req.query.type;
    console.log(`İstenen öneri tipi: ${recommendationType || 'Tümü'}`);

    try {
        // Servis fonksiyonuna tipi parametre olarak gönder
        const recommendations = await dssService.getRecommendations(recommendationType);
        
        res.status(200).json({
            success: true,
            message: 'Öneriler başarıyla alındı.',
            data: recommendations
        });
    } catch (error) {
        console.error('Controllerda öneriler alınırken hata:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Öneriler alınırken sunucu hatası oluştu.',
            data: []
        });
    }
};

module.exports = {
    getRecommendations
}; 