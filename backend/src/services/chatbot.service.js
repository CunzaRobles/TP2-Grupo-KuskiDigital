import { env } from '../config/env.js';
import * as catalogoRepository from '../repositories/catalogo.repository.js';
import * as pedidoRepository from '../repositories/pedido.repository.js';
import * as productoRepository from '../repositories/producto.repository.js';
import * as tarifaEnvioRepository from '../repositories/tarifa-envio.repository.js';
import { formatearCodigo } from '../utils/pedidos.js';
import { PALABRAS_CLAVE, TEXTOS } from './chatbot.textos.js';

// Asistente virtual de la tienda: motor de intenciones por reglas (sin IA de pago, costo cero).
// Detecta la intención por palabras clave normalizadas en es/en/de y arma la respuesta con datos
// reales de la base (tarifas, categorías, destacados, pedidos del propio usuario).

export const INTENCIONES = [
  'saludo',
  'envios',
  'medios_pago',
  'catalogo',
  'estado_pedido',
  'libro_reclamaciones',
  'trazabilidad',
  'asesor_humano',
];

// Desempate cuando dos intenciones suman lo mismo: lo más específico primero. El saludo solo
// gana si no hay otra intención ("hola, ¿cuánto cuesta el envío?" → envios).
const PRIORIDAD = [
  'asesor_humano',
  'libro_reclamaciones',
  'estado_pedido',
  'envios',
  'medios_pago',
  'trazabilidad',
  'catalogo',
  'saludo',
];

// Sugerencias rápidas por defecto (las del panel de chat) y las del fallback.
const SUGERENCIAS = ['envios', 'estado_pedido', 'medios_pago', 'asesor_humano'];
const SUGERENCIAS_FALLBACK = ['envios', 'estado_pedido', 'asesor_humano'];

/** Minúsculas, sin tildes ni diéresis, solo letras, números y guiones, espacios simples. */
export const normalizar = (texto) =>
  texto
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]+/g, ' ')
    .trim();

/** Código de pedido en el mensaje: KD-000123, kd 000123 o KD000123 → 'KD-000123'. */
export const extraerCodigoPedido = (texto) => {
  const coincidencia = /\bkd[\s-]?(\d{1,6})\b/i.exec(texto);
  return coincidencia ? formatearCodigo(Number(coincidencia[1])) : null;
};

// ¿Aparece la palabra clave en el mensaje normalizado? (ver formato en chatbot.textos.js)
const coincide = (tokens, frase, clave) => {
  if (clave.includes(' ')) return ` ${frase} `.includes(` ${clave}`);
  const exacta = clave.endsWith('$') || clave.length < 4;
  const palabra = clave.replace(/\$$/, '');
  return tokens.some((t) => (exacta ? t === palabra : t.startsWith(palabra)));
};

/**
 * Intención del mensaje. Un código de pedido decide por sí solo; si no, gana la intención con
 * más palabras clave (una frase vale 2) y la prioridad desempata. Sin coincidencias: fallback.
 */
export const detectarIntencion = (mensaje) => {
  const codigoPedido = extraerCodigoPedido(mensaje);
  if (codigoPedido) return { intencion: 'estado_pedido', codigoPedido };

  const frase = normalizar(mensaje);
  const tokens = frase.split(' ').filter(Boolean);
  const puntajes = Object.fromEntries(
    Object.entries(PALABRAS_CLAVE).map(([intencion, claves]) => [
      intencion,
      claves.reduce(
        (total, clave) =>
          total + (coincide(tokens, frase, clave) ? (clave.includes(' ') ? 2 : 1) : 0),
        0,
      ),
    ]),
  );

  const candidatas = PRIORIDAD.filter((i) => puntajes[i] > 0);
  const sinSaludo = candidatas.filter((i) => i !== 'saludo');
  const opciones = sinSaludo.length ? sinSaludo : candidatas;
  if (!opciones.length) return { intencion: 'fallback', codigoPedido: null };

  const maximo = Math.max(...opciones.map((i) => puntajes[i]));
  return { intencion: opciones.find((i) => puntajes[i] === maximo), codigoPedido: null };
};

// ─────────────────────────── Respuestas ───────────────────────────

const soles = (monto, idioma) =>
  new Intl.NumberFormat(idioma === 'en' ? 'en-US' : idioma === 'de' ? 'de-DE' : 'es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(Number(monto));

const fechaLarga = (fecha, idioma) =>
  new Intl.DateTimeFormat(idioma === 'en' ? 'en-US' : idioma === 'de' ? 'de-DE' : 'es-PE', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  }).format(new Date(fecha));

const sugerenciasDe = (textos, claves, excluir) =>
  claves.filter((c) => c !== excluir).map((c) => textos.sugerencias[c]);

const ORDEN_ZONAS = ['nacional', 'latam', 'norteamerica', 'europa', 'resto_mundo'];

// Zonas, plazos y costo base leídos de tarifas_envio (no fijos en el código).
const responderEnvios = async (textos, idioma) => {
  const tarifas = await tarifaEnvioRepository.findAll();
  if (!tarifas.length) return { texto: textos.envios.sinTarifas, enlaces: [] };

  const porZona = ORDEN_ZONAS.map((zona) => [zona, tarifas.filter((t) => t.zona === zona)]).filter(
    ([, filas]) => filas.length,
  );
  const lineas = porZona.map(([zona, filas]) => {
    const metodos = filas
      .sort((a, b) => (a.metodo === 'estandar' ? -1 : b.metodo === 'estandar' ? 1 : 0))
      .map((t) =>
        textos.envios.tarifa(
          textos.metodos[t.metodo] ?? t.metodo,
          t.diasMin,
          t.diasMax,
          soles(t.costoBasePen, idioma),
        ),
      );
    return `• ${textos.zonas[zona] ?? zona}: ${metodos.join(' · ')}`;
  });

  return {
    texto: [textos.envios.intro, ...lineas, textos.envios.cierre].join('\n'),
    enlaces: [{ texto: textos.envios.enlace, url: '/terminos#envios' }],
  };
};

// Categorías con su número de productos y tres destacados, con enlaces al catálogo.
const responderCatalogo = async (textos) => {
  const [categorias, destacados] = await Promise.all([
    catalogoRepository.findCategorias(),
    productoRepository.findDestacados({ limit: 3 }),
  ]);
  const nombre = (c) => textos.categorias[c.slug] ?? c.nombre;
  const lineas = categorias.map(
    (c) => `${nombre(c)} (${textos.catalogo.producto(Number(c.totalProductos ?? 0))})`,
  );

  return {
    texto: [
      textos.catalogo.texto(lineas),
      ...(destacados.length ? [textos.catalogo.destacados] : []),
    ].join(' '),
    enlaces: [
      ...categorias.map((c) => ({ texto: nombre(c), url: `/catalogo?categoria=${c.slug}` })),
      ...destacados.map((p) => ({ texto: p.nombre, url: `/producto/${p.slug}` })),
      { texto: textos.catalogo.todo, url: '/catalogo' },
    ],
  };
};

/**
 * Estado de un pedido. Solo se revela a su dueño con sesión: un pedido ajeno o inexistente
 * responde igual ("no lo encontré en tu cuenta"), así no se puede averiguar si un código existe.
 * Tampoco los administradores ven pedidos ajenos desde el chat.
 */
const responderEstadoPedido = async (textos, idioma, codigo, usuario) => {
  const t = textos.estado_pedido;
  if (!codigo) {
    return {
      texto: t.sinCodigo,
      enlaces: [
        usuario
          ? { texto: t.misPedidos, url: '/cuenta' }
          : { texto: t.iniciarSesion, url: '/login?redirect=%2Fcuenta' },
      ],
    };
  }
  if (!usuario) {
    return {
      texto: t.sinSesion(codigo),
      enlaces: [
        {
          texto: t.iniciarSesion,
          url: `/login?redirect=${encodeURIComponent(`/pedido/${codigo}`)}`,
        },
      ],
    };
  }

  const pedido = await pedidoRepository.findByCodigo(codigo);
  if (!pedido || pedido.usuarioId !== usuario.id) {
    return { texto: t.noEncontrado(codigo), enlaces: [{ texto: t.misPedidos, url: '/cuenta' }] };
  }

  const historial = pedido.historialEstados ?? [];
  const ultimo = historial.at(-1);
  const fecha = ultimo?.creadoEn ?? pedido.actualizadoEn ?? pedido.creadoEn;
  return {
    texto: t.estado(
      codigo,
      textos.estados[pedido.estado] ?? pedido.estado,
      fechaLarga(fecha, idioma),
    ),
    enlaces: [{ texto: t.verPedido(codigo), url: `/pedido/${codigo}` }],
  };
};

// WhatsApp y correo de atención: configurables (CHATBOT_WHATSAPP, CHATBOT_CORREO).
const responderAsesor = (textos) => {
  const { CHATBOT_WHATSAPP: whatsapp, CHATBOT_CORREO: correo } = env;
  const digitos = whatsapp?.replace(/\D/g, '');
  return {
    texto: textos.asesor_humano.texto(whatsapp, correo),
    enlaces: [
      ...(digitos
        ? [{ texto: textos.asesor_humano.whatsapp, url: `https://wa.me/${digitos}` }]
        : []),
      { texto: textos.asesor_humano.correo, url: `mailto:${correo}` },
    ],
  };
};

/**
 * Responde un mensaje del chat en el idioma de la interfaz.
 * → { intencion, texto, sugerencias[], enlaces[{ texto, url }] }
 */
export const responder = async ({ mensaje, idioma = 'es' }, usuario = null) => {
  const textos = TEXTOS[idioma] ?? TEXTOS.es;
  const { intencion, codigoPedido } = detectarIntencion(mensaje);

  let respuesta;
  switch (intencion) {
    case 'saludo':
      respuesta = { texto: textos.saludo, enlaces: [] };
      break;
    case 'envios':
      respuesta = await responderEnvios(textos, idioma);
      break;
    case 'medios_pago':
      respuesta = {
        texto: textos.medios_pago.texto,
        enlaces: [{ texto: textos.medios_pago.enlace, url: '/terminos#pagos' }],
      };
      break;
    case 'catalogo':
      respuesta = await responderCatalogo(textos);
      break;
    case 'estado_pedido':
      respuesta = await responderEstadoPedido(textos, idioma, codigoPedido, usuario);
      break;
    case 'libro_reclamaciones':
      respuesta = {
        texto: textos.libro_reclamaciones.texto,
        enlaces: [{ texto: textos.libro_reclamaciones.enlace, url: '/libro-reclamaciones' }],
      };
      break;
    case 'trazabilidad':
      respuesta = {
        texto: textos.trazabilidad.texto,
        enlaces: [
          { texto: textos.trazabilidad.enlaceMapa, url: '/#trazabilidad-titulo' },
          { texto: textos.trazabilidad.enlaceCatalogo, url: '/catalogo' },
        ],
      };
      break;
    case 'asesor_humano':
      respuesta = responderAsesor(textos);
      break;
    default:
      return {
        intencion: 'fallback',
        texto: textos.fallback,
        sugerencias: sugerenciasDe(textos, SUGERENCIAS_FALLBACK),
        enlaces: [],
      };
  }

  return {
    intencion,
    ...respuesta,
    sugerencias: sugerenciasDe(textos, SUGERENCIAS, intencion).slice(0, 3),
  };
};
