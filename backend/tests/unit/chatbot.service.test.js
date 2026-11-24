import { describe, expect, it } from 'vitest';

const pedidoRepository = await import('../../src/repositories/pedido.repository.js');
const catalogoRepository = await import('../../src/repositories/catalogo.repository.js');
const productoRepository = await import('../../src/repositories/producto.repository.js');
const tarifaEnvioRepository = await import('../../src/repositories/tarifa-envio.repository.js');
const { detectarIntencion, extraerCodigoPedido, normalizar, responder } =
  await import('../../src/services/chatbot.service.js');

const intencion = (mensaje) => detectarIntencion(mensaje).intencion;

describe('normalización', () => {
  it('quita tildes, diéresis y signos, y pasa a minúsculas', () => {
    expect(normalizar('¿Cuánto CUESTA el envío?')).toBe('cuanto cuesta el envio');
    expect(normalizar('Rückverfolgbarkeit & Größe')).toBe('ruckverfolgbarkeit grosse');
  });

  it('reconoce el código de pedido en varias formas', () => {
    expect(extraerCodigoPedido('mi pedido es KD-000123')).toBe('KD-000123');
    expect(extraerCodigoPedido('kd 000045 ya llegó?')).toBe('KD-000045');
    expect(extraerCodigoPedido('KD000007')).toBe('KD-000007');
    expect(extraerCodigoPedido('no tengo código')).toBeNull();
  });
});

describe('detección de intención', () => {
  // [intención, español, inglés, alemán]
  const CASOS = [
    ['saludo', 'Hola, buenas tardes', 'Hi there', 'Hallo!'],
    [
      'envios',
      '¿Cuánto cuesta el envío a Alemania?',
      'How much is shipping?',
      'Was kostet der Versand?',
    ],
    ['medios_pago', '¿Puedo pagar con Yape?', 'Payment methods', 'Welche Zahlungsarten gibt es?'],
    [
      'catalogo',
      '¿Qué productos venden?',
      'Do you sell coffee?',
      'Welche Produkte habt ihr im Sortiment?',
    ],
    ['estado_pedido', 'Estado de mi pedido', 'Where is my order?', 'Status meiner Bestellung'],
    [
      'libro_reclamaciones',
      'Quiero poner un reclamo',
      'I want to file a complaint',
      'Ich möchte eine Beschwerde einreichen',
    ],
    [
      'trazabilidad',
      '¿De qué comunidad viene la quinua?',
      'What is the origin of the coffee?',
      'Woher kommt der Kaffee? Herkunft?',
    ],
    [
      'asesor_humano',
      'Hablar con un asesor',
      'Talk to an advisor',
      'Ich möchte mit einer Person sprechen',
    ],
  ];

  it.each(CASOS)('%s en es, en y de', (esperada, es, en, de) => {
    expect(intencion(es)).toBe(esperada);
    expect(intencion(en)).toBe(esperada);
    expect(intencion(de)).toBe(esperada);
  });

  it('un código de pedido decide la intención', () => {
    expect(detectarIntencion('hola, ¿cómo va KD-000123?')).toEqual({
      intencion: 'estado_pedido',
      codigoPedido: 'KD-000123',
    });
  });

  it('el saludo no le gana a una consulta concreta', () => {
    expect(intencion('Hola, ¿aceptan PayPal?')).toBe('medios_pago');
  });

  it('"Estados Unidos" no se confunde con el estado de un pedido', () => {
    expect(intencion('¿Envían a Estados Unidos?')).toBe('envios');
  });

  it('sin coincidencias: fallback', () => {
    expect(intencion('asdf qwerty')).toBe('fallback');
    expect(intencion('¿Qué opinas del clima?')).toBe('fallback');
  });
});

// Intl separa la moneda del importe con un espacio no separable
const plano = (texto) => texto.replace(/\u00a0/g, ' ');

describe('respuestas', () => {
  it('fallback: "No entendí tu consulta" con 3 sugerencias rápidas en el idioma pedido', async () => {
    const es = await responder({ mensaje: 'zzz', idioma: 'es' });
    expect(es).toMatchObject({ intencion: 'fallback', enlaces: [] });
    expect(es.texto).toMatch(/^No entendí tu consulta/);
    expect(es.sugerencias).toEqual([
      '¿Cuánto cuesta el envío?',
      'Estado de mi pedido',
      'Hablar con un asesor',
    ]);

    const de = await responder({ mensaje: 'zzz', idioma: 'de' });
    expect(de.sugerencias).toHaveLength(3);
    expect(de.texto).toMatch(/nicht verstanden/);
  });

  it('envíos: zonas, plazos y costos salen de tarifas_envio', async () => {
    const respuesta = await responder({ mensaje: 'shipping', idioma: 'en' });

    expect(tarifaEnvioRepository.findAll).toHaveBeenCalled();
    expect(plano(respuesta.texto)).toContain(
      'Peru: standard 3–5 days (from PEN 15.00) · express 1–2 days',
    );
    expect(respuesta.texto).toContain('Europe: standard 12–18 days');
    expect(respuesta.enlaces).toEqual([{ texto: 'Shipping terms', url: '/terminos#envios' }]);
    // Las sugerencias no repiten la intención respondida
    expect(respuesta.sugerencias).not.toContain('How much is shipping?');

    tarifaEnvioRepository.findAll.mockResolvedValueOnce([
      { zona: 'nacional', metodo: 'express', diasMin: 1, diasMax: 1, costoBasePen: '99.00' },
    ]);
    const cambiada = await responder({ mensaje: 'envío', idioma: 'es' });
    expect(plano(cambiada.texto)).toContain('Perú: express 1–1 días (desde S/ 99.00)');
  });

  it('catálogo: categorías y destacados de la base, con enlaces', async () => {
    catalogoRepository.findCategorias.mockResolvedValue([
      { nombre: 'Café', slug: 'cafe', totalProductos: 11 },
      { nombre: 'Textiles', slug: 'textiles', totalProductos: 1 },
    ]);
    productoRepository.findDestacados.mockResolvedValue([
      { nombre: 'Café Geisha de Quillabamba', slug: 'cafe-geisha' },
    ]);

    const respuesta = await responder({ mensaje: 'Kaffee kaufen', idioma: 'de' });

    expect(productoRepository.findDestacados).toHaveBeenCalledWith({ limit: 3 });
    expect(respuesta.texto).toContain('Kaffee (11 Produkte), Textilien (1 Produkt)');
    expect(respuesta.enlaces).toEqual([
      { texto: 'Kaffee', url: '/catalogo?categoria=cafe' },
      { texto: 'Textilien', url: '/catalogo?categoria=textiles' },
      { texto: 'Café Geisha de Quillabamba', url: '/producto/cafe-geisha' },
      { texto: 'Ganzen Katalog ansehen', url: '/catalogo' },
    ]);
  });

  it('medios de pago, libro de reclamaciones, trazabilidad y asesor', async () => {
    const pago = await responder({ mensaje: 'Medios de pago' });
    expect(pago.texto).toContain('Yape y Plin solo están disponibles para pagos en soles (PEN)');

    const libro = await responder({ mensaje: 'reclamo' });
    expect(libro.enlaces).toEqual([
      { texto: 'Libro de Reclamaciones', url: '/libro-reclamaciones' },
    ]);

    const origen = await responder({ mensaje: 'origin', idioma: 'en' });
    expect(origen.texto).toContain('altitude');

    const asesor = await responder({ mensaje: 'Hablar con un asesor' });
    expect(asesor.texto).toContain('contacto@kuski.pe');
    expect(asesor.enlaces).toContainEqual({
      texto: 'Enviar un correo',
      url: 'mailto:contacto@kuski.pe',
    });
  });
});

describe('estado de pedido: nunca se exponen pedidos ajenos', () => {
  const PEDIDO = {
    codigo: 'KD-000123',
    usuarioId: 10,
    estado: 'en_transito',
    creadoEn: '2026-11-18T15:00:00Z',
    historialEstados: [
      { estado: 'pagado', creadoEn: '2026-11-18T15:00:00Z' },
      { estado: 'en_transito', creadoEn: '2026-11-20T17:30:00Z' },
    ],
  };
  const DUENA = { id: 10, rol: 'cliente' };

  it('sin código pide el código; sin sesión ofrece iniciarla', async () => {
    const respuesta = await responder({ mensaje: 'Estado de mi pedido' });
    expect(respuesta.texto).toContain('KD-000123'); // el ejemplo de formato
    expect(respuesta.enlaces[0].url).toBe('/login?redirect=%2Fcuenta');
    expect(pedidoRepository.findByCodigo).not.toHaveBeenCalled();
  });

  it('con código y sin sesión pide iniciar sesión sin consultar el pedido', async () => {
    const respuesta = await responder({ mensaje: '¿Dónde está KD-000123?' });

    expect(respuesta.texto).toMatch(/inicia sesión/);
    expect(respuesta.enlaces[0].url).toBe('/login?redirect=%2Fpedido%2FKD-000123');
    expect(pedidoRepository.findByCodigo).not.toHaveBeenCalled();
  });

  it('a su dueña le devuelve el estado y la última fecha del historial', async () => {
    pedidoRepository.findByCodigo.mockResolvedValue(PEDIDO);

    const respuesta = await responder({ mensaje: 'KD-000123', idioma: 'es' }, DUENA);

    expect(respuesta.intencion).toBe('estado_pedido');
    expect(respuesta.texto).toContain('Tu pedido KD-000123 está: En tránsito.');
    expect(respuesta.texto).toContain('20 de noviembre de 2026');
    expect(respuesta.enlaces).toEqual([
      { texto: 'Ver el pedido KD-000123', url: '/pedido/KD-000123' },
    ]);
  });

  it('un pedido de otro usuario responde como si no existiera (ni estado ni fechas)', async () => {
    pedidoRepository.findByCodigo.mockResolvedValue(PEDIDO);

    for (const usuario of [
      { id: 99, rol: 'cliente' },
      { id: 1, rol: 'admin_gerente' }, // tampoco los administradores desde el chat
    ]) {
      const ajeno = await responder({ mensaje: 'KD-000123' }, usuario);
      expect(ajeno.texto).toBe(
        'No encontré el pedido KD-000123 en tu cuenta. Revisa el código o mira tus pedidos.',
      );
      expect(JSON.stringify(ajeno)).not.toMatch(/tránsito|noviembre|\/pedido\//);
    }

    pedidoRepository.findByCodigo.mockResolvedValue(null);
    const inexistente = await responder({ mensaje: 'KD-000999' }, { id: 99, rol: 'cliente' });
    expect(inexistente.texto).toBe(
      'No encontré el pedido KD-000999 en tu cuenta. Revisa el código o mira tus pedidos.',
    );
  });
});
