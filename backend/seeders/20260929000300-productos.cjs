'use strict';

// Catálogo de 44 productos con 2 imágenes cada uno, sus certificaciones y el
// movimiento de inventario inicial (kardex) registrado por la gerencia.

const { productos, imagenesPorCategoria, unsplash } = require('../database/seed-data/catalogo.cjs');

const idsPor = async (queryInterface, tabla, clave, transaction) => {
  const [filas] = await queryInterface.sequelize.query(`SELECT id, ${clave} FROM ${tabla}`, {
    transaction,
  });
  return new Map(filas.map((f) => [f[clave], f.id]));
};

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const categorias = await idsPor(queryInterface, 'categorias', 'slug', transaction);
      const comunidades = await idsPor(queryInterface, 'comunidades', 'nombre', transaction);
      const certificaciones = await idsPor(
        queryInterface,
        'certificaciones',
        'nombre',
        transaction,
      );

      const lista = Object.entries(productos).flatMap(([categoriaSlug, items]) =>
        items.map((p, indice) => ({ categoriaSlug, indice, p })),
      );

      await queryInterface.bulkInsert(
        'productos',
        lista.map(({ categoriaSlug, p }) => {
          const [sku, nombre, slug, descripcion, precio, stock, peso, destacado, comunidad] = p;
          return {
            sku,
            nombre,
            slug,
            descripcion,
            precio_base_pen: precio,
            stock,
            peso_g: peso,
            destacado,
            categoria_id: categorias.get(categoriaSlug),
            comunidad_id: comunidades.get(comunidad),
          };
        }),
        { transaction },
      );

      const productoIds = await idsPor(queryInterface, 'productos', 'sku', transaction);
      const [[gerente]] = await queryInterface.sequelize.query(
        "SELECT id FROM usuarios WHERE rol = 'admin_gerente' ORDER BY id LIMIT 1",
        { transaction },
      );

      const imagenes = [];
      const productoCertificaciones = [];
      const movimientos = [];

      for (const { categoriaSlug, indice, p } of lista) {
        const [sku, nombre, , , , stock, , , , certs] = p;
        const productoId = productoIds.get(sku);

        // Dos fotos distintas del grupo de la categoría, rotando para variar entre productos
        const grupo = imagenesPorCategoria[categoriaSlug];
        [0, 1].forEach((orden) => {
          imagenes.push({
            producto_id: productoId,
            url: unsplash(grupo[(indice * 2 + orden) % grupo.length]),
            texto_alt: orden === 0 ? nombre : `${nombre} — detalle`,
            orden,
            es_principal: orden === 0,
          });
        });

        for (const cert of certs) {
          productoCertificaciones.push({
            producto_id: productoId,
            certificacion_id: certificaciones.get(cert),
          });
        }

        if (stock > 0) {
          movimientos.push({
            producto_id: productoId,
            tipo: 'entrada',
            cantidad: stock,
            stock_resultante: stock,
            motivo: 'Inventario inicial',
            usuario_id: gerente?.id ?? null,
          });
        }
      }

      await queryInterface.bulkInsert('producto_imagenes', imagenes, { transaction });
      await queryInterface.bulkInsert('producto_certificaciones', productoCertificaciones, {
        transaction,
      });
      await queryInterface.bulkInsert('movimientos_inventario', movimientos, { transaction });
    });
  },

  async down(queryInterface) {
    // imágenes, certificaciones y kardex se borran en cascada
    const skus = Object.values(productos).flatMap((items) => items.map(([sku]) => sku));
    await queryInterface.bulkDelete('productos', { sku: skus });
  },
};
