'use strict';

// Migración baseline: ejecuta el esquema completo v2.1 (19 tablas, ENUMs, índices,
// triggers, vistas y RLS). El script empieza con DROP ... IF EXISTS, por lo que
// recrea las tablas de Kuski si ya existían (solo hay datos de prueba en Supabase).
// Los cambios posteriores al esquema van en migraciones nuevas, nunca aquí.

const fs = require('node:fs');
const path = require('node:path');

const SCHEMA_SQL = path.resolve(__dirname, '../database/01_esquema_kuski_db.sql');

module.exports = {
  async up(queryInterface) {
    const sql = fs.readFileSync(SCHEMA_SQL, 'utf8');
    await queryInterface.sequelize.transaction((transaction) =>
      queryInterface.sequelize.query(sql, { transaction }),
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction((transaction) =>
      queryInterface.sequelize.query(
        `
        DROP VIEW IF EXISTS v_productos_mas_vendidos, v_ventas_por_pais, v_productos_stock_bajo;
        DROP TABLE IF EXISTS
          movimientos_inventario, envios, pagos, pedido_estados, pedido_items, pedidos,
          tarifas_envio, tipos_cambio, carrito_items, carritos, resenas,
          producto_certificaciones, certificaciones, producto_imagenes, productos,
          comunidades, categorias, direcciones, usuarios
          CASCADE;
        DROP TYPE IF EXISTS rol_usuario, tipo_movimiento, estado_pedido, metodo_pago,
          estado_pago, metodo_envio, zona_envio;
        DROP FUNCTION IF EXISTS fn_set_actualizado_en();
        `,
        { transaction },
      ),
    );
  },
};
