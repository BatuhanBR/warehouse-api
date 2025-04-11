'use strict';
const { faker } = require('@faker-js/faker'); // Rastgele veri için faker kütüphanesi

// Rastgele gider tipleri
const expenseTypes = ['salary', 'utility', 'office'];

module.exports = {
  async up (queryInterface, Sequelize) {
    const expenses = [];
    const numberOfExpenses = 30; // Oluşturulacak gider sayısı

    for (let i = 0; i < numberOfExpenses; i++) {
      const randomType = expenseTypes[Math.floor(Math.random() * expenseTypes.length)];
      const amount = faker.finance.amount(500, 15000, 2); // 500 ile 15000 arasında rastgele tutar (2 ondalık)
      
      // Geçmiş 1 yıl içinde rastgele bir başlangıç tarihi
      const startDate = faker.date.between({ from: '2023-04-01T00:00:00.000Z', to: new Date() });
      
      // Bitiş tarihi (başlangıçtan 1 ay sonrası gibi)
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + 1);

      let description = '';
      if (randomType === 'salary') {
        description = `${faker.person.jobTitle()} Maaş Ödemesi - ${startDate.toLocaleString('tr-TR', { month: 'long' })}`;
      } else if (randomType === 'utility') {
        description = `${faker.company.name()} ${faker.helpers.arrayElement(['Elektrik', 'Su', 'Doğalgaz', 'İnternet'])} Faturası`;
      } else {
        description = `Ofis ${faker.commerce.productName()} Alımı`;
      }

      expenses.push({
        expenseType: randomType,
        expenseAmount: parseFloat(amount),
        expenseDescription: description,
        expenseStartTime: startDate,
        expenseEndTime: endDate,
        // userId alanı gerekliyse buraya eklenmeli, örneğin admin kullanıcısının id'si
        // userId: 1, 
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    try {
      await queryInterface.bulkInsert('Expenses', expenses, {});
      console.log(`Successfully seeded ${expenses.length} expenses.`);
    } catch (error) {
       console.error(`Error seeding expenses: ${error}`);
       // Eğer unique constraint gibi hatalar alırsanız, burayı loglayın.
       if (error.errors) {
         error.errors.forEach(err => console.error(`Validation Error: ${err.message}, Path: ${err.path}, Value: ${err.value}`));
       }
       throw error; // Hatanın devam etmesini sağla ki işlem başarısız sayılsın
    }
  },

  async down (queryInterface, Sequelize) {
    // Geri alma işlemi: Eklenen tüm giderleri silebiliriz
    // Veya belirli bir kritere göre silebiliriz (örneğin açıklama ile)
    try {
       // Dikkatli olun: Bu, Expenses tablosundaki TÜM verileri siler!
       // await queryInterface.bulkDelete('Expenses', null, {}); 
       
       // Veya sadece bu seeder ile eklenenleri silmek için bir kriter belirleyin.
       // Örneğin, 'Maaş Ödemesi' içerenleri silmek (güvenli değil):
       await queryInterface.bulkDelete('Expenses', {
         expenseDescription: {
           [Sequelize.Op.like]: '%Maaş Ödemesi%' 
         }
       }, {});
       await queryInterface.bulkDelete('Expenses', {
         expenseDescription: {
           [Sequelize.Op.like]: '%Faturası%' 
         }
       }, {});
       await queryInterface.bulkDelete('Expenses', {
         expenseDescription: {
           [Sequelize.Op.like]: '%Ofis % Alımı%' 
         }
       }, {});
       console.log('Attempted to remove seeded expenses.');
    } catch (error) {
       console.error(`Error removing seeded expenses: ${error}`);
       throw error;
    }
  }
};