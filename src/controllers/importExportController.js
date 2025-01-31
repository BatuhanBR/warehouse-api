const ExcelJS = require('exceljs');
const Product = require('../models/product');
const StockMovement = require('../models/stockMovement');
const logger = require('../config/logger');
const { Op } = require('sequelize');

const importExportController = {
    // Ürünleri Excel'den import et
    importProducts: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Lütfen bir dosya yükleyin'
                });
            }

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(req.file.path);
            const worksheet = workbook.getWorksheet(1);
            
            const products = [];
            const errors = [];

            // Excel'i parse et
            worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                if (rowNumber === 1) return; // Başlık satırını atla

                const product = {
                    name: row.getCell(1).value,
                    sku: row.getCell(2).value,
                    price: parseFloat(row.getCell(3).value),
                    quantity: parseInt(row.getCell(4).value),
                    description: row.getCell(5).value,
                    categoryId: parseInt(row.getCell(6).value),
                    minStockLevel: parseInt(row.getCell(7).value)
                };

                // Validation
                if (!product.name || !product.sku || isNaN(product.price) || isNaN(product.quantity)) {
                    errors.push(`Satır ${rowNumber}: Eksik veya hatalı veri`);
                } else {
                    products.push({
                        ...product,
                        createdBy: req.user.id,
                        updatedBy: req.user.id
                    });
                }
            });

            if (products.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Geçerli ürün bulunamadı',
                    errors
                });
            }

            // Bulk insert
            const createdProducts = await Product.bulkCreate(products);

            logger.info('Products imported', {
                count: createdProducts.length,
                userId: req.user.id
            });

            res.json({
                success: true,
                message: `${createdProducts.length} ürün başarıyla import edildi`,
                errors: errors.length > 0 ? errors : undefined
            });
        } catch (error) {
            logger.error('Import failed', {
                error: error.message,
                userId: req.user.id
            });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Ürünleri Excel olarak export et
    exportProducts: async (req, res) => {
        try {
            const products = await Product.findAll({
                attributes: ['name', 'sku', 'price', 'quantity', 'description', 'minStockLevel']
            });

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Products');

            // Başlıkları ayarla
            worksheet.columns = [
                { header: 'Ürün Adı', key: 'name', width: 30 },
                { header: 'SKU', key: 'sku', width: 15 },
                { header: 'Fiyat', key: 'price', width: 15 },
                { header: 'Miktar', key: 'quantity', width: 15 },
                { header: 'Açıklama', key: 'description', width: 40 },
                { header: 'Min. Stok', key: 'minStockLevel', width: 15 }
            ];

            // Stil ayarları
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };

            // Verileri ekle
            worksheet.addRows(products);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');

            await workbook.xlsx.write(res);

            logger.info('Products exported', {
                count: products.length,
                userId: req.user.id
            });
        } catch (error) {
            logger.error('Export failed', {
                error: error.message,
                userId: req.user.id
            });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Stok hareketlerini export et
    exportStockMovements: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            
            const whereClause = {};
            if (startDate && endDate) {
                whereClause.createdAt = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }

            const movements = await StockMovement.findAll({
                where: whereClause,
                include: [{
                    model: Product,
                    attributes: ['name', 'sku']
                }],
                order: [['createdAt', 'DESC']]
            });

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Stock Movements');

            // Başlıkları ayarla
            worksheet.columns = [
                { header: 'Tarih', key: 'date', width: 20 },
                { header: 'Ürün', key: 'product', width: 30 },
                { header: 'SKU', key: 'sku', width: 15 },
                { header: 'Hareket Tipi', key: 'type', width: 15 },
                { header: 'Miktar', key: 'quantity', width: 15 },
                { header: 'Açıklama', key: 'description', width: 40 }
            ];

            // Stil ayarları
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };

            // Verileri ekle
            movements.forEach(m => {
                worksheet.addRow({
                    date: m.createdAt.toLocaleDateString(),
                    product: m.Product.name,
                    sku: m.Product.sku,
                    type: m.type,
                    quantity: m.quantity,
                    description: m.description
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=stock-movements.xlsx');

            await workbook.xlsx.write(res);

            logger.info('Stock movements exported', {
                count: movements.length,
                userId: req.user.id
            });
        } catch (error) {
            logger.error('Stock movements export failed', {
                error: error.message,
                userId: req.user.id
            });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Envanter raporu export et
    exportInventoryReport: async (req, res) => {
        try {
            const products = await Product.findAll({
                include: [{
                    model: Category,
                    attributes: ['name']
                }],
                order: [['quantity', 'DESC']]
            });

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Inventory Report');

            // Başlıkları ayarla
            worksheet.columns = [
                { header: 'Ürün Adı', key: 'name', width: 30 },
                { header: 'SKU', key: 'sku', width: 15 },
                { header: 'Kategori', key: 'category', width: 20 },
                { header: 'Stok Miktarı', key: 'quantity', width: 15 },
                { header: 'Birim Fiyat', key: 'price', width: 15 },
                { header: 'Toplam Değer', key: 'totalValue', width: 15 },
                { header: 'Min. Stok', key: 'minStock', width: 15 },
                { header: 'Durum', key: 'status', width: 15 }
            ];

            // Stil ayarları
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };

            // Verileri ekle
            products.forEach(p => {
                const row = worksheet.addRow({
                    name: p.name,
                    sku: p.sku,
                    category: p.Category?.name || 'Belirtilmemiş',
                    quantity: p.quantity,
                    price: p.price,
                    totalValue: p.price * p.quantity,
                    minStock: p.minStockLevel,
                    status: p.quantity <= p.minStockLevel ? 'Kritik' : 'Normal'
                });

                // Kritik stok için kırmızı renk
                if (p.quantity <= p.minStockLevel) {
                    row.getCell('status').fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFF0000' }
                    };
                }
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.xlsx');

            await workbook.xlsx.write(res);

            logger.info('Inventory report exported', {
                count: products.length,
                userId: req.user.id
            });
        } catch (error) {
            logger.error('Inventory report export failed', {
                error: error.message,
                userId: req.user.id
            });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = importExportController; 