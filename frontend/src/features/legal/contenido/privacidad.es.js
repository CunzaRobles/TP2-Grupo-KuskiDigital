import { correo, EMPRESA, fichaEmpresa } from './comun';

export default {
  resumen:
    'Cómo tratamos tus datos personales en Kuski Digital, conforme a la Ley 29733, Ley de Protección de Datos Personales, y su Reglamento (D.S. 016-2024-JUS). Si resides en la Unión Europea, también se aplica el Reglamento General de Protección de Datos (RGPD).',
  secciones: [
    {
      id: 'responsable',
      titulo: 'Responsable del tratamiento',
      bloques: [
        `**${EMPRESA.razonSocial}**, con sede en Cusco, Perú, es responsable de los datos personales que se recogen en esta tienda.`,
        {
          lista: fichaEmpresa({
            razonSocial: 'Razón social',
            ruc: 'RUC',
            domicilio: 'Domicilio',
            ubicacion: { etiqueta: 'Sede', valor: 'Cusco, Perú' },
            privacidad: 'Contacto de privacidad',
          }),
        },
      ],
    },
    {
      id: 'datos',
      titulo: 'Datos que recogemos',
      bloques: [
        'Solo guardamos lo necesario para tu cuenta y tus pedidos:',
        {
          lista: [
            '**Cuenta:** nombre, apellido, correo electrónico, país, idioma y moneda preferidos, y tu contraseña cifrada con bcrypt (nunca en texto plano).',
            '**Teléfono**, si lo indicas en tu cuenta o en una dirección.',
            '**Direcciones de envío:** destinatario, país, ciudad, dirección, código postal y teléfono.',
            '**Pedidos:** productos, montos, moneda y tipo de cambio, método y estado del envío, y una copia de la dirección de entrega.',
            '**Pagos:** método, estado y número de operación. Si pagas con tarjeta, solo los 4 últimos dígitos: nunca el número completo ni el código de seguridad.',
            '**Reseñas** que publiques: calificación y comentario.',
          ],
        },
        'No usamos herramientas de analítica ni de publicidad, y no elaboramos perfiles.',
      ],
    },
    {
      id: 'finalidades',
      titulo: 'Para qué los usamos',
      bloques: [
        {
          lista: [
            'Crear y gestionar tu cuenta.',
            'Procesar tus pedidos, pagos y envíos, y mostrarte su seguimiento.',
            'Atender cambios, devoluciones, reclamos y consultas.',
            'Enviarte correos sobre tu cuenta y tus pedidos. No enviamos publicidad sin tu consentimiento.',
            'Cumplir obligaciones legales, contables y tributarias.',
            'Proteger la tienda frente a fraudes y accesos no autorizados.',
          ],
        },
      ],
    },
    {
      id: 'base-legal',
      titulo: 'Base legal',
      bloques: [
        {
          lista: [
            '**Ejecución del contrato:** la cuenta, los pedidos, los pagos, los envíos y la atención posventa.',
            '**Consentimiento:** el que otorgas al registrarte aceptando esta Política. Puedes revocarlo en cualquier momento, sin efecto retroactivo.',
            '**Obligación legal:** conservar comprobantes y registros exigidos por las normas tributarias y de protección al consumidor.',
            '**Interés legítimo:** la seguridad de la tienda y la prevención del fraude.',
          ],
        },
        'Para clientes de la Unión Europea, estas bases corresponden al artículo 6.1, letras b), a), c) y f), del RGPD.',
      ],
    },
    {
      id: 'transferencias',
      titulo: 'Destinatarios y transferencia internacional',
      bloques: [
        'La base de datos de la tienda está alojada en **Supabase** y su API en **Vercel**, ambas en servidores de **São Paulo, Brasil**. Esto supone un flujo transfronterizo de datos personales, que realizamos solo para prestar el servicio y con proveedores que ofrecen garantías contractuales de protección de datos.',
        'Compartimos con terceros solo lo imprescindible: el transportista recibe el nombre, la dirección y el teléfono de entrega, y la pasarela de pago, los datos de la operación.',
        'Al navegar, tu navegador descarga tipografías de Google Fonts, fotografías de Unsplash y, en los mapas, imágenes de Stadia Maps. Estos proveedores reciben tu dirección IP para entregarlas.',
        'No vendemos ni cedemos tus datos con fines comerciales.',
      ],
    },
    {
      id: 'conservacion',
      titulo: 'Plazo de conservación',
      bloques: [
        {
          lista: [
            '**Datos de la cuenta:** mientras la mantengas. Si pides su cancelación, los eliminamos o anonimizamos, salvo los que debamos conservar por ley.',
            '**Pedidos, pagos y comprobantes:** durante los plazos que exigen las normas tributarias y de protección al consumidor.',
            '**Sesión:** la cookie de sesión caduca a los 7 días o al cerrar sesión.',
            '**Preferencias en tu navegador:** hasta que las borres.',
          ],
        },
      ],
    },
    {
      id: 'seguridad',
      titulo: 'Medidas de seguridad',
      bloques: [
        {
          lista: [
            'Contraseñas cifradas con bcrypt.',
            'Conexión cifrada (HTTPS) en toda la tienda.',
            'Sesión en una cookie httpOnly, que el código de la página no puede leer.',
            'Control de acceso por roles: el personal solo ve la información que necesita para su función.',
            'Base de datos sin acceso público directo: solo la API de la tienda puede consultarla.',
            'Límite de intentos de inicio de sesión y de registro contra ataques de fuerza bruta.',
          ],
        },
      ],
    },
    {
      id: 'derechos',
      titulo: 'Tus derechos (ARCO)',
      bloques: [
        'Puedes ejercer en cualquier momento tus derechos de:',
        {
          lista: [
            '**Acceso:** saber qué datos tuyos tratamos y cómo.',
            '**Rectificación:** corregir datos inexactos o incompletos.',
            '**Cancelación:** pedir que eliminemos tus datos cuando ya no sean necesarios.',
            '**Oposición:** oponerte a un tratamiento por un motivo legítimo.',
          ],
        },
        `Para ejercerlos, escribe a ${correo(EMPRESA.correoPrivacidad)} desde el correo de tu cuenta, indicando el derecho que ejerces y adjuntando una copia de tu documento de identidad (o el de tu representante, con el poder correspondiente). Responderemos dentro de los plazos que fija el Reglamento de la Ley 29733. Tus direcciones puedes corregirlas directamente en Mi cuenta.`,
        'Si no estás conforme con la respuesta, puedes presentar una reclamación ante la Autoridad Nacional de Protección de Datos Personales del Ministerio de Justicia y Derechos Humanos.',
        { subtitulo: 'Clientes de la Unión Europea' },
        'El RGPD te reconoce además los derechos de limitación del tratamiento y de portabilidad, y a presentar una reclamación ante la autoridad de protección de datos de tu país.',
      ],
    },
    {
      id: 'cookies',
      titulo: 'Cookies y almacenamiento local',
      bloques: [
        'Usamos una sola cookie, imprescindible para que funcione la tienda, y guardamos tus preferencias en el almacenamiento local de tu navegador:',
        {
          tabla: {
            leyenda: 'Cookie y datos que la tienda guarda en tu navegador',
            columnas: ['Nombre', 'Tipo', 'Para qué', 'Duración'],
            filas: [
              [
                'kuski_token',
                'Cookie httpOnly',
                'Mantener tu sesión iniciada',
                '7 días o hasta cerrar sesión',
              ],
              [
                'kuski.idioma',
                'Almacenamiento local',
                'Recordar el idioma elegido',
                'Hasta que la borres',
              ],
              [
                'kuski.moneda',
                'Almacenamiento local',
                'Recordar la moneda elegida',
                'Hasta que la borres',
              ],
              [
                'kuski.carrito',
                'Almacenamiento local',
                'Guardar tu carrito si compras sin iniciar sesión',
                'Hasta que la borres',
              ],
            ],
          },
        },
        'El almacenamiento local queda en tu navegador. Solo el contenido del carrito se envía a la tienda, para calcular sus precios y unirlo al de tu cuenta cuando inicias sesión.',
        'No usamos cookies de analítica, de publicidad ni de terceros; por eso no te pedimos un consentimiento de cookies aparte.',
      ],
    },
    {
      id: 'cambios',
      titulo: 'Cambios en esta Política',
      bloques: [
        'Si cambiamos esta Política, publicaremos la nueva versión en esta página con su fecha de actualización y, si el cambio es relevante, te lo avisaremos por correo.',
      ],
    },
  ],
};
