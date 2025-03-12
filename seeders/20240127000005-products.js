'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Kategorileri al
    const categories = await queryInterface.sequelize.query(
        'SELECT id, name FROM "Categories"',
        { 
          type: Sequelize.QueryTypes.SELECT,
          raw: true
        }
      );

      if (!categories || categories.length === 0) {
        console.log('Kategori bulunamadı');
        return;
      }

      const products = [];
      const companies = ['Samsung', 'Apple', 'LG', 'Sony', 'Philips', 'Bosch', 'Vestel', 'Beko'];
      const sizes = ['Küçük', 'Normal', 'Büyük'];

      // Tarih aralıkları (son 1 yıl içinde)
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1); // 1 yıl öncesi
      const endDate = new Date(); // Şu an

      // Depolama süre aralıkları (gün bazında)
      const storageDurations = {
        'Kısa': { min: 7, max: 30 },    // 1 hafta - 1 ay
        'Orta': { min: 30, max: 90 },   // 1 ay - 3 ay
        'Uzun': { min: 90, max: 365 }   // 3 ay - 1 yıl
      };

      // Kategori bazlı fiyat aralıkları
      const categoryPrices = {
        'Elektronik': { min: 1000, max: 10000 },
        'Gıda': { min: 10, max: 500 },
        'Kozmetik': { min: 50, max: 1000 },
        'Kitap': { min: 20, max: 300 },
        'Giyim': { min: 50, max: 2000 },
        'Spor': { min: 100, max: 3000 },
        'Ev & Yaşam': { min: 100, max: 5000 },
        'Oyuncak': { min: 30, max: 800 },
        'Ofis': { min: 20, max: 1000 },
        'Bahçe': { min: 50, max: 2000 }
      };

      // Kategori bazlı günlük depolama ücretleri
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

      // Kategori bazlı boyut aralıkları (cm)
      const categorySizes = {
        'Elektronik': {
          'Küçük': { width: [20, 35], height: [2, 5], length: [15, 25] },      // Tablet, küçük laptop
          'Normal': { width: [35, 60], height: [3, 8], length: [25, 40] },     // Laptop, monitör
          'Büyük': { width: [80, 150], height: [50, 90], length: [10, 20] }    // TV
        },
        'Gıda': {
          'Küçük': { width: [10, 20], height: [15, 25], length: [10, 20] },    // Paketli gıdalar
          'Normal': { width: [30, 50], height: [40, 60], length: [30, 50] },   // Koli
          'Büyük': { width: [60, 100], height: [120, 180], length: [60, 100] } // Palet
        },
        'Kozmetik': {
          'Küçük': { width: [5, 10], height: [10, 20], length: [5, 10] },      // Krem, parfüm
          'Normal': { width: [20, 35], height: [25, 45], length: [20, 35] },   // Set kutuları
          'Büyük': { width: [45, 70], height: [60, 90], length: [45, 70] }     // Toplu siparişler
        },
        'Kitap': {
          'Küçük': { width: [15, 25], height: [2, 4], length: [20, 30] },      // Tekli kitap
          'Normal': { width: [25, 40], height: [25, 35], length: [25, 40] },   // Kitap seti
          'Büyük': { width: [45, 70], height: [35, 55], length: [45, 70] }     // Koli
        },
        'Ev & Yaşam': {
          'Küçük': { width: [25, 45], height: [25, 45], length: [25, 45] },    // Küçük ev aletleri
          'Normal': { width: [55, 85], height: [60, 110], length: [55, 85] },  // Elektrikli aletler
          'Büyük': { width: [75, 120], height: [160, 220], length: [65, 100] } // Beyaz eşya
        }
      };

      // Varsayılan boyut aralıkları (diğer kategoriler için)
      const defaultSizes = {
        'Küçük': { width: [15, 35], height: [15, 35], length: [15, 35] },
        'Normal': { width: [35, 70], height: [35, 70], length: [35, 70] },
        'Büyük': { width: [70, 120], height: [70, 120], length: [70, 120] }
      };

      // Her kategori için ürünler oluştur
      categories.forEach(category => {
        for (let i = 0; i < 5; i++) {
          const size = sizes[Math.floor(Math.random() * sizes.length)];
          
          // Kategori için boyut aralıklarını al
          const sizeRanges = (categorySizes[category.name] || defaultSizes)[size];
          
          // Boyutları hesapla
          const getRandomDimension = (range) => {
            return Number((Math.random() * (range[1] - range[0]) + range[0]).toFixed(2));
          };

          const width = getRandomDimension(sizeRanges.width);
          const height = getRandomDimension(sizeRanges.height);
          const length = getRandomDimension(sizeRanges.length);

          const weight = size === 'Küçük' ? Math.random() * 5 : 
                        size === 'Normal' ? Math.random() * 20 + 5 : 
                        Math.random() * 50 + 20;
          
          const quantity = Math.floor(Math.random() * 50) + 1;
          const company = companies[Math.floor(Math.random() * companies.length)];

          // Rastgele başlangıç tarihi oluştur (son 1 yıl içinde)
          const randomStartDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
          
          // Rastgele depolama süresi seç
          const durationType = Math.random() < 0.3 ? 'Kısa' : Math.random() < 0.7 ? 'Orta' : 'Uzun';
          const durationRange = storageDurations[durationType];
          const expectedDuration = Math.floor(Math.random() * (durationRange.max - durationRange.min) + durationRange.min);

          // Kategori için fiyat aralığını al
          const priceRange = categoryPrices[category.name] || { min: 50, max: 1000 };
          const price = Number((Math.random() * (priceRange.max - priceRange.min) + priceRange.min).toFixed(2));

          // Kategori için günlük depolama ücretini al
          const dailyStorageRate = categoryStorageRates[category.name] || 50;

        products.push({
            name: `${company} Ürün ${i + 1}`,
            sku: `${category.id}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            description: `${size} boyutlu ${company} ürünü - ${durationType} süreli depolama`,
            quantity,
            price,
            dailyStorageRate,
            minStockLevel: Math.max(5, Math.floor(quantity * 0.2)),
            maxStockLevel: Math.floor(quantity * 2),
            weight: Number(weight.toFixed(2)),
            width,
            height,
            length,
            categoryId: category.id,
            locationId: null,
            company,
            storageStartDate: randomStartDate,
            expectedStorageDuration: expectedDuration,
          createdBy: 1,
            createdAt: randomStartDate,
            updatedAt: randomStartDate
        });
      }
    });

      // Ürünleri ekle
      await queryInterface.bulkInsert('Products', products);

      // Boş lokasyonları al
      const emptyLocations = await queryInterface.sequelize.query(
        'SELECT id FROM "Locations" WHERE "isOccupied" = false LIMIT 50',
        { 
          type: Sequelize.QueryTypes.SELECT,
          raw: true
        }
      );

      // Yeni eklenen ürünleri al
      const addedProducts = await queryInterface.sequelize.query(
        'SELECT id FROM "Products" WHERE "locationId" IS NULL ORDER BY id DESC LIMIT 50',
        { 
          type: Sequelize.QueryTypes.SELECT,
          raw: true
        }
      );

      // Her bir boş lokasyon için bir ürün güncelle
      for (let i = 0; i < Math.min(emptyLocations.length, addedProducts.length); i++) {
        await queryInterface.sequelize.query(
          'UPDATE "Products" SET "locationId" = :locationId WHERE id = :productId',
          {
            replacements: {
              locationId: emptyLocations[i].id,
              productId: addedProducts[i].id
            },
            type: Sequelize.QueryTypes.UPDATE
          }
        );

        await queryInterface.sequelize.query(
          'UPDATE "Locations" SET "isOccupied" = true WHERE id = :locationId',
          {
            replacements: { locationId: emptyLocations[i].id },
            type: Sequelize.QueryTypes.UPDATE
          }
        );
      }

      console.log('Seed işlemi başarılı');
    } catch (error) {
      console.error('Seed hatası:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.bulkDelete('Products', null, {});
      await queryInterface.sequelize.query(
        'UPDATE "Locations" SET "isOccupied" = false',
        { type: Sequelize.QueryTypes.UPDATE }
      );
    } catch (error) {
      console.error('Down migration hatası:', error);
      throw error;
    }
  }
}; 