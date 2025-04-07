const db = require('../models');
const Expense = db.Expense;
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Tüm giderleri getir
exports.getAllExpenses = async (req, res) => {
  try {
    const { startDate, endDate, expenseType, search } = req.query;
    
    console.log('Search query params:', { startDate, endDate, expenseType, search });
    
    let whereClause = {};
    
    // Tarih filtresi
    if (startDate && endDate) {
      whereClause.expenseStartTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    // Kategori filtresi (dropdown ile seçilenler için)
    if (expenseType && expenseType !== 'all' && expenseType !== '') {
      whereClause.expenseType = expenseType;
    }
    
    // Arama filtresi (hem açıklama hem de kategoride arama yap)
    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      
      // Sequelize Op.or kullanarak hem açıklama hem de kategoride arama
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { 
            expenseDescription: {
              [Op.iLike]: `%${searchTerm}%` // Case-insensitive arama
            } 
          },
          { 
            expenseType: {
              [Op.iLike]: `%${searchTerm}%` // Case-insensitive arama
            } 
          }
        ]
      };
    }

    console.log('Final where clause:', JSON.stringify(whereClause, null, 2));
    
    const expenses = await Expense.findAll({
      where: whereClause,
      order: [['expenseStartTime', 'DESC']]
    });

    console.log(`Found ${expenses.length} expenses matching criteria`);

    // Tüm zamanların toplam giderini hesapla
    const allTimeExpense = expenses.reduce((sum, expense) => sum + Number(expense.expenseAmount), 0);
    
    // 2025 ve sonrası için giderleri filtrele
    const currentYearExpenses = expenses.filter(expense => {
      const startDate = new Date(expense.expenseStartTime);
      return startDate.getFullYear() >= 2025;
    });
    
    // 2025 ve sonrası için toplam gideri hesapla
    const totalExpense = currentYearExpenses.reduce((sum, expense) => sum + Number(expense.expenseAmount), 0);
    
    // Yeni hesaplama mantığı - Periyodik dağılıma göre (sadece 2025 ve sonrası için)
    // Yıllık gider: 2025 ve sonrası toplam gider
    const yearlyExpense = totalExpense;
    
    // Aylık gider: Yıllık giderin 1/12'si
    const monthlyExpense = totalExpense / 12;
    
    // Haftalık gider: Aylık giderin 1/4'ü (bir ayda yaklaşık 4 hafta)
    const weeklyExpense = monthlyExpense / 4;

    console.log('Calculated expense summaries with periodic distribution:');
    console.log(`- All Time Total: ${allTimeExpense}`);
    console.log(`- Current Year Total (2025+): ${totalExpense}`);
    console.log(`- Monthly (1/12): ${monthlyExpense}`);
    console.log(`- Weekly (1/48): ${weeklyExpense}`);

    res.json({
      expenses,
      summary: {
        allTimeExpense,
        totalExpense,
        yearlyExpense,
        monthlyExpense,
        weeklyExpense
      }
    });
  } catch (error) {
    console.error('getAllExpenses error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Yeni gider ekle
exports.createExpense = async (req, res) => {
  try {
    const { expenseAmount, expenseType, expenseDescription, expenseStartTime, expenseEndTime } = req.body;
    const expense = await Expense.create({
      expenseAmount,
      expenseType,
      expenseDescription,
      expenseStartTime,
      expenseEndTime
    });
    res.status(201).json(expense);
  } catch (error) {
    console.error('createExpense error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Excel'e aktar
exports.exportToExcel = async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      order: [['expenseStartTime', 'DESC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Giderler');

    worksheet.columns = [
      { header: 'Başlangıç Tarihi', key: 'startDate', width: 15 },
      { header: 'Bitiş Tarihi', key: 'endDate', width: 15 },
      { header: 'Kategori', key: 'type', width: 20 },
      { header: 'Tutar', key: 'amount', width: 15 },
      { header: 'Açıklama', key: 'description', width: 30 }
    ];

    expenses.forEach(expense => {
      worksheet.addRow({
        startDate: expense.expenseStartTime.toLocaleDateString('tr-TR'),
        endDate: expense.expenseEndTime.toLocaleDateString('tr-TR'),
        type: expense.expenseType,
        amount: `${expense.expenseAmount} ₺`,
        description: expense.expenseDescription
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=giderler.xlsx');

    await workbook.xlsx.write(res);
  } catch (error) {
    console.error('exportToExcel error:', error);
    res.status(500).json({ error: error.message });
  }
};

// PDF olarak yazdır
exports.exportToPdf = async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      order: [['expenseStartTime', 'DESC']]
    });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=giderler.pdf');
    doc.pipe(res);

    // Başlık
    doc.fontSize(16).text('Gider Raporu', { align: 'center' });
    doc.moveDown();

    // Tablo başlıkları
    doc.fontSize(12);
    doc.text('Başlangıç Tarihi', 50, doc.y);
    doc.text('Bitiş Tarihi', 150, doc.y - doc.currentLineHeight());
    doc.text('Kategori', 250, doc.y - doc.currentLineHeight());
    doc.text('Tutar', 350, doc.y - doc.currentLineHeight());
    doc.text('Açıklama', 430, doc.y - doc.currentLineHeight());
    doc.moveDown();

    // Gider verileri
    expenses.forEach(expense => {
      doc.text(expense.expenseStartTime.toLocaleDateString('tr-TR'), 50, doc.y);
      doc.text(expense.expenseEndTime.toLocaleDateString('tr-TR'), 150, doc.y - doc.currentLineHeight());
      doc.text(expense.expenseType, 250, doc.y - doc.currentLineHeight());
      doc.text(`${expense.expenseAmount} ₺`, 350, doc.y - doc.currentLineHeight());
      doc.text(expense.expenseDescription || '', 430, doc.y - doc.currentLineHeight());
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error('exportToPdf error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Gider güncelle
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { expenseAmount, expenseType, expenseDescription, expenseStartTime, expenseEndTime } = req.body;
    
    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({ error: 'Gider bulunamadı' });
    }

    await expense.update({
      expenseAmount,
      expenseType,
      expenseDescription,
      expenseStartTime,
      expenseEndTime
    });

    res.json(expense);
  } catch (error) {
    console.error('updateExpense error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Gider sil
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findByPk(id);
    
    if (!expense) {
      return res.status(404).json({ error: 'Gider bulunamadı' });
    }

    await expense.destroy();
    res.json({ message: 'Gider başarıyla silindi' });
  } catch (error) {
    console.error('deleteExpense error:', error);
    res.status(500).json({ error: error.message });
  }
}; 