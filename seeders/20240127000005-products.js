'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const products = [];
    const categories = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Categories";',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Kategori bazlı ürün şablonları ve boyutları
    const productTemplates = {
      'Elektronik': [
        { base: 'Laptop', price: { min: 15000, max: 35000 }, dimensions: { width: 35, height: 3, depth: 25 } },
        { base: 'Akıllı Telefon', price: { min: 8000, max: 25000 }, dimensions: { width: 15, height: 1, depth: 8 } },
        { base: 'Tablet', price: { min: 5000, max: 20000 }, dimensions: { width: 25, height: 1, depth: 18 } },
        { base: 'Kulaklık', price: { min: 500, max: 3000 }, dimensions: { width: 8, height: 8, depth: 4 } },
        { base: 'Monitör', price: { min: 2500, max: 8000 }, dimensions: { width: 60, height: 40, depth: 10 } }
      ],
      'Mobilya': [
        { base: 'Çalışma Masası', price: { min: 1500, max: 5000 }, dimensions: { width: 120, height: 75, depth: 60 } },
        { base: 'Ofis Koltuğu', price: { min: 2000, max: 6000 }, dimensions: { width: 60, height: 110, depth: 60 } },
        { base: 'Dolap', price: { min: 3000, max: 8000 }, dimensions: { width: 80, height: 180, depth: 40 } }
      ],
      'Kırtasiye': [
        { base: 'Kalem Seti', price: { min: 50, max: 300 }, dimensions: { width: 20, height: 5, depth: 8 } },
        { base: 'Defter', price: { min: 20, max: 100 }, dimensions: { width: 21, height: 30, depth: 2 } },
        { base: 'Dosya', price: { min: 30, max: 150 }, dimensions: { width: 25, height: 35, depth: 3 } }
      ]
    };

    // Şirket isimleri listesi ekleyin (products.forEach üstüne)
    const companyNames = [
      'TechCorp',
      'InnovateSolutions',
      'GlobalTrade',
      'SmartTech',
      'FutureWorks',
      'EliteCorp',
      'PrimeTech',
      'NextGen Industries',
      'DigitalWave',
      'MegaCorp',
      'AlphaTech',
      'OmegaSystems',
      'PioneerTech',
      'VisionaryTech',
      'ApexCorp',
      'InfinityTech',
      'StarTech',
      'UnityTrade',
      'ProTech Solutions',
      'BlueSky Industries',
      'RedRock Technologies',
      'GreenLeaf Corp',
      'SilverLine Systems',
      'GoldStar Tech',
      'CrystalTech',
      'PeakPerformance',
      'SummitSolutions',
      'ValleyTech',
      'RiverFlow Systems',
      'OceanWave Corp',
      'MountainTop Tech',
      'SunriseTech',
      'SunsetSolutions',
      'EagleTech',
      'FalconSystems'
    ];

    // Toplam 100 ürün için kategori başına ürün sayısını hesapla
    const productsPerCategory = Math.floor(100 / categories.length); // Her kategoriye eşit dağıtım
    const remainingProducts = 100 % categories.length; // Kalan ürünleri ilk kategorilere ekle

    categories.forEach((category, index) => {
      const templates = productTemplates[category.name] || [
        { base: 'Ürün', price: { min: 100, max: 1000 }, dimensions: { width: 30, height: 30, depth: 30 } }
      ];
      
      // Her kategori için ürün sayısını belirle
      const productCount = productsPerCategory + (index < remainingProducts ? 1 : 0);
      
      for (let i = 0; i < productCount; i++) {
        const template = templates[Math.floor(Math.random() * templates.length)];
        const modelNo = Math.floor(Math.random() * 999) + 1;
        const variant = ['Pro', 'Plus', 'Lite', 'Max', 'Basic'][Math.floor(Math.random() * 5)];
        const storageStartDate = new Date();
        storageStartDate.setDate(storageStartDate.getDate() - Math.floor(Math.random() * 90));

        products.push({
          name: `${template.base} ${variant} ${modelNo}`,
          sku: `${category.id.toString().padStart(2, '0')}${i.toString().padStart(3, '0')}`,
          description: `${template.base} ${variant} model ürün açıklaması`,
          quantity: Math.floor(Math.random() * 200) + 1,
          price: Math.floor(Math.random() * (template.price.max - template.price.min)) + template.price.min,
          minStockLevel: Math.floor(Math.random() * 20) + 5,
          maxStockLevel: Math.floor(Math.random() * 50) + 50,
          width: template.dimensions.width,
          height: template.dimensions.height,
          length: template.dimensions.depth,
          dailyStorageRate: Math.floor(Math.random() * 50) + 50,
          storageStartDate: storageStartDate,
          expectedStorageDuration: Math.floor(Math.random() * 180) + 30,
          categoryId: category.id,
          locationId: Math.floor(Math.random() * 100) + 1, // Sadece ilk 100 lokasyonu kullan
          createdBy: 1,
          company: companyNames[Math.floor(Math.random() * companyNames.length)], // Rastgele bir şirket seç
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });

    return queryInterface.bulkInsert('Products', products);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Products', null, {});
  }
}; 