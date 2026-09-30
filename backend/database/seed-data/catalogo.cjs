// Datos semilla del catálogo de Kuski Digital (demo académica).
// Replica database/02_datos_base_kuski_db.sql y amplía el catálogo a 44 productos.
// Las fotos son placeholders de Unsplash (verificadas) hasta tener fotos reales.

const unsplash = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

const categorias = [
  {
    nombre: 'Café',
    slug: 'cafe',
    descripcion: 'Cafés de altura de los valles cusqueños.',
    imagen_url: unsplash('1447933601403-0c6688de566e'),
    orden: 1,
  },
  {
    nombre: 'Superalimentos',
    slug: 'superalimentos',
    descripcion: 'Granos y harinas andinas de alto valor nutricional.',
    imagen_url: unsplash('1574323347407-f5e1ad6d020b'),
    orden: 2,
  },
  {
    nombre: 'Textiles',
    slug: 'textiles',
    descripcion: 'Prendas y accesorios en fibra de alpaca.',
    imagen_url: unsplash('1457545195570-67f207084966'),
    orden: 3,
  },
  {
    nombre: 'Artesanía',
    slug: 'artesania',
    descripcion: 'Piezas elaboradas por artesanos de comunidades andinas.',
    imagen_url: unsplash('1493106641515-6b5631de4bb9'),
    orden: 4,
  },
];

// Coordenadas y altitudes aproximadas
// prettier-ignore
const comunidades = [
  ['Comunidad Cafetalera de Quillabamba', 'Asoc. Cafetaleros Quillabamba', 'La Convención', 1050, -12.863, -72.693, 85, 'Café orgánico de sombra cultivado en la ceja de selva cusqueña.'],
  ['Comunidad Tejedora de Chinchero', 'Asoc. Tejedoras de Chinchero', 'Urubamba', 3760, -13.392, -72.048, 60, 'Tejido tradicional con tintes naturales y técnicas ancestrales.'],
  ['Comunidad Agrícola de Pisac', 'Coop. Agraria Pisac', 'Calca', 2970, -13.421, -71.848, 70, 'Quinua, kiwicha y maíz del Valle Sagrado.'],
  ['Comunidad de Ollantaytambo', 'Asoc. Productores Ollantaytambo', 'Urubamba', 2792, -13.258, -72.263, 45, 'Maíz blanco gigante y derivados andinos.'],
  ['Comunidad de Paucartambo', 'Asoc. Agroecológica Paucartambo', 'Paucartambo', 2906, -13.318, -71.596, 55, 'Papas nativas, maca y tubérculos andinos.'],
  ['Comunidad Artesana de Andahuaylillas', 'Taller Artesanal Andahuaylillas', 'Quispicanchi', 3122, -13.672, -71.677, 30, 'Cerámica y tallado inspirados en el barroco andino.'],
  ['Comunidad de Anta', 'Coop. Agraria Anta', 'Anta', 3345, -13.47, -72.15, 65, 'Cañihua y cereales andinos de la pampa de Anta.'],
  ['Comunidad Alpaquera de Lares', 'Asoc. Criadores de Alpaca Lares', 'Calca', 3200, -13.104, -72.043, 40, 'Fibra de alpaca de crianza familiar.'],
].map(([nombre, razon_social, provincia, altitud_msnm, latitud, longitud, familias_beneficiadas, descripcion]) => ({
  nombre,
  razon_social,
  provincia,
  altitud_msnm,
  latitud,
  longitud,
  familias_beneficiadas,
  descripcion,
}));

const certificaciones = [
  { nombre: 'Orgánico', entidad_emisora: 'SENASA / certificadora acreditada' },
  { nombre: 'Comercio Justo', entidad_emisora: 'Fairtrade International' },
  { nombre: 'Hecho a mano', entidad_emisora: 'Kuski Agroindustria' },
  { nombre: 'Libre de gluten', entidad_emisora: 'Laboratorio acreditado' },
];

// SIMULADOS — valor de 1 unidad en soles
const tiposCambio = [
  { moneda_codigo: 'PEN', simbolo: 'S/', valor_en_pen: 1.0 },
  { moneda_codigo: 'USD', simbolo: '$', valor_en_pen: 3.75 },
  { moneda_codigo: 'EUR', simbolo: '€', valor_en_pen: 4.05 },
];

// SIMULADAS — costo = costo_base + costo_por_kg * peso_en_kg
// prettier-ignore
const tarifasEnvio = [
  ['nacional', 'estandar', 'Olva Courier', 15, 3, 3, 5],
  ['nacional', 'express', 'Olva Express', 25, 5, 1, 2],
  ['latam', 'estandar', 'Serpost', 60, 25, 12, 18],
  ['latam', 'express', 'DHL Express', 120, 45, 4, 7],
  ['norteamerica', 'estandar', 'Serpost', 80, 30, 12, 18],
  ['norteamerica', 'express', 'DHL Express', 150, 55, 4, 7],
  ['europa', 'estandar', 'Serpost', 90, 35, 12, 18],
  ['europa', 'express', 'DHL Express', 170, 60, 4, 7],
  ['resto_mundo', 'estandar', 'Serpost', 110, 40, 15, 25],
  ['resto_mundo', 'express', 'DHL Express', 200, 70, 5, 9],
].map(([zona, metodo, transportista, costo_base_pen, costo_por_kg_pen, dias_min, dias_max]) => ({
  zona,
  metodo,
  transportista,
  costo_base_pen,
  costo_por_kg_pen,
  dias_min,
  dias_max,
}));

// Fotos por categoría: cada producto toma 2 distintas del grupo de su categoría.
const imagenesPorCategoria = {
  cafe: [
    '1447933601403-0c6688de566e',
    '1559056199-641a0ac8b55e',
    '1587734195503-904fca47e0e9',
    '1511920170033-f8396924c348',
    '1580933073521-dc49ac0d4e6a',
    '1442512595331-e89e73853f31',
    '1514432324607-a09d9b4aefdd',
    '1611854779393-1b2da9d400fe',
    '1497935586351-b67a49e012bf',
    '1509042239860-f550ce710b93',
    '1495474472287-4d71bcdd2085',
    '1507133750040-4a8f57021571',
    '1498804103079-a6351b050096',
    '1461023058943-07fcbe16d735',
  ],
  superalimentos: [
    '1574323347407-f5e1ad6d020b',
    '1586201375761-83865001e31c',
    '1551754655-cd27e38d2076',
    '1518977676601-b53f82aba655',
    '1614961233913-a5113a4a34ed',
    '1536304993881-ff6e9eefa2a6',
    '1505576399279-565b52d4ac71',
    '1596040033229-a9821ebd058d',
    '1515543237350-b3eea1ec8082',
    '1590779033100-9f60a05a013d',
  ],
  textiles: [
    '1457545195570-67f207084966',
    '1434389677669-e08b4cac3105',
    '1520903920243-00d872a2d1c9',
    '1601924994987-69e26d50dc26',
    '1610288311735-39b7facbd095',
    '1606293926075-69a00dbfde81',
    '1558769132-cb1aea458c5e',
    '1528578577235-b963df6db908',
  ],
  artesania: [
    '1493106641515-6b5631de4bb9',
    '1565193566173-7a0ee3dbe261',
    '1578749556568-bc2c40e68b61',
    '1610701596007-11502861dcfa',
    '1612196808214-b8e1d6145a8c',
    '1590422749897-47036da0b0ff',
  ],
};

const Q = 'Comunidad Cafetalera de Quillabamba';
const CHI = 'Comunidad Tejedora de Chinchero';
const PIS = 'Comunidad Agrícola de Pisac';
const OLL = 'Comunidad de Ollantaytambo';
const PAU = 'Comunidad de Paucartambo';
const AND = 'Comunidad Artesana de Andahuaylillas';
const ANT = 'Comunidad de Anta';
const LAR = 'Comunidad Alpaquera de Lares';

const ORG = 'Orgánico';
const CJ = 'Comercio Justo';
const MANO = 'Hecho a mano';
const SG = 'Libre de gluten';

// [sku, nombre, slug, descripcion, precio_pen, stock, peso_g, destacado, comunidad, certificaciones]
// prettier-ignore
const productos = {
  cafe: [
    ['CAF-001', 'Café Orgánico Kuski 250 g', 'cafe-organico-kuski-250g', 'Café arábica de altura, tueste medio, notas de cacao y panela.', 35.0, 42, 250, true, Q, [ORG, CJ]],
    ['CAF-002', 'Café en Grano Quillabamba 500 g', 'cafe-grano-quillabamba-500g', 'Grano entero seleccionado a mano, ideal para métodos filtrados.', 62.0, 30, 500, false, Q, [ORG, CJ]],
    ['CAF-003', 'Café Molido Tueste Oscuro 250 g', 'cafe-molido-tueste-oscuro', 'Molienda media para cafetera italiana o prensa francesa.', 33.0, 25, 250, false, Q, [ORG, CJ]],
    ['CAF-004', 'Café Geisha Microlote 250 g', 'cafe-geisha-microlote-250g', 'Microlote de variedad Geisha de las fincas más altas de La Convención. Taza floral con notas de jazmín, durazno y té negro; cosecha limitada y numerada.', 78.0, 10, 250, true, Q, [ORG, CJ]],
    ['CAF-005', 'Café Honey Valle de Echarati 250 g', 'cafe-honey-echarati-250g', 'Proceso honey: el grano se seca al sol con parte del mucílago, lo que aporta dulzor de caramelo y un cuerpo sedoso. Tueste medio.', 45.0, 18, 250, false, Q, [ORG, CJ]],
    ['CAF-006', 'Café Lavado Tueste Claro 250 g', 'cafe-lavado-tueste-claro-250g', 'Lavado y fermentado en tanques de madera. Acidez cítrica brillante y final a panela; pensado para V60, Chemex o Kalita.', 38.0, 24, 250, false, Q, [ORG, CJ]],
    ['CAF-007', 'Café Descafeinado Método de Agua 250 g', 'cafe-descafeinado-agua-250g', 'Descafeinado solo con agua, sin solventes químicos, que conserva las notas a chocolate y nuez del café de Quillabamba. Molido medio.', 40.0, 15, 250, false, Q, [ORG]],
    ['CAF-008', 'Cápsulas de Café Andino x10', 'capsulas-cafe-andino-x10', 'Diez cápsulas compostables rellenas con nuestro tueste medio. Compatibles con las cafeteras de cápsula más comunes del mercado.', 28.0, 40, 60, false, Q, [ORG]],
    ['CAF-009', 'Café en Grano Tostado 1 kg', 'cafe-grano-tostado-1kg', 'Formato de un kilo para cafeterías y hogares de alto consumo. Tueste medio, válvula desgasificadora y bolsa resellable.', 115.0, 20, 1000, false, Q, [ORG, CJ]],
    ['CAF-010', 'Cascarilla de Café 150 g', 'cascarilla-cafe-150g', 'Infusión de la pulpa seca del cerezo de café, subproducto que antes se desechaba. Sabor a frutos rojos e hibisco, con poca cafeína.', 22.0, 30, 150, false, Q, [ORG]],
    ['CAF-011', 'Set Degustación Tres Tuestes 3 × 100 g', 'set-degustacion-tres-tuestes', 'Tres bolsas de 100 g (claro, medio y oscuro) del mismo lote para comparar cómo el tueste transforma la taza. Incluye guía de cata.', 69.0, 12, 350, false, Q, [ORG, CJ]],
  ],
  superalimentos: [
    ['SUP-001', 'Quinua Real Orgánica 500 g', 'quinua-real-organica-500g', 'Quinua blanca lavada, lista para cocinar.', 18.5, 80, 500, true, PIS, [ORG, SG]],
    ['SUP-002', 'Kiwicha Pop 250 g', 'kiwicha-pop-250g', 'Kiwicha reventada, ideal para desayunos y snacks.', 12.0, 60, 250, false, PIS, [ORG, SG]],
    ['SUP-003', 'Maca Negra en Polvo 250 g', 'maca-negra-polvo-250g', 'Maca gelatinizada de altura, fuente natural de energía.', 28.0, 45, 250, true, PAU, [ORG, SG]],
    ['SUP-004', 'Harina de Cañihua 400 g', 'harina-canihua-400g', 'Cañihua tostada y molida, rica en hierro.', 16.0, 35, 400, false, ANT, [ORG, SG]],
    ['SUP-005', 'Quinua Tricolor 500 g', 'quinua-tricolor-500g', 'Mezcla de quinua blanca, roja y negra del Valle Sagrado. Textura firme que no se deshace, perfecta para ensaladas y guarniciones.', 21.0, 55, 500, false, PIS, [ORG, SG]],
    ['SUP-006', 'Maíz Blanco Gigante del Cusco 1 kg', 'maiz-blanco-gigante-cusco-1kg', 'El grano de maíz más grande del mundo, cultivado en las terrazas de Ollantaytambo. Ideal para mote, cancha o sopas andinas.', 24.0, 40, 1000, false, OLL, [SG]],
    ['SUP-007', 'Maíz Morado Deshidratado 500 g', 'maiz-morado-deshidratado-500g', 'Mazorcas de maíz morado secadas al sol, ricas en antocianinas. La base de la chicha morada y la mazamorra tradicional.', 14.0, 50, 500, false, OLL, [SG]],
    ['SUP-008', 'Cancha Serrana Tostada 200 g', 'cancha-serrana-tostada-200g', 'Maíz chullpi tostado con una pizca de sal de Maras. El snack crocante que acompaña cada mesa cusqueña.', 9.5, 70, 200, false, OLL, [SG]],
    ['SUP-009', 'Chuño Blanco (Tunta) 500 g', 'chuno-blanco-tunta-500g', 'Papa nativa deshidratada por congelamiento natural en las heladas de junio y lavada en agua de manantial. Se conserva por años.', 19.0, 25, 500, false, PAU, [SG]],
    ['SUP-010', 'Maca Amarilla Gelatinizada 500 g', 'maca-amarilla-gelatinizada-500g', 'Maca amarilla de sabor suave, gelatinizada para facilitar su digestión. Para batidos, avena y repostería.', 38.0, 30, 500, false, PAU, [ORG, SG]],
    ['SUP-011', 'Tarwi Desamargado 400 g', 'tarwi-desamargado-400g', 'Lupino andino con más de 40 % de proteína, desamargado de forma artesanal en agua corriente. Listo para ceviche de tarwi o cremas.', 17.0, 4, 400, false, ANT, [ORG, SG]],
  ],
  textiles: [
    ['TEX-001', 'Chal de Alpaca Tejido a Mano', 'chal-alpaca-tejido-mano', 'Chal en baby alpaca con tintes naturales de cochinilla y nogal.', 220.0, 12, 300, true, CHI, [MANO]],
    ['TEX-002', 'Chompa de Alpaca Clásica', 'chompa-alpaca-clasica', 'Suéter unisex en fibra de alpaca, cálido y liviano.', 280.0, 8, 450, false, LAR, [MANO]],
    ['TEX-003', 'Chullo Andino de Alpaca', 'chullo-andino-alpaca', 'Gorro tradicional con iconografía andina.', 75.0, 20, 120, false, LAR, [MANO]],
    ['TEX-004', 'Poncho Chinchero de Alpaca', 'poncho-chinchero-alpaca', 'Poncho tejido en telar de cintura con los diseños propios de Chinchero. Cada pieza toma cerca de un mes de trabajo de una tejedora.', 350.0, 6, 900, true, CHI, [MANO]],
    ['TEX-005', 'Bufanda Baby Alpaca Espiga', 'bufanda-baby-alpaca-espiga', 'Bufanda en punto espiga de baby alpaca, suave al contacto con la piel y sin picor. Tonos naturales de la fibra, sin teñir.', 120.0, 25, 150, false, LAR, [MANO]],
    ['TEX-006', 'Guantes de Alpaca Tejidos', 'guantes-alpaca-tejidos', 'Guantes tejidos a palitos con fibra de alpaca de Lares. Abrigan incluso a varios grados bajo cero.', 55.0, 30, 80, false, LAR, [MANO]],
    ['TEX-007', 'Manta Lliclla Tejida en Telar', 'manta-lliclla-telar', 'Lliclla tradicional teñida con cochinilla, chilca y q’olle. Úsala como manta, tapiz o camino de cama.', 190.0, 10, 1100, false, CHI, [MANO]],
    ['TEX-008', 'Cárdigan de Alpaca con Botones de Madera', 'cardigan-alpaca-botones-madera', 'Cárdigan de punto grueso en alpaca con botones tallados en madera de eucalipto. Corte relajado y bolsillos laterales.', 320.0, 5, 500, false, LAR, [MANO]],
    ['TEX-009', 'Medias de Alpaca Térmicas (par)', 'medias-alpaca-termicas', 'Medias térmicas con 70 % alpaca que regulan la temperatura y evitan la humedad. Ideales para trekking y días fríos.', 38.0, 45, 90, false, LAR, [MANO]],
    ['TEX-010', 'Camino de Mesa Tejido Chinchero', 'camino-mesa-tejido-chinchero', 'Camino de mesa con motivos de la flor de chiwanway y el ojo de perdiz, tejido por las artesanas de Chinchero.', 95.0, 14, 350, false, CHI, [MANO]],
    ['TEX-011', 'Ovillo de Alpaca Teñido Natural 100 g', 'ovillo-alpaca-tenido-natural-100g', 'Hilo de alpaca hilado en pushka y teñido con plantas y cochinilla. Para tejedoras que buscan color y fibra auténticos.', 42.0, 35, 100, false, CHI, [MANO]],
  ],
  artesania: [
    ['ART-001', 'Toro de Pucará en Cerámica', 'toro-pucara-ceramica', 'Cerámica tradicional pintada a mano, símbolo de protección del hogar.', 95.0, 15, 800, true, AND, [MANO]],
    ['ART-002', 'Retablo Ayacuchano Mediano', 'retablo-mediano', 'Retablo en madera y pasta de papa con escenas de la vida andina.', 160.0, 4, 1200, false, AND, [MANO]],
    ['ART-003', 'Cruz Chacana Tallada en Madera', 'cruz-chacana-madera', 'Chacana, la cruz andina de los tres mundos, tallada en madera de cedro y acabada con cera de abeja.', 65.0, 20, 400, false, AND, [MANO]],
    ['ART-004', 'Mate Burilado Decorativo', 'mate-burilado-decorativo', 'Calabaza seca grabada a buril con escenas de siembra y cosecha. Técnica declarada Patrimonio Cultural de la Nación.', 55.0, 18, 250, false, AND, [MANO]],
    ['ART-005', 'Espejo Colonial con Pan de Oro', 'espejo-colonial-pan-de-oro', 'Marco tallado en madera y recubierto con pan de oro, al estilo del barroco andino de la iglesia de Andahuaylillas. 40 × 50 cm.', 240.0, 6, 1800, true, AND, [MANO]],
    ['ART-006', 'Juego de Tazas de Cerámica Esmaltada ×2', 'tazas-ceramica-esmaltada-x2', 'Dos tazas de 300 ml torneadas a mano y esmaltadas en tonos tierra. Aptas para lavavajillas y microondas.', 85.0, 16, 900, false, AND, [MANO]],
    ['ART-007', 'Aríbalo Inca en Cerámica', 'aribalo-inca-ceramica', 'Réplica a escala del aríbalo inca, la vasija ceremonial para la chicha, con engobe rojo y diseños geométricos.', 130.0, 8, 1500, false, AND, [MANO]],
    ['ART-008', 'Ángel Barroco en Madera Policromada', 'angel-barroco-madera-policromada', 'Imagen de ángel tallada y policromada según la tradición de la escuela cusqueña. Pieza única firmada por el artesano.', 180.0, 5, 700, false, AND, [MANO]],
    ['ART-009', 'Pareja de Toritos Miniatura', 'pareja-toritos-miniatura', 'Dos toritos de cerámica de 8 cm que se colocan en los techos cusqueños para atraer prosperidad y armonía.', 48.0, 25, 300, false, AND, [MANO]],
    ['ART-010', 'Árbol de la Vida en Cerámica', 'arbol-vida-ceramica', 'Candelabro modelado a mano con flores, aves y frutos andinos; cada hoja se pinta por separado. 35 cm de alto.', 145.0, 7, 1300, false, AND, [MANO]],
    ['ART-011', 'Plato Decorativo Pintado a Mano', 'plato-decorativo-pintado-mano', 'Plato de cerámica de 30 cm con iconografía de la cultura Killke, pintado con pigmentos minerales. Incluye soporte.', 70.0, 12, 1000, false, AND, [MANO]],
  ],
};

module.exports = {
  categorias,
  comunidades,
  certificaciones,
  tiposCambio,
  tarifasEnvio,
  imagenesPorCategoria,
  productos,
  unsplash,
};
