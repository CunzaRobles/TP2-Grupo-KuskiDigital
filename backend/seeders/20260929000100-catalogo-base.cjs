'use strict';

// Categorías, comunidades, certificaciones y tablas de soporte de la simulación
// (tipos de cambio y tarifas de envío). Replica database/02_datos_base_kuski_db.sql.

const {
  categorias,
  comunidades,
  certificaciones,
  tiposCambio,
  tarifasEnvio,
} = require('../database/seed-data/catalogo.cjs');

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkInsert('categorias', categorias, { transaction });
      await queryInterface.bulkInsert('comunidades', comunidades, { transaction });
      await queryInterface.bulkInsert('certificaciones', certificaciones, { transaction });
      await queryInterface.bulkInsert('tipos_cambio', tiposCambio, { transaction });
      await queryInterface.bulkInsert('tarifas_envio', tarifasEnvio, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete('tarifas_envio', null, { transaction });
      await queryInterface.bulkDelete('tipos_cambio', null, { transaction });
      await queryInterface.bulkDelete('certificaciones', null, { transaction });
      await queryInterface.bulkDelete('comunidades', null, { transaction });
      await queryInterface.bulkDelete('categorias', null, { transaction });
    });
  },
};
