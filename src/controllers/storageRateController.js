const { Category } = require('../models');

const categoryStorageRates = {
    'Elektronik': 100,    // Hassas ürünler
    'Gıda': 150,         // Soğuk zincir gerektirir
    'Kozmetik': 120,     // Sıcaklık kontrolü gerektirir
    'Kitap': 50,         // Normal depolama
    'Giyim': 70,         // Normal depolama
    'Spor': 80,          // Normal depolama
    'Ev & Yaşam': 90,    // Büyük ürünler
    'Oyuncak': 60,       // Normal depolama
    'Ofis': 70,          // Normal depolama
    'Bahçe': 100         // Büyük ürünler
};

const getStorageRateByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        
        // Kategoriyi bul
        const category = await Category.findByPk(categoryId);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Kategori bulunamadı'
            });
        }

        // Kategori için günlük depolama ücretini al
        const dailyRate = categoryStorageRates[category.name] || 50; // Varsayılan 50

        return res.json({
            success: true,
            data: {
                categoryId: category.id,
                categoryName: category.name,
                dailyRate
            }
        });
    } catch (error) {
        console.error('Depolama ücreti alma hatası:', error);
        return res.status(500).json({
            success: false,
            message: 'Depolama ücreti alınırken bir hata oluştu'
        });
    }
};

module.exports = {
    getStorageRateByCategory
}; 