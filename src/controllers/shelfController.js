const { Shelf, Cell, CellProduct, Product } = require('../models');
const db = require('../models');

const shelfController = {
    // Tüm rafları ve içindeki ürünleri getir
    getShelves: async (req, res) => {
        try {
            const shelves = await Shelf.findAll({
                include: [{
                    model: Cell,
                    as: 'cells',
                    include: [{
                        model: CellProduct,
                        as: 'products',
                        include: [{
                            model: Product,
                            as: 'product',
                            attributes: ['id', 'name', 'sku', 'width', 'height', 'length', 'weight', 'sizeCategory']
                        }]
                    }]
                }],
                order: [
                    ['position', 'ASC'],
                    [{ model: Cell, as: 'cells' }, 'position', 'ASC']
                ]
            });

            // Veriyi düzenle
            const formattedShelves = shelves.map(shelf => {
                const plainShelf = shelf.get({ plain: true });
                plainShelf.cells = plainShelf.cells.map(cell => {
                    cell.products = cell.products.map(cellProduct => {
                        const product = cellProduct.product;
                        return {
                            ...product,
                            locationId: cellProduct.id, // CellProduct ID'sini locationId olarak kullan
                            CellProduct: {
                                id: cellProduct.id,
                                cellId: cellProduct.cellId,
                                productId: cellProduct.productId,
                                quantity: cellProduct.quantity,
                                position: cellProduct.position
                            }
                        };
                    });
                    return cell;
                });
                return plainShelf;
            });

            res.json({
                success: true,
                data: formattedShelves
            });
        } catch (error) {
            console.error('Get shelves error:', error);
            res.status(500).json({
                success: false,
                message: 'Raflar yüklenirken bir hata oluştu'
            });
        }
    },

    // Ürünü rafa yerleştir
    placeProduct: async (req, res) => {
        try {
            const { cellId, productId, quantity, position } = req.body;

            console.log('Place product request:', { cellId, productId, quantity, position });

            // Hücreyi kontrol et
            const cell = await Cell.findByPk(cellId, {
                include: [{
                    model: CellProduct,
                    as: 'products',
                    include: [{
                        model: Product,
                        as: 'product'
                    }]
                }]
            });

            if (!cell) {
                return res.status(404).json({
                    success: false,
                    message: 'Hücre bulunamadı'
                });
            }

            // Ürünü kontrol et
            const product = await Product.findByPk(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Ürün bulunamadı'
                });
            }

            // Ürün boyutuna göre kapasiteyi kontrol et
            let requiredCapacity;
            switch (product.sizeCategory) {
                case 'Büyük':
                    requiredCapacity = 4;
                    break;
                case 'Normal':
                    requiredCapacity = 2;
                    break;
                case 'Küçük':
                    requiredCapacity = 1;
                    break;
                default:
                    requiredCapacity = 1;
            }

            console.log(`Ürün boyutu: ${product.sizeCategory}, Gerekli kapasite: ${requiredCapacity}`);
            console.log(`Hücre mevcut kapasitesi: ${cell.availableCapacity}`);

            // Toplam gerekli kapasiteyi hesapla
            const totalRequiredCapacity = requiredCapacity * quantity;

            // Hücrede yeterli kapasite var mı kontrol et
            if (cell.availableCapacity < totalRequiredCapacity) {
                return res.status(400).json({
                    success: false,
                    message: `Hücrede yeterli kapasite yok. Gerekli: ${totalRequiredCapacity}, Mevcut: ${cell.availableCapacity}`
                });
            }

            // Ürünü yerleştir
            const cellProduct = await CellProduct.create({
                cellId,
                productId,
                quantity,
                position
            });

            // Hücre kapasitesini güncelle
            const newAvailableCapacity = cell.availableCapacity - totalRequiredCapacity;
            console.log(`Yeni mevcut kapasite: ${newAvailableCapacity}`);
            
            await cell.update({
                availableCapacity: newAvailableCapacity
            });

            // Güncellenmiş cell product bilgisini al
            const updatedCellProduct = await CellProduct.findByPk(cellProduct.id, {
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'name', 'sku', 'width', 'height', 'length', 'weight', 'sizeCategory']
                }]
            });

            res.json({
                success: true,
                message: 'Ürün başarıyla yerleştirildi',
                data: {
                    cellProduct: updatedCellProduct,
                    cell: {
                        id: cell.id,
                        availableCapacity: newAvailableCapacity
                    }
                }
            });

        } catch (error) {
            console.error('Place product error:', error);
            res.status(500).json({
                success: false,
                message: 'Ürün yerleştirilirken bir hata oluştu'
            });
        }
    },

    // Ürünü raftan kaldır
    removeProduct: async (req, res) => {
        try {
            const { cellProductId } = req.params;
            console.log('Removing product with cellProductId:', cellProductId);

            // Önce CellProduct modelinde arayalım
            let cellProduct = await CellProduct.findByPk(cellProductId, {
                include: [{
                    model: Product,
                    as: 'product'
                }]
            });

            // CellProduct bulunamadıysa, Location modelinde arayalım
            if (!cellProduct) {
                console.log('CellProduct not found, searching in Location model');
                const location = await db.Location.findByPk(cellProductId, {
                    attributes: [
                        'id', 'code', 'rackNumber', 'level', 'position',
                        'isOccupied', 'productId'
                    ],
                    include: [{
                        model: db.Product,
                        as: 'Product'
                    }]
                });

                if (!location) {
                    console.log('Location not found either');
                    return res.status(404).json({
                        success: false,
                        message: 'Ürün bulunamadı'
                    });
                }

                console.log('Location found:', location.id);

                // Location'ı güncelle
                await location.update({
                    isOccupied: false,
                    productId: null
                });

                // İlişkili ürünü güncelle
                if (location.Product) {
                    await location.Product.update({
                        locationId: null
                    });
                }

                return res.json({
                    success: true,
                    message: 'Ürün başarıyla kaldırıldı'
                });
            }

            // Normal CellProduct işleme yolu
            const cell = await Cell.findByPk(cellProduct.cellId);
            
            if (!cell) {
                console.log('Cell not found for CellProduct:', cellProductId);
                return res.status(404).json({
                    success: false,
                    message: 'Hücre bulunamadı'
                });
            }

            // Ürün boyutuna göre kapasiteyi hesapla
            let capacityToRestore;
            const sizeCategory = cellProduct.product?.sizeCategory || 'Küçük';
            
            switch (sizeCategory) {
                case 'Büyük':
                    capacityToRestore = 4;
                    break;
                case 'Normal':
                    capacityToRestore = 2;
                    break;
                case 'Küçük':
                    capacityToRestore = 1;
                    break;
                default:
                    capacityToRestore = 1;
            }

            console.log(`Ürün boyutu: ${sizeCategory}, İade edilecek kapasite: ${capacityToRestore}`);
            console.log(`Hücre mevcut kapasitesi: ${cell.availableCapacity}`);

            // Toplam iade edilecek kapasiteyi hesapla
            const totalCapacityToRestore = capacityToRestore * cellProduct.quantity;

            // Hücre kapasitesini güncelle
            const newAvailableCapacity = cell.availableCapacity + totalCapacityToRestore;
            console.log(`Yeni mevcut kapasite: ${newAvailableCapacity}`);
            
            await cell.update({
                availableCapacity: newAvailableCapacity
            });

            // Ürünü kaldır
            await cellProduct.destroy();

            res.json({
                success: true,
                message: 'Ürün başarıyla kaldırıldı',
                data: {
                    cellId: cell.id,
                    availableCapacity: newAvailableCapacity
                }
            });

        } catch (error) {
            console.error('Remove product error:', error);
            res.status(500).json({
                success: false,
                message: 'Ürün kaldırılırken bir hata oluştu'
            });
        }
    }
};

module.exports = shelfController; 