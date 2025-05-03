const { Product, Location, StockMovement, Cell /* Diğer gerekli modeller */ } = require('../models'); // Model importlarını ayarla
const { Op, Sequelize } = require('sequelize'); // Sequelize objesini de import et

/**
 * Düşük stok seviyesine sahip ürünleri bulur ve öneri oluşturur.
 */
async function findLowStockRecommendations() {
    const recommendations = [];
    try {
        console.log('DSS Service: Düşük stok kontrolü başlıyor...');
        const lowStockProducts = await Product.findAll({
            where: {
                quantity: {
                    [Op.lt]: Sequelize.col('minStockLevel') // quantity < minStockLevel kontrolü
                },
                minStockLevel: { [Op.gt]: 0 } // Sadece minStockLevel tanımlanmış ürünleri dikkate al
            }
        });
        console.log(`${lowStockProducts.length} adet düşük stoklu ürün bulundu.`);

        lowStockProducts.forEach(product => {
            recommendations.push({
                type: 'low_stock',
                product_id: product.id,
                product_name: product.name,
                current_stock: product.quantity,
                min_stock: product.minStockLevel,
                suggestion: `Stok kritik seviyede (${product.name}: ${product.quantity}/${product.minStockLevel}). Sipariş verilmesi önerilir.`
            });
        });
    } catch (error) {
        console.error('Düşük stok önerileri alınırken hata:', error);
    }
    return recommendations;
}

/**
 * Depo kullanım oranını hesaplar ve yüksekse öneri oluşturur.
 */
async function findUtilizationRecommendations() {
    const recommendations = [];
    try {
        console.log('DSS Service: Depo kullanım oranı kontrolü başlıyor (Location/Products ile)...');
        
        // Dashboard controller'daki mantığı kullan
        const TOTAL_CELLS = 160; // Toplam hücre sayısı
        const CAPACITY_PER_CELL = 2; // Hücre başına palet/ürün kapasitesi
        const TOTAL_PALLET_CAPACITY = TOTAL_CELLS * CAPACITY_PER_CELL;

        // Tüm lokasyonları ve içlerindeki ilişkili ürünleri (paletleri temsil ediyor varsayımıyla) çek
        const locations = await Location.findAll({
            include: [{
                model: Product, // Product modelini include et
                as: 'products', // İlişki adı: 'products'
                attributes: ['id'] // Sadece saymak için id yeterli
            }],
            attributes: ['id'] 
        });

        let totalPallets = 0; // Aslında lokasyondaki ürün sayısı

        // Toplam palet/ürün sayısını hesapla
        for (const location of locations) {
            const palletCountInLocation = location.products?.length ?? 0; // products dizisinin uzunluğu
            totalPallets += palletCountInLocation;
        }

        console.log(`Toplam Kapasite: ${TOTAL_PALLET_CAPACITY}, Toplam Palet/Ürün: ${totalPallets}`);

        if (TOTAL_PALLET_CAPACITY > 0) {
            const utilizationPercent = Math.round((totalPallets / TOTAL_PALLET_CAPACITY) * 100);
            console.log(`Hesaplanan Kullanım Oranı: ${utilizationPercent}%`);
            
            // Öneri eşiklerini tanımla (örnek)
            const HIGH_THRESHOLD = 85;
            const LOW_THRESHOLD = 30; // İsteğe bağlı: Düşük kullanım için de öneri eklenebilir

            if (utilizationPercent > HIGH_THRESHOLD) { 
                 recommendations.push({
                    type: 'high_utilization', // Frontend'in beklediği tip adı bu olmalı
                    utilization_percent: utilizationPercent,
                    suggestion: `Depo genel doluluk oranı (%${utilizationPercent}) yüksek. Yeni ürün kabulünde zorluk yaşanabilir. Yer açma stratejileri düşünülmeli.`
                });
            } else if (utilizationPercent < LOW_THRESHOLD) {
                recommendations.push({
                    type: 'low_utilization', // Yeni bir tip veya genel 'info' tipi olabilir
                    utilization_percent: utilizationPercent,
                    suggestion: `Depo genel doluluk oranı (%${utilizationPercent}) düşük. Daha fazla stok çekilebilir veya pazarlama çalışmaları ile satışlar artırılabilir.`
                });
            } else {
                // Orta seviye doluluk için de bir mesaj eklenebilir veya boş geçilebilir
                 recommendations.push({
                    type: 'info_utilization', // Yeni bir tip veya genel 'info' tipi olabilir
                    utilization_percent: utilizationPercent,
                    suggestion: `Depo doluluk oranı (%${utilizationPercent}) optimum seviyelerde.`
                });
            }
        } else {
            console.log('Depo kapasite verisi bulunamadı veya toplam kapasite sıfır.');
        }
    } catch (error) {
        console.error('Depo kullanım önerileri alınırken hata:', error);
        // Hata durumunda boş dizi dönecek, ana fonksiyonda loglanır
    }
    return recommendations;
}

/**
 * Yavaş hareket eden stokları bulur ve öneri oluşturur.
 */
async function findSlowMovingRecommendations() {
    const recommendations = [];
    const slowMovementThresholdDays = 30; // Test için 30 güne düşürüldü
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - slowMovementThresholdDays);
    console.log(`DSS Service: Yavaş stok kontrolü başlıyor (Eşik Tarihi: ${cutoffDate.toISOString()})...`);

    try {
        const products = await Product.findAll({ attributes: ['id', 'name'] });
        console.log(`Toplam ${products.length} ürün kontrol edilecek.`);

        for (const product of products) {
            // *** Debug Log: Ürün kontrolü başlangıcı ***
            // console.log(`--- Kontrol ediliyor: ${product.name} (ID: ${product.id}) ---`);
            const lastMovement = await StockMovement.findOne({
                where: { productId: product.id },
                order: [['movementDate', 'DESC']], // En son hareketi al
                attributes: ['movementDate']
            });

            const lastMovementDate = lastMovement?.movementDate;
            // *** Debug Log: Son hareket tarihi ***
            // console.log(`   Son Hareket Tarihi: ${lastMovementDate ? lastMovementDate.toISOString() : 'Bulunamadı'}`);
            // console.log(`   Kesim Tarihi: ${cutoffDate.toISOString()}`);

            if (!lastMovementDate || new Date(lastMovementDate) < cutoffDate) {
                // *** Debug Log: Yavaş ürün bulundu ***
                // console.log(`   >>> Yavaş olarak işaretlendi!`);
                let daysSinceMovement = 'Bilinmiyor';
                if (lastMovementDate) {
                    const diffTime = Math.abs(new Date() - new Date(lastMovementDate));
                    daysSinceMovement = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                } else {
                    // Eğer hiç hareket yoksa, ürünün oluşturulma tarihine bakılabilir?
                    // Veya direkt "Hiç hareket yok" denebilir.
                    daysSinceMovement = "Hiç"; 
                }
                
                console.log(`Yavaş ürün bulundu: ${product.name} (Son Hareket: ${lastMovementDate ? lastMovementDate.toISOString() : 'Yok'})`);
                recommendations.push({
                    type: 'slow_moving',
                    product_id: product.id,
                    product_name: product.name,
                    last_movement_date: lastMovementDate,
                    days_since_movement: daysSinceMovement,
                    suggestion: `Ürün (${product.name}) ${daysSinceMovement} gündür hareket görmedi. İndirim, promosyon veya stok eritme yöntemleri değerlendirilmesi önerilir.`
                });
            }
        }
        console.log(`Toplam ${recommendations.length} adet yavaş hareket eden ürün önerisi bulundu.`);

    } catch (error) {
        console.error('Yavaş stok önerileri alınırken hata:', error);
    }   
    return recommendations;
}

/**
 * Tüm önerileri veya belirtilen tipteki önerileri toplayan ana fonksiyon.
 * @param {string} [requestedType] - İstenen öneri tipi (low_stock, utilization, slow_moving). Belirtilmezse tümü alınır.
 */
async function getRecommendations(requestedType) {
    console.log(`DSS Service: getRecommendations çağrıldı. İstenen tip: ${requestedType || 'Tümü'}`);
    let allRecommendations = [];

    try {
        // İstenen tipe göre ilgili fonksiyonları çağır
        if (!requestedType || requestedType === 'low_stock') {
            const lowStockRecs = await findLowStockRecommendations();
            allRecommendations = allRecommendations.concat(lowStockRecs);
            console.log(`Düşük stok kontrolü tamamlandı. ${lowStockRecs.length} öneri eklendi.`);
        }
        
        if (!requestedType || requestedType === 'utilization') {
            const utilizationRecs = await findUtilizationRecommendations();
            allRecommendations = allRecommendations.concat(utilizationRecs);
            console.log(`Depo kullanımı kontrolü tamamlandı. ${utilizationRecs.length} öneri eklendi.`);
        }
        
        if (!requestedType || requestedType === 'slow_moving') {
            const slowMovingRecs = await findSlowMovingRecommendations();
            allRecommendations = allRecommendations.concat(slowMovingRecs);
             console.log(`Yavaş stok kontrolü tamamlandı. ${slowMovingRecs.length} öneri eklendi.`);
        }
        
        // Gelecekte başka tipler eklenirse buraya if blokları eklenebilir

        console.log(`Toplam ${allRecommendations.length} öneri bulundu (İstenen tip: ${requestedType || 'Tümü'}).`);
        return allRecommendations;

    } catch (error) {
        console.error('Ana öneri alma fonksiyonunda hata:', error);
        throw new Error('Öneriler getirilirken bir sunucu hatası oluştu.');
    }
}

module.exports = {
    getRecommendations,
    // İleride belirli öneri tipleri için ayrı fonksiyonlar da export edilebilir
    // findLowStockRecommendations,
    // findUtilizationRecommendations,
    // findSlowMovingRecommendations
}; 