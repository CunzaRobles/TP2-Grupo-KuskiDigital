// Verifica la conexión con Supabase e imprime el conteo de tablas y productos.
// Uso: node backend/scripts/test-db.js   (o npm run db:test)
import { QueryTypes } from 'sequelize';
import { sequelize } from '../src/config/database.js';

const TABLAS_KUSKI = [
  'usuarios',
  'direcciones',
  'categorias',
  'comunidades',
  'productos',
  'producto_imagenes',
  'certificaciones',
  'producto_certificaciones',
  'resenas',
  'carritos',
  'carrito_items',
  'tipos_cambio',
  'tarifas_envio',
  'pedidos',
  'pedido_items',
  'pedido_estados',
  'pagos',
  'envios',
  'movimientos_inventario',
];

try {
  await sequelize.authenticate();

  // pg_tables y no information_schema: Sequelize reformatea las consultas a information_schema.tables
  const tablas = await sequelize.query(
    `SELECT tablename FROM pg_catalog.pg_tables
     WHERE schemaname = 'public' AND tablename IN (:tablas)`,
    { replacements: { tablas: TABLAS_KUSKI }, type: QueryTypes.SELECT },
  );
  const existentes = new Set(tablas.map((t) => t.tablename));
  const faltantes = TABLAS_KUSKI.filter((t) => !existentes.has(t));

  console.log(`Conexión OK. Tablas de Kuski: ${existentes.size}/${TABLAS_KUSKI.length}`);
  if (faltantes.length) console.log(`Faltan: ${faltantes.join(', ')}`);

  const filas = [];
  for (const tabla of TABLAS_KUSKI.filter((t) => existentes.has(t))) {
    const [{ total }] = await sequelize.query(`SELECT COUNT(*)::int AS total FROM ${tabla}`, {
      type: QueryTypes.SELECT,
    });
    filas.push({ tabla, filas: total });
  }
  console.table(filas);

  const [{ total: productos }] = await sequelize.query(
    'SELECT COUNT(*)::int AS total FROM productos',
    { type: QueryTypes.SELECT },
  );
  console.log(`Productos: ${productos}`);
  process.exitCode = faltantes.length ? 1 : 0;
} catch (error) {
  console.error(`Error de conexión con la base de datos: ${error.message}`);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
