'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Products', 'palletType', {
      type: Sequelize.STRING,
      allowNull: true, // Veya false, ürün eklerken zorunluysa
      // defaultValue: 'full', // İsteğe bağlı varsayılan değer
    });
    await queryInterface.addColumn('Products', 'weightCategory', {
      type: Sequelize.STRING,
      allowNull: true, // Hesaplanan bir değer olduğu için null olabilir
    });
    // Width, Height, Length sütunlarını kaldırma (isteğe bağlı)
    // Eğer bu sütunlar artık kullanılmayacaksa, burada kaldırılabilirler.
    // await queryInterface.removeColumn('Products', 'width');
    // await queryInterface.removeColumn('Products', 'height');
    // await queryInterface.removeColumn('Products', 'length');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Products', 'palletType');
    await queryInterface.removeColumn('Products', 'weightCategory');
    // Eğer yukarıda kaldırdıysanız, burada geri ekleyebilirsiniz (aynı tiplerle)
    // await queryInterface.addColumn('Products', 'width', { type: Sequelize.FLOAT, allowNull: true });
    // await queryInterface.addColumn('Products', 'height', { type: Sequelize.FLOAT, allowNull: true });
    // await queryInterface.addColumn('Products', 'length', { type: Sequelize.FLOAT, allowNull: true });
  }
};
