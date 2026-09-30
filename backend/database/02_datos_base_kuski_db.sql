-- =====================================================================
-- KUSKI DIGITAL — Datos base de prueba v2.1 (PostgreSQL 15+ / Supabase)
-- Ejecutar DESPUÉS de 01_esquema_kuski_db.sql (SQL Editor de Supabase o kuski_db local).
-- Los datos de comunidades y productos son de ejemplo (demo académica).
-- Los usuarios se crean desde el backend (seeder), porque la contraseña
-- debe guardarse cifrada con bcrypt.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Categorías (las 4 del wireframe)
-- ---------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, descripcion, orden) VALUES
('Café',            'cafe',            'Cafés de altura de los valles cusqueños.',              1),
('Superalimentos',  'superalimentos',  'Granos y harinas andinas de alto valor nutricional.',   2),
('Textiles',        'textiles',        'Prendas y accesorios en fibra de alpaca.',              3),
('Artesanía',       'artesania',       'Piezas elaboradas por artesanos de comunidades andinas.',4);

-- ---------------------------------------------------------------------
-- Comunidades productoras (coordenadas y altitudes aproximadas)
-- ---------------------------------------------------------------------
INSERT INTO comunidades (nombre, razon_social, provincia, altitud_msnm, latitud, longitud, familias_beneficiadas, descripcion) VALUES
('Comunidad Cafetalera de Quillabamba', 'Asoc. Cafetaleros Quillabamba',     'La Convención', 1050, -12.863000, -72.693000, 85, 'Café orgánico de sombra cultivado en la ceja de selva cusqueña.'),
('Comunidad Tejedora de Chinchero',     'Asoc. Tejedoras de Chinchero',      'Urubamba',      3760, -13.392000, -72.048000, 60, 'Tejido tradicional con tintes naturales y técnicas ancestrales.'),
('Comunidad Agrícola de Pisac',         'Coop. Agraria Pisac',               'Calca',         2970, -13.421000, -71.848000, 70, 'Quinua, kiwicha y maíz del Valle Sagrado.'),
('Comunidad de Ollantaytambo',          'Asoc. Productores Ollantaytambo',   'Urubamba',      2792, -13.258000, -72.263000, 45, 'Maíz blanco gigante y derivados andinos.'),
('Comunidad de Paucartambo',            'Asoc. Agroecológica Paucartambo',   'Paucartambo',   2906, -13.318000, -71.596000, 55, 'Papas nativas, maca y tubérculos andinos.'),
('Comunidad Artesana de Andahuaylillas','Taller Artesanal Andahuaylillas',   'Quispicanchi',  3122, -13.672000, -71.677000, 30, 'Cerámica y tallado inspirados en el barroco andino.'),
('Comunidad de Anta',                   'Coop. Agraria Anta',                'Anta',          3345, -13.470000, -72.150000, 65, 'Cañihua y cereales andinos de la pampa de Anta.'),
('Comunidad Alpaquera de Lares',        'Asoc. Criadores de Alpaca Lares',   'Calca',         3200, -13.104000, -72.043000, 40, 'Fibra de alpaca de crianza familiar.');

-- ---------------------------------------------------------------------
-- Certificaciones
-- ---------------------------------------------------------------------
INSERT INTO certificaciones (nombre, entidad_emisora) VALUES
('Orgánico',         'SENASA / certificadora acreditada'),
('Comercio Justo',   'Fairtrade International'),
('Hecho a mano',     'Kuski Agroindustria'),
('Libre de gluten',  'Laboratorio acreditado');

-- ---------------------------------------------------------------------
-- Tipos de cambio (SIMULADOS — valor de 1 unidad en soles)
-- ---------------------------------------------------------------------
INSERT INTO tipos_cambio (moneda_codigo, simbolo, valor_en_pen) VALUES
('PEN', 'S/', 1.0000),
('USD', '$',  3.7500),
('EUR', '€',  4.0500);

-- ---------------------------------------------------------------------
-- Tarifas de envío (SIMULADAS)
-- Costo = costo_base + costo_por_kg * peso_en_kg
-- ---------------------------------------------------------------------
INSERT INTO tarifas_envio (zona, metodo, transportista, costo_base_pen, costo_por_kg_pen, dias_min, dias_max) VALUES
('nacional',     'estandar', 'Olva Courier',     15.00,  3.00,  3,  5),
('nacional',     'express',  'Olva Express',     25.00,  5.00,  1,  2),
('latam',        'estandar', 'Serpost',          60.00, 25.00, 12, 18),
('latam',        'express',  'DHL Express',     120.00, 45.00,  4,  7),
('norteamerica', 'estandar', 'Serpost',          80.00, 30.00, 12, 18),
('norteamerica', 'express',  'DHL Express',     150.00, 55.00,  4,  7),
('europa',       'estandar', 'Serpost',          90.00, 35.00, 12, 18),
('europa',       'express',  'DHL Express',     170.00, 60.00,  4,  7),
('resto_mundo',  'estandar', 'Serpost',         110.00, 40.00, 15, 25),
('resto_mundo',  'express',  'DHL Express',     200.00, 70.00,  5,  9);

-- ---------------------------------------------------------------------
-- Productos de ejemplo (12). El catálogo completo de 40+ se carga
-- con el seeder del backend.
-- ---------------------------------------------------------------------
INSERT INTO productos (sku, nombre, slug, descripcion, precio_base_pen, stock, peso_g, destacado, categoria_id, comunidad_id) VALUES
('CAF-001', 'Café Orgánico Kuski 250 g',        'cafe-organico-kuski-250g',     'Café arábica de altura, tueste medio, notas de cacao y panela.',          35.00, 42,  250, TRUE,  (SELECT id FROM categorias WHERE slug='cafe'),           (SELECT id FROM comunidades WHERE provincia='La Convención')),
('CAF-002', 'Café en Grano Quillabamba 500 g',  'cafe-grano-quillabamba-500g',  'Grano entero seleccionado a mano, ideal para métodos filtrados.',         62.00, 30,  500, FALSE, (SELECT id FROM categorias WHERE slug='cafe'),           (SELECT id FROM comunidades WHERE provincia='La Convención')),
('CAF-003', 'Café Molido Tueste Oscuro 250 g',  'cafe-molido-tueste-oscuro',    'Molienda media para cafetera italiana o prensa francesa.',                33.00, 25,  250, FALSE, (SELECT id FROM categorias WHERE slug='cafe'),           (SELECT id FROM comunidades WHERE provincia='La Convención')),
('SUP-001', 'Quinua Real Orgánica 500 g',       'quinua-real-organica-500g',    'Quinua blanca lavada, lista para cocinar.',                               18.50, 80,  500, TRUE,  (SELECT id FROM categorias WHERE slug='superalimentos'), (SELECT id FROM comunidades WHERE nombre='Comunidad Agrícola de Pisac')),
('SUP-002', 'Kiwicha Pop 250 g',                'kiwicha-pop-250g',             'Kiwicha reventada, ideal para desayunos y snacks.',                       12.00, 60,  250, FALSE, (SELECT id FROM categorias WHERE slug='superalimentos'), (SELECT id FROM comunidades WHERE nombre='Comunidad Agrícola de Pisac')),
('SUP-003', 'Maca Negra en Polvo 250 g',        'maca-negra-polvo-250g',        'Maca gelatinizada de altura, fuente natural de energía.',                 28.00, 45,  250, TRUE,  (SELECT id FROM categorias WHERE slug='superalimentos'), (SELECT id FROM comunidades WHERE nombre='Comunidad de Paucartambo')),
('SUP-004', 'Harina de Cañihua 400 g',          'harina-canihua-400g',          'Cañihua tostada y molida, rica en hierro.',                               16.00, 35,  400, FALSE, (SELECT id FROM categorias WHERE slug='superalimentos'), (SELECT id FROM comunidades WHERE nombre='Comunidad de Anta')),
('TEX-001', 'Chal de Alpaca Tejido a Mano',     'chal-alpaca-tejido-mano',      'Chal en baby alpaca con tintes naturales de cochinilla y nogal.',        220.00, 12,  300, TRUE,  (SELECT id FROM categorias WHERE slug='textiles'),       (SELECT id FROM comunidades WHERE nombre='Comunidad Tejedora de Chinchero')),
('TEX-002', 'Chompa de Alpaca Clásica',         'chompa-alpaca-clasica',        'Suéter unisex en fibra de alpaca, cálido y liviano.',                    280.00,  8,  450, FALSE, (SELECT id FROM categorias WHERE slug='textiles'),       (SELECT id FROM comunidades WHERE nombre='Comunidad Alpaquera de Lares')),
('TEX-003', 'Chullo Andino de Alpaca',          'chullo-andino-alpaca',         'Gorro tradicional con iconografía andina.',                               75.00, 20,  120, FALSE, (SELECT id FROM categorias WHERE slug='textiles'),       (SELECT id FROM comunidades WHERE nombre='Comunidad Alpaquera de Lares')),
('ART-001', 'Toro de Pucará en Cerámica',       'toro-pucara-ceramica',         'Cerámica tradicional pintada a mano, símbolo de protección del hogar.',   95.00, 15,  800, TRUE,  (SELECT id FROM categorias WHERE slug='artesania'),      (SELECT id FROM comunidades WHERE nombre='Comunidad Artesana de Andahuaylillas')),
('ART-002', 'Retablo Ayacuchano Mediano',       'retablo-mediano',              'Retablo en madera y pasta de papa con escenas de la vida andina.',       160.00,  4, 1200, FALSE, (SELECT id FROM categorias WHERE slug='artesania'),      (SELECT id FROM comunidades WHERE nombre='Comunidad Artesana de Andahuaylillas'));

-- Certificaciones de los productos
INSERT INTO producto_certificaciones (producto_id, certificacion_id)
SELECT p.id, c.id FROM productos p, certificaciones c
WHERE (p.sku LIKE 'CAF-%' AND c.nombre IN ('Orgánico', 'Comercio Justo'))
   OR (p.sku IN ('SUP-001','SUP-002','SUP-003','SUP-004') AND c.nombre IN ('Orgánico', 'Libre de gluten'))
   OR ((p.sku LIKE 'TEX-%' OR p.sku LIKE 'ART-%') AND c.nombre = 'Hecho a mano');

-- Movimiento inicial de inventario (kardex) = stock de apertura
INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, stock_resultante, motivo)
SELECT id, 'entrada', stock, stock, 'Inventario inicial'
FROM productos WHERE stock > 0;

COMMIT;

-- ---------------------------------------------------------------------
-- Consultas de verificación (ejecútalas para comprobar la carga)
-- ---------------------------------------------------------------------
-- SELECT COUNT(*) FROM productos;                          -- 12
-- SELECT * FROM v_productos_stock_bajo;                    -- ART-002 (stock 4)
-- SELECT p.nombre, co.nombre AS comunidad, co.altitud_msnm
--   FROM productos p JOIN comunidades co ON co.id = p.comunidad_id;