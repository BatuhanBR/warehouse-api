const { Product, Location, Category } = require('../models');
const logger = require('../config/logger');
const db = require('../models');

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

    // 3D görünüm için lokasyon verilerini getir (Kategori bilgisi ile)
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
                    attributes: ['id', 'name', 'quantity', 'position3D', 'palletType', 'categoryId'],
                    include: [{
                        model: Category,
                        as: 'Category',
                        attributes: ['id', 'name']
                    }]
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
    },

    getLocations: async (req, res) => {
        try {
            console.log('getLocations çağrıldı');  // Debug log
            const locations = await Location.findAll({
                attributes: ['id', 'code', 'rackNumber', 'level', 'position']
            });

            console.log('Bulunan lokasyonlar:', locations); // Debug log

            res.json({
                success: true,
                data: locations
            });
        } catch (error) {
            console.error('Get locations error:', error);
            res.status(500).json({
                success: false,
                message: 'Lokasyonlar yüklenirken bir hata oluştu'
            });
        }
    },

    // Belirli bir rafın lokasyonlarını getir (YENİ FORMAT)
    getRackLocations: async (req, res) => {
        try {
            const { rackNumber } = req.params;
            console.log('Requested rack number:', rackNumber);

            // 1. Raftaki tüm lokasyonları çek (Sadece gerekli ve var olan sütunları seç)
            const locations = await Location.findAll({
                where: { 
                    rackNumber: parseInt(rackNumber)
                },
                attributes: [
                    'id', 'code', 'rackNumber', 'level', 'position', 
                    'isOccupied', 'productId', // productId'yi yine de siliyoruz ama sorgu için kalabilir
                    'width', 'height', 'depth', // Bunlar modelde var gibi, kontrol edilebilir
                    'createdAt', 'updatedAt' // Bunlar genelde olur
                 ], // Sadece var olan ve gerekli sütunları belirt
                order: [
                    ['level', 'ASC'],
                    ['position', 'ASC']
                ]
            });

            if (!locations || locations.length === 0) {
                return res.json({ success: true, data: [] }); // Boş rafsa boş dizi dön
            }

            // 2. Lokasyon ID'lerini al
            const locationIds = locations.map(loc => loc.id);

            // 3. Bu lokasyonlara ait tüm ürünleri çek (Kategori bilgisiyle birlikte)
            const productsInLocations = await Product.findAll({
                where: {
                    locationId: locationIds
                },
                attributes: [ // Üründen sadece gerekli alanları seçelim
                    'id', 'name', 'sku', 'quantity', 'weight', 
                    'palletType', 'weightCategory', // Yeni eklenen alanlar
                    'description', 'price', 'minStockLevel', 'maxStockLevel', // Diğer potansiyel alanlar
                    'company', 'storageStartDate', 'expectedStorageDuration', 
                    'createdAt', 'updatedAt', 'locationId', 'categoryId' // İlişkiler için ID'ler
                ],
                include: [{
                    model: Category, // İlişkili kategoriyi de al
                    as: 'Category', // Modeldeki alias'a göre
                    attributes: ['id', 'name'] // Sadece gerekli alanları al
                }]
                // Gerekirse diğer product alanlarını attributes ile seçebiliriz --> Zaten yukarıda seçtik
            });

            // 4. Ürünleri lokasyon ID'sine göre grupla
            const productsByLocationId = productsInLocations.reduce((acc, product) => {
                const locId = product.locationId;
                if (!acc[locId]) {
                    acc[locId] = [];
                }
                acc[locId].push(product.get({ plain: true })); // Plain object olarak al
                return acc;
            }, {});

            // 5. Lokasyonları formatla (pallets dizisini ekle ve kapasiteyi HESAPLA)
            const formattedLocations = locations.map(location => {
                const productsInThisLocation = productsByLocationId[location.id] || [];
                const locationPlain = location.get({ plain: true }); // Plain object

                // Kapasiteyi hesapla
                let calculatedUsedCapacity = 0;
                productsInThisLocation.forEach(product => {
                    if (product.palletType === 'half') {
                        calculatedUsedCapacity += 1;
                    } else if (product.palletType === 'full') {
                        calculatedUsedCapacity += 2;
                    } else {
                        // Palet tipi tanımsızsa veya farklıysa varsayılan olarak 1 kabul edelim?
                        // Veya loglayıp 0 kabul edelim?
                        logger.warn(`Product ID ${product.id} in Location ID ${location.id} has unknown or missing palletType: ${product.palletType}`);
                        calculatedUsedCapacity += 1; // Şimdilik 1 varsayalım
                    }
                });

                // totalCapacity'yi modelden veya varsayılan olarak al
                const totalCapacity = locationPlain.totalCapacity || 2; // Modelde totalCapacity alanı var mı kontrol et, yoksa 2 varsay
                
                // Hesaplanan kapasitenin totalCapacity'yi geçmediğinden emin ol
                calculatedUsedCapacity = Math.min(calculatedUsedCapacity, totalCapacity); 

                const calculatedAvailableCapacity = totalCapacity - calculatedUsedCapacity;
                const calculatedIsOccupied = calculatedUsedCapacity > 0;

                // Location objesini güncelle/oluştur
                return {
                    ...locationPlain, // Modelden gelen diğer tüm alanlar
                    totalCapacity: totalCapacity, // Total kapasiteyi de ekleyelim
                    usedCapacity: calculatedUsedCapacity, // Hesaplanan değeri kullan
                    availableCapacity: calculatedAvailableCapacity, // Hesaplanan değeri kullan
                    isOccupied: calculatedIsOccupied, // Hesaplanan değeri kullan
                    pallets: productsInThisLocation.map(p => ({ // products yerine pallets dizisi oluşturalım
                        id: p.id, // Palet ID'si yok, ürün ID'si?
                        productId: p.id,
                        product: p // Tüm ürün bilgisini iç içe ekleyelim
                    }))
                    // productId alanını artık dışarı vermeyelim
                    // productId: undefined 
                };
            });
            
            console.log('Formatted locations with calculated capacity:', formattedLocations.length); // Sadece sayıyı logla
            // Detaylı loglama için: console.log(JSON.stringify(formattedLocations, null, 2));
            
            res.json({ success: true, data: formattedLocations });

        } catch (error) {
             console.error('Error fetching rack locations:', error);
             res.status(500).json({ success: false, message: 'Raf lokasyonları alınırken sunucu hatası oluştu.' });
        }
    },

    // Tüm rafları getir (benzersiz raf numaralarını)
    getRacks: async (req, res) => {
        try {
            console.log('Getting racks from Locations table');
            
            // Locations tablosundan benzersiz raf numaralarını getir
            const racks = await db.sequelize.query(`
                SELECT 
                    "rackNumber",
                    COUNT(*) as "totalCells",
                    SUM(CASE WHEN "isOccupied" = true THEN 1 ELSE 0 END) as "occupiedCells",
                    MIN("code") as "rackCode"
                FROM "Locations"
                GROUP BY "rackNumber"
                ORDER BY "rackNumber" ASC
            `, { type: db.sequelize.QueryTypes.SELECT });
            
            console.log(`Retrieved ${racks.length} racks`);
            
            // Her raf için id oluştur (frontend'in beklediği formata uygun olması için)
            const formattedRacks = racks.map((rack, index) => ({
                id: index + 1,
                position: rack.rackNumber,
                name: `Raf ${rack.rackNumber}`,
                totalCells: parseInt(rack.totalCells),
                occupiedCells: parseInt(rack.occupiedCells),
                availableCells: parseInt(rack.totalCells) - parseInt(rack.occupiedCells),
                rackCode: rack.rackCode
            }));

            res.json({
                success: true,
                data: formattedRacks
            });
        } catch (error) {
            console.error('Get racks error:', error);
            res.status(500).json({
                success: false,
                message: 'Raflar yüklenirken bir hata oluştu'
            });
        }
    },

    // Belirli bir rafın hücrelerini getir (Kapasite bilgisi ve ÜRÜN DETAYLARI ile)
    getRackCells: async (req, res) => {
        try {
            const { rackNumber } = req.params;
            console.log(`Getting cells for rack ${rackNumber} from Locations table`);
            
            const cells = await Location.findAll({
                where: { rackNumber: parseInt(rackNumber) },
                attributes: [
                    'id', 'code', 'rackNumber', 'level', 'position',
                    'width', 'height', 'depth',
                    'createdAt', 'updatedAt'
                ],
                order: [
                    ['level', 'ASC'],
                    ['position', 'ASC']
                ]
            });
            
            if (!cells || cells.length === 0) {
                return res.json({ success: true, data: [] });
            }

            const cellIds = cells.map(cell => cell.id);

            const productsInCells = await Product.findAll({
                where: { locationId: cellIds },
                attributes: ['id', 'name', 'sku', 'locationId', 'palletType']
            });

            const productsByLocationId = productsInCells.reduce((acc, product) => {
                const locId = product.locationId;
                if (!acc[locId]) acc[locId] = [];
                acc[locId].push(product.get({ plain: true })); 
                return acc;
            }, {});

            // 5. Hücreleri formatla (Kapasite ve Palet/Ürün bilgisi ile)
            const formattedCells = cells.map(cell => {
                const plainCell = cell.get({ plain: true });
                const products = productsByLocationId[plainCell.id] || [];
                
                // Kapasiteyi hesapla ve logla
                let calculatedUsedCapacity = 0;
                console.log(`[CapacityCalc] Processing Cell ID: ${plainCell.id}, Code: ${plainCell.code}`); // Hücre log
                products.forEach(product => {
                    const currentPalletType = product.palletType?.trim().toLowerCase(); // Küçük harfe çevir ve boşlukları temizle
                    let capacityToAdd = 0;
                    
                    if (currentPalletType === 'half') {
                        capacityToAdd = 1;
                    } else if (currentPalletType === 'full') {
                        capacityToAdd = 2;
                    } else {
                        logger.warn(`Product ID ${product.id} in Location ID ${plainCell.id} has unknown or missing palletType: '${product.palletType}'. Assuming capacity 1.`);
                        capacityToAdd = 1; // Varsayılan
                    }
                    calculatedUsedCapacity += capacityToAdd;
                    // Detaylı ürün log
                    console.log(`  -> Product ID: ${product.id}, RawPalletType: '${product.palletType}', ProcessedType: '${currentPalletType}', CapacityAdded: ${capacityToAdd}`); 
                });

                const totalCapacity = 2; 
                const originalCalculated = calculatedUsedCapacity;
                calculatedUsedCapacity = Math.min(calculatedUsedCapacity, totalCapacity);
                const calculatedAvailableCapacity = totalCapacity - calculatedUsedCapacity;
                const calculatedIsOccupied = calculatedUsedCapacity > 0;
                
                // Hesaplama sonucu log
                console.log(`[CapacityCalc] Cell ID: ${plainCell.id} - Total Calc Before Limit: ${originalCalculated}, Final Used: ${calculatedUsedCapacity}, Available: ${calculatedAvailableCapacity}, isOccupied: ${calculatedIsOccupied}`);

                // Sonuç objesini oluştur
                return {
                    ...plainCell, 
                    totalCapacity: totalCapacity,
                    usedCapacity: calculatedUsedCapacity,       
                    availableCapacity: calculatedAvailableCapacity, 
                    isOccupied: calculatedIsOccupied,         
                    pallets: products.map(p => ({ 
                        id: p.id,
                        productId: p.id,
                        product: p
                    }))
                };
            });

            res.json({ success: true, data: formattedCells });
        } catch (error) {
            console.error('Get rack cells error:', error);
             logger.error('Error fetching rack cells', { 
                 error: error.message,
                 rackNumber: req.params.rackNumber,
                 userId: req.user?.id
             });
            res.status(500).json({
                success: false,
                message: 'Raf hücreleri yüklenirken bir hata oluştu'
            });
        }
    },

    // Konum kodu ile lokasyonu getir
    getLocationByCode: async (req, res) => {
        try {
            const { code } = req.params;
            
            const location = await Location.findOne({
                where: { code },
                attributes: ['id', 'code', 'rackNumber', 'level', 'position', 'isOccupied', 'productId', 'width', 'height', 'depth', 'createdAt', 'updatedAt'],
                include: [{
                    model: Product,
                    as: 'Product',
                    required: false
                }]
            });

            if (!location) {
                return res.status(404).json({
                    success: false,
                    message: 'Lokasyon bulunamadı'
                });
            }

            // Lokasyon verisini düzenle
            const plainLocation = location.get({ plain: true });
            if (plainLocation.Product && plainLocation.Product.id) {
                plainLocation.isOccupied = true;
            } else {
                plainLocation.isOccupied = false;
                plainLocation.Product = null;
            }

            res.json({
                success: true,
                data: plainLocation
            });
        } catch (error) {
            console.error('Lokasyon getirme hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Lokasyon alınırken bir hata oluştu'
            });
        }
    },

    // Lokasyon güncelleme (ürün ekleme/çıkarma)
    updateLocation: async (req, res) => {
        const transaction = await db.sequelize.transaction();
        
        try {
            const { code, productId, isOccupied } = req.body;
            
            // Lokasyonu bul - sadece mevcut kolonları seç
            const location = await Location.findOne({
                where: { code },
                attributes: ['id', 'code', 'rackNumber', 'level', 'position', 'isOccupied', 'productId', 'width', 'height', 'depth', 'createdAt', 'updatedAt'],
                transaction
            });

            if (!location) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Lokasyon bulunamadı'
                });
            }

            // Eğer ürün eklenmek isteniyorsa
            if (isOccupied && productId) {
                // Ürünü bul
                const product = await Product.findByPk(productId, { transaction });
                
                if (!product) {
                    await transaction.rollback();
                    return res.status(404).json({
                        success: false,
                        message: 'Ürün bulunamadı'
                    });
                }

                // Eğer lokasyonda başka bir ürün varsa
                if (location.isOccupied && location.productId && location.productId !== productId) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: 'Bu lokasyonda başka bir ürün bulunuyor'
                    });
                }

                // Lokasyonu güncelle
                await location.update({
                    productId,
                    isOccupied: true
                }, { transaction });
                
                // Ürünü güncelle (lokasyon bilgisi ekle)
                await product.update({
                    locationId: location.id
                }, { transaction });
            } 
            // Ürün çıkarılmak isteniyorsa
            else {
                // Eğer lokasyonda bir ürün varsa
                if (location.productId) {
                    // Ürünü bul
                    const product = await Product.findByPk(location.productId, { transaction });
                    
                    if (product) {
                        // Ürünün lokasyon bağlantısını kaldır
                        await product.update({
                            locationId: null
                        }, { transaction });
                    }
                }
                
                // Lokasyonu güncelle
                await location.update({
                    productId: null,
                    isOccupied: false
                }, { transaction });
            }

            await transaction.commit();
            
            // Güncellenmiş lokasyonu getir - sadece mevcut kolonları seç
            const updatedLocation = await Location.findByPk(location.id, {
                attributes: ['id', 'code', 'rackNumber', 'level', 'position', 'isOccupied', 'productId', 'width', 'height', 'depth', 'createdAt', 'updatedAt'],
                include: [{
                    model: Product,
                    as: 'Product',
                    required: false
                }]
            });
            
            res.json({
                success: true,
                message: isOccupied ? 'Ürün başarıyla yerleştirildi' : 'Ürün başarıyla kaldırıldı',
                data: updatedLocation
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Lokasyon güncelleme hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Lokasyon güncellenirken bir hata oluştu'
            });
        }
    }
};

const calculateStorageUsage = async () => {
    try {
        const locations = await Location.findAll({
            attributes: ['id', 'width', 'height', 'depth']
        });

        const products = await Product.findAll({
            attributes: ['width', 'height', 'length', 'quantity', 'locationId']
        });

        // Toplam raf hacmi
        const totalCapacity = locations.reduce((sum, loc) => 
            sum + (loc.width * loc.height * loc.depth), 0);

        // Kullanılan hacim
        const usedCapacity = products.reduce((sum, prod) => 
            sum + (prod.width * prod.height * prod.length * prod.quantity), 0);

        return {
            totalCapacity,
            usedCapacity,
            usagePercentage: (usedCapacity / totalCapacity) * 100
        };
    } catch (error) {
        console.error('Storage usage calculation error:', error);
        throw error;
    }
};

module.exports = locationController; 