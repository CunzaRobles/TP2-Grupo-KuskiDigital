// Datos del asistente virtual: palabras clave por intención y textos de respuesta en es/en/de.
// Las palabras clave están normalizadas (minúsculas, sin tildes ni diéresis, ß → ss):
//   - una palabra de 4 letras o más coincide como prefijo ("envio" → "envios", "enviar"...);
//   - una más corta, o terminada en $, debe coincidir exacta ("hi", "estado$": no "estados");
//   - una frase coincide si aparece en el mensaje empezando en un límite de palabra.
// Se buscan las de los tres idiomas a la vez: se puede escribir en cualquiera.

export const PALABRAS_CLAVE = {
  saludo: [
    'hola',
    'buenas',
    'buenos dias',
    'que tal',
    'saludos',
    'hello',
    'hi',
    'hey',
    'good morning',
    'good afternoon',
    'good evening',
    'hallo',
    'guten tag',
    'guten morgen',
    'guten abend',
    'servus',
    'moin',
    'gruss',
  ],
  envios: [
    'envio',
    'enviar',
    'envian',
    'despacho',
    'despachan',
    'courier',
    'delivery',
    'tarda',
    'demora',
    'plazo',
    'zona',
    'internacional',
    'extranjero',
    'dhl',
    'olva',
    'serpost',
    'flete',
    'costo de envio',
    'cuanto cuesta el envio',
    'cuanto tarda',
    'shipping',
    'ship',
    'deliver',
    'abroad',
    'how long',
    'arrive',
    'versand',
    'liefer',
    'zustell',
    'porto',
    'dauert',
    'ausland',
  ],
  medios_pago: [
    'pago',
    'pagar',
    'tarjeta',
    'paypal',
    'yape',
    'plin',
    'visa',
    'mastercard',
    'debito',
    'credito',
    'efectivo',
    'transferencia',
    'payment',
    'pay',
    'card',
    'credit',
    'debit',
    'cash',
    'zahl',
    'bezahl',
    'karte',
    'kreditkarte',
    'uberweisung',
  ],
  catalogo: [
    'catalogo',
    'producto',
    'categoria',
    'cafe',
    'quinua',
    'maca',
    'chia',
    'kiwicha',
    'cacao',
    'alpaca',
    'textil',
    'chompa',
    'artesan',
    'superaliment',
    'comprar',
    'venden',
    'tienen',
    'precio',
    'destacado',
    'recomienda',
    'catalog',
    'product',
    'categor',
    'coffee',
    'buy',
    'sell',
    'price',
    'featured',
    'recommend',
    'katalog',
    'produkt',
    'kategorie',
    'kaffee',
    'kaufen',
    'preis',
    'sortiment',
    'empfehl',
  ],
  estado_pedido: [
    'pedido',
    'orden$',
    'estado$',
    'seguimiento',
    'tracking',
    'rastreo',
    'mi compra',
    'donde esta',
    'cuando llega',
    'order',
    'status',
    'track',
    'where is',
    'my purchase',
    'bestellung',
    'sendungsverfolgung',
    'auftrag',
    'wo ist',
    'wann kommt',
  ],
  libro_reclamaciones: [
    'reclamo',
    'reclamacion',
    'queja',
    'libro de reclamaciones',
    'indecopi',
    'denuncia',
    'complaint',
    'claim',
    'complaints book',
    'beschwerde',
    'reklamation',
  ],
  trazabilidad: [
    'trazab',
    'comunidad',
    'origen',
    'altitud',
    'msnm',
    'productor',
    'agricultor',
    'de donde',
    'quien produce',
    'traceab',
    'origin',
    'communit',
    'altitude',
    'farmer',
    'producer',
    'where does',
    'who makes',
    'herkunft',
    'gemeinschaft',
    'hohenlage',
    'ruckverfolg',
    'bauer',
    'erzeuger',
    'woher',
  ],
  asesor_humano: [
    'asesor',
    'humano',
    'persona',
    'agente',
    'operador',
    'hablar con',
    'atencion al cliente',
    'whatsapp',
    'contacto',
    'contactar',
    'telefono',
    'llamar',
    'advisor',
    'adviser',
    'human',
    'agent',
    'person',
    'someone',
    'support',
    'contact',
    'talk to',
    'speak to',
    'customer service',
    'berater',
    'mensch',
    'mitarbeiter',
    'kontakt',
    'sprechen',
    'kundenservice',
    'kundendienst',
  ],
};

const estados = (pendiente, pagado, preparando, enTransito, entregado, cancelado) => ({
  pendiente,
  pagado,
  preparando,
  en_transito: enTransito,
  entregado,
  cancelado,
});

export const TEXTOS = {
  es: {
    sugerencias: {
      envios: '¿Cuánto cuesta el envío?',
      estado_pedido: 'Estado de mi pedido',
      medios_pago: 'Medios de pago',
      asesor_humano: 'Hablar con un asesor',
      catalogo: 'Ver el catálogo',
      trazabilidad: '¿De dónde viene cada producto?',
    },
    saludo:
      '¡Hola! Soy el asistente virtual de Kuski. Puedo ayudarte con envíos, medios de pago, el catálogo o el estado de tu pedido.',
    fallback:
      'No entendí tu consulta. Prueba con una de estas opciones o escríbela con otras palabras.',
    zonas: {
      nacional: 'Perú',
      latam: 'Latinoamérica',
      norteamerica: 'Norteamérica',
      europa: 'Europa',
      resto_mundo: 'Resto del mundo',
    },
    metodos: { estandar: 'estándar', express: 'express' },
    envios: {
      intro: 'Enviamos a todo Perú y al mundo. Plazo y costo base por zona:',
      tarifa: (metodo, min, max, costo) => `${metodo} ${min}–${max} días (desde ${costo})`,
      sinTarifas: 'Ahora no puedo consultar las tarifas. Las verás en el checkout antes de pagar.',
      cierre:
        'El costo final depende del peso del pedido y se calcula en el checkout, antes de pagar. El IGV (18 %) solo se aplica a envíos dentro de Perú.',
      enlace: 'Condiciones de envío',
    },
    medios_pago: {
      texto:
        'Aceptamos tarjeta de crédito o débito (Visa y Mastercard), PayPal, y Yape o Plin. Yape y Plin solo están disponibles para pagos en soles (PEN). No guardamos el número completo de tu tarjeta.',
      enlace: 'Medios de pago en los Términos',
    },
    catalogo: {
      texto: (lineas) =>
        `Vendemos ${lineas.length} líneas de productos andinos: ${lineas.join(', ')}.`,
      destacados: 'Algunos destacados:',
      producto: (n) => (n === 1 ? '1 producto' : `${n} productos`),
      todo: 'Ver todo el catálogo',
    },
    categorias: {},
    estado_pedido: {
      sinCodigo:
        'Escríbeme el código de tu pedido (por ejemplo KD-000123). Lo encuentras en el correo de confirmación y en Mis pedidos.',
      sinSesion: (codigo) =>
        `Para consultar el pedido ${codigo} inicia sesión con la cuenta con la que lo compraste.`,
      noEncontrado: (codigo) =>
        `No encontré el pedido ${codigo} en tu cuenta. Revisa el código o mira tus pedidos.`,
      estado: (codigo, estado, fecha) =>
        `Tu pedido ${codigo} está: ${estado}. Última actualización: ${fecha}.`,
      iniciarSesion: 'Iniciar sesión',
      misPedidos: 'Mis pedidos',
      verPedido: (codigo) => `Ver el pedido ${codigo}`,
    },
    estados: estados(
      'Pendiente de pago',
      'Confirmado',
      'En preparación',
      'En tránsito',
      'Entregado',
      'Cancelado',
    ),
    libro_reclamaciones: {
      texto:
        'Puedes registrar un reclamo o una queja en nuestro Libro de Reclamaciones virtual. Te enviamos una copia por correo y respondemos en un plazo máximo de 15 días hábiles.',
      enlace: 'Libro de Reclamaciones',
    },
    trazabilidad: {
      texto:
        'Cada producto indica la comunidad productora que lo elabora y su altitud (msnm): lo ves en la tarjeta del producto y en la pestaña «Origen» de su ficha. En el inicio está el mapa de las comunidades, del valle a la cumbre.',
      enlaceMapa: 'Mapa de las comunidades',
      enlaceCatalogo: 'Ver productos',
    },
    asesor_humano: {
      texto: (whatsapp, correo) =>
        whatsapp
          ? `Una persona del equipo de Kuski te atiende por WhatsApp al ${whatsapp} o por correo en ${correo}.`
          : `Una persona del equipo de Kuski te atiende por correo en ${correo}.`,
      whatsapp: 'Escribir por WhatsApp',
      correo: 'Enviar un correo',
    },
  },
  en: {
    sugerencias: {
      envios: 'How much is shipping?',
      estado_pedido: 'Order status',
      medios_pago: 'Payment methods',
      asesor_humano: 'Talk to an advisor',
      catalogo: 'Browse the catalog',
      trazabilidad: 'Where does each product come from?',
    },
    saludo:
      'Hi! I am Kuski’s virtual assistant. I can help you with shipping, payment methods, the catalog or your order status.',
    fallback: 'I didn’t understand your question. Try one of these options or rephrase it.',
    zonas: {
      nacional: 'Peru',
      latam: 'Latin America',
      norteamerica: 'North America',
      europa: 'Europe',
      resto_mundo: 'Rest of the world',
    },
    metodos: { estandar: 'standard', express: 'express' },
    envios: {
      intro: 'We ship throughout Peru and worldwide. Delivery time and base cost by zone:',
      tarifa: (metodo, min, max, costo) => `${metodo} ${min}–${max} days (from ${costo})`,
      sinTarifas: 'I can’t check the rates right now. You will see them at checkout before paying.',
      cierre:
        'The final cost depends on the order weight and is calculated at checkout, before you pay. IGV (18 % Peruvian sales tax) only applies to orders shipped within Peru.',
      enlace: 'Shipping terms',
    },
    medios_pago: {
      texto:
        'We accept credit or debit cards (Visa and Mastercard), PayPal, and Yape or Plin. Yape and Plin are only available for payments in soles (PEN). We never store your full card number.',
      enlace: 'Payment methods in our Terms',
    },
    catalogo: {
      texto: (lineas) => `We sell ${lineas.length} lines of Andean products: ${lineas.join(', ')}.`,
      destacados: 'Some featured products:',
      producto: (n) => (n === 1 ? '1 product' : `${n} products`),
      todo: 'See the whole catalog',
    },
    categorias: {
      cafe: 'Coffee',
      superalimentos: 'Superfoods',
      textiles: 'Textiles',
      artesania: 'Handicrafts',
    },
    estado_pedido: {
      sinCodigo:
        'Send me your order number (for example KD-000123). You will find it in your confirmation email and in My orders.',
      sinSesion: (codigo) =>
        `To check order ${codigo}, sign in with the account you used to buy it.`,
      noEncontrado: (codigo) =>
        `I couldn’t find order ${codigo} in your account. Check the number or look at your orders.`,
      estado: (codigo, estado, fecha) =>
        `Your order ${codigo} is: ${estado}. Last update: ${fecha}.`,
      iniciarSesion: 'Sign in',
      misPedidos: 'My orders',
      verPedido: (codigo) => `View order ${codigo}`,
    },
    estados: estados(
      'Awaiting payment',
      'Confirmed',
      'Being prepared',
      'In transit',
      'Delivered',
      'Cancelled',
    ),
    libro_reclamaciones: {
      texto:
        'You can file a claim or complaint in our virtual Complaints Book (Libro de Reclamaciones). We email you a copy and reply within 15 business days at the latest.',
      enlace: 'Complaints Book',
    },
    trazabilidad: {
      texto:
        'Every product shows the producer community that makes it and its altitude (m a.s.l.): you can see it on the product card and in the “Origin” tab of its page. The home page has a map of the communities, from the valley to the heights.',
      enlaceMapa: 'Map of the communities',
      enlaceCatalogo: 'See products',
    },
    asesor_humano: {
      texto: (whatsapp, correo) =>
        whatsapp
          ? `A member of the Kuski team can help you on WhatsApp at ${whatsapp} or by email at ${correo}.`
          : `A member of the Kuski team can help you by email at ${correo}.`,
      whatsapp: 'Message us on WhatsApp',
      correo: 'Send an email',
    },
  },
  de: {
    sugerencias: {
      envios: 'Was kostet der Versand?',
      estado_pedido: 'Status meiner Bestellung',
      medios_pago: 'Zahlungsarten',
      asesor_humano: 'Mit einer Person sprechen',
      catalogo: 'Katalog ansehen',
      trazabilidad: 'Woher kommt jedes Produkt?',
    },
    saludo:
      'Hallo! Ich bin der virtuelle Assistent von Kuski. Ich helfe dir bei Versand, Zahlungsarten, dem Katalog oder dem Status deiner Bestellung.',
    fallback:
      'Das habe ich nicht verstanden. Probier eine dieser Optionen oder formuliere deine Frage anders.',
    zonas: {
      nacional: 'Peru',
      latam: 'Lateinamerika',
      norteamerica: 'Nordamerika',
      europa: 'Europa',
      resto_mundo: 'Übrige Welt',
    },
    metodos: { estandar: 'Standard', express: 'Express' },
    envios: {
      intro: 'Wir liefern in ganz Peru und weltweit. Lieferzeit und Grundpreis nach Zone:',
      tarifa: (metodo, min, max, costo) => `${metodo} ${min}–${max} Tage (ab ${costo})`,
      sinTarifas:
        'Ich kann die Tarife gerade nicht abrufen. Du siehst sie im Checkout vor der Zahlung.',
      cierre:
        'Die endgültigen Kosten hängen vom Gewicht ab und werden vor der Zahlung im Checkout berechnet. Die IGV (18 % peruanische Umsatzsteuer) fällt nur bei Lieferungen innerhalb Perus an.',
      enlace: 'Versandbedingungen',
    },
    medios_pago: {
      texto:
        'Wir akzeptieren Kredit- und Debitkarten (Visa und Mastercard), PayPal sowie Yape und Plin. Yape und Plin gibt es nur für Zahlungen in Soles (PEN). Deine vollständige Kartennummer speichern wir nie.',
      enlace: 'Zahlungsarten in den AGB',
    },
    catalogo: {
      texto: (lineas) =>
        `Wir verkaufen ${lineas.length} Linien andiner Produkte: ${lineas.join(', ')}.`,
      destacados: 'Einige Empfehlungen:',
      producto: (n) => (n === 1 ? '1 Produkt' : `${n} Produkte`),
      todo: 'Ganzen Katalog ansehen',
    },
    categorias: {
      cafe: 'Kaffee',
      superalimentos: 'Superfoods',
      textiles: 'Textilien',
      artesania: 'Kunsthandwerk',
    },
    estado_pedido: {
      sinCodigo:
        'Schick mir deine Bestellnummer (zum Beispiel KD-000123). Du findest sie in der Bestellbestätigung und unter Meine Bestellungen.',
      sinSesion: (codigo) =>
        `Um die Bestellung ${codigo} abzufragen, melde dich mit dem Konto an, mit dem du bestellt hast.`,
      noEncontrado: (codigo) =>
        `Ich habe die Bestellung ${codigo} in deinem Konto nicht gefunden. Prüfe die Nummer oder sieh dir deine Bestellungen an.`,
      estado: (codigo, estado, fecha) =>
        `Deine Bestellung ${codigo} ist: ${estado}. Letzte Aktualisierung: ${fecha}.`,
      iniciarSesion: 'Anmelden',
      misPedidos: 'Meine Bestellungen',
      verPedido: (codigo) => `Bestellung ${codigo} ansehen`,
    },
    estados: estados(
      'Zahlung ausstehend',
      'Bestätigt',
      'In Vorbereitung',
      'Unterwegs',
      'Zugestellt',
      'Storniert',
    ),
    libro_reclamaciones: {
      texto:
        'Du kannst eine Reklamation oder Beschwerde in unserem virtuellen Beschwerdebuch (Libro de Reclamaciones) einreichen. Du bekommst eine Kopie per E-Mail, und wir antworten innerhalb von höchstens 15 Werktagen.',
      enlace: 'Beschwerdebuch',
    },
    trazabilidad: {
      texto:
        'Jedes Produkt nennt die Erzeugergemeinschaft, die es herstellt, und ihre Höhenlage (m ü. M.): auf der Produktkarte und im Tab „Herkunft“ der Produktseite. Auf der Startseite findest du die Karte der Gemeinschaften, vom Tal bis in die Höhe.',
      enlaceMapa: 'Karte der Gemeinschaften',
      enlaceCatalogo: 'Produkte ansehen',
    },
    asesor_humano: {
      texto: (whatsapp, correo) =>
        whatsapp
          ? `Eine Person aus dem Kuski-Team hilft dir per WhatsApp unter ${whatsapp} oder per E-Mail an ${correo}.`
          : `Eine Person aus dem Kuski-Team hilft dir per E-Mail an ${correo}.`,
      whatsapp: 'Per WhatsApp schreiben',
      correo: 'E-Mail schreiben',
    },
  },
};
