import {
  correo,
  DIAS_DEVOLUCION,
  EMPRESA,
  fichaEmpresa,
  filasEnvio,
  RUTA_LIBRO_RECLAMACIONES,
} from './comun';

export default {
  resumen:
    'Condiciones de uso y de compra de Kuski Digital, la tienda en línea de Kuski Agroindustria S.A., conforme al Código de Protección y Defensa del Consumidor (Ley 29571) y demás normas peruanas.',
  secciones: [
    {
      id: 'identificacion',
      titulo: 'Identificación del proveedor',
      bloques: [
        `${EMPRESA.sitio} es la tienda en línea de **${EMPRESA.razonSocial}**, empresa agroindustrial de Cusco, Perú, que comercializa productos de la biodiversidad andina elaborados por comunidades productoras identificadas.`,
        {
          lista: fichaEmpresa({
            razonSocial: 'Razón social',
            ruc: 'RUC',
            domicilio: 'Domicilio',
            ubicacion: { etiqueta: 'Sede', valor: 'Cusco, Perú' },
            atencion: 'Atención al cliente',
            privacidad: 'Privacidad y datos personales',
          }),
        },
      ],
    },
    {
      id: 'objeto',
      titulo: 'Objeto y aceptación',
      bloques: [
        'Estos Términos regulan el uso de la tienda y la compra de sus productos: café, superalimentos, textiles de alpaca y artesanía.',
        'Al crear una cuenta o hacer un pedido declaras haberlos leído y aceptado, junto con la [Política de Privacidad](/privacidad). Rige la versión publicada en esta página, con su fecha de última actualización; los cambios posteriores no afectan a los pedidos ya confirmados.',
      ],
    },
    {
      id: 'cuenta',
      titulo: 'Registro y cuenta',
      bloques: [
        'Para comprar necesitas una cuenta con datos veraces: nombre, apellido, correo electrónico, país y una contraseña. Debes ser mayor de edad o contar con la autorización de tu madre, padre o tutor.',
        `Eres responsable de mantener tu contraseña en reserva. Si sospechas que alguien más usa tu cuenta, escríbenos de inmediato a ${correo(EMPRESA.correoAtencion)}.`,
        'Podemos suspender una cuenta que se use de forma fraudulenta o contraria a estos Términos; te informaremos el motivo.',
      ],
    },
    {
      id: 'precios',
      titulo: 'Precios, monedas e impuestos',
      bloques: [
        'Los precios se fijan en soles (PEN). Mientras navegas, los montos en dólares (USD) o euros (EUR) son una conversión referencial con el tipo de cambio vigente en la tienda. Al confirmar el pedido, el tipo de cambio queda registrado y el total en la moneda elegida es el que se cobra. Tu banco o medio de pago puede aplicar comisiones o un tipo de cambio propio.',
        'El **IGV (18 %)** se aplica solo a los pedidos con destino a Perú y se muestra por separado en el resumen. Los envíos al extranjero no llevan IGV; los impuestos o aranceles de importación del país de destino, si los hubiera, corren por cuenta del destinatario.',
        'Antes de pagar verás el desglose completo: subtotal, envío, IGV si corresponde y total. No hay cargos ocultos.',
        'Los precios y la disponibilidad pueden cambiar; tu pedido conserva el precio vigente al confirmarlo. Si un precio se publicara con un error evidente, te avisaremos y podrás confirmar el pedido con el precio correcto o anularlo con reembolso total.',
      ],
    },
    {
      id: 'pagos',
      titulo: 'Medios de pago',
      bloques: [
        {
          lista: [
            '**Tarjeta de crédito o débito** (Visa y Mastercard).',
            '**PayPal.**',
            '**Yape y Plin**, billeteras digitales disponibles en Perú.',
          ],
        },
        'El pago se procesa a través de la pasarela del medio elegido. Kuski no guarda el número completo de tu tarjeta ni su código de seguridad: solo los 4 últimos dígitos y el número de operación, como comprobante.',
        'El pedido se confirma cuando el pago es aprobado. Si se rechaza, no se realiza ningún cargo y puedes intentarlo con otro medio.',
      ],
    },
    {
      id: 'envios',
      titulo: 'Envíos',
      bloques: [
        'Enviamos a todo Perú y al extranjero con dos métodos, **estándar** y **express**. El costo depende del país de destino, del peso del pedido y del método, y se calcula en el checkout antes de pagar.',
        {
          tabla: {
            leyenda: 'Plazos estimados de entrega por zona, en días desde la confirmación del pago',
            columnas: ['Zona de destino', 'Estándar', 'Express'],
            filas: filasEnvio(
              {
                nacional: 'Perú',
                latam: 'Latinoamérica',
                norteamerica: 'Norteamérica',
                europa: 'Europa',
                resto_mundo: 'Resto del mundo',
              },
              (min, max) => `${min} a ${max} días`,
            ),
          },
        },
      ],
    },
    {
      id: 'plazos',
      titulo: 'Plazos de entrega y seguimiento',
      bloques: [
        'Los plazos son estimados y se indican también en el checkout y en la confirmación del pedido. Puedes seguir cada etapa (confirmado, preparando, en tránsito y entregado) desde Mi cuenta.',
        'Si el pedido no llega en el plazo indicado por causas atribuibles a Kuski, puedes elegir entre esperar la entrega sin costo adicional o anular el pedido con la devolución total de lo pagado. Te informaremos apenas conozcamos un retraso de aduanas o del transportista.',
      ],
    },
    {
      id: 'devoluciones',
      titulo: 'Cambios y devoluciones',
      bloques: [
        `Tienes **${DIAS_DEVOLUCION} días calendario desde la entrega** para pedir el cambio o la devolución de un producto sin indicar el motivo, siempre que esté sin usar y en su empaque original.`,
        'Por razones de salud e higiene, no se aceptan devoluciones de alimentos cuyo envase se haya abierto o cuyo precinto se haya roto.',
        'Si el producto llega dañado, defectuoso o no corresponde con lo ofrecido, tienes derecho a su reposición, a un producto equivalente o a la devolución de lo pagado, a tu elección, conforme a la Ley 29571. En ese caso Kuski asume el costo del envío de retorno.',
        `Para solicitarlo, escríbenos a ${correo(EMPRESA.correoAtencion)} con el número de pedido. En las devoluciones sin motivo, el envío de retorno corre por tu cuenta. Reembolsamos por el mismo medio de pago dentro de los ${DIAS_DEVOLUCION} días siguientes a la recepción del producto.`,
      ],
    },
    {
      id: 'reclamaciones',
      titulo: 'Libro de Reclamaciones',
      bloques: [
        `Conforme al Código de Protección y Defensa del Consumidor, ponemos a tu disposición un [Libro de Reclamaciones virtual](${RUTA_LIBRO_RECLAMACIONES}). Un **reclamo** expresa tu disconformidad con un producto o servicio; una **queja**, tu malestar con la atención recibida.`,
        'Responderemos dentro del plazo que fija la normativa vigente (15 días hábiles). Presentar un reclamo no te impide acudir a otras vías de solución ni al INDECOPI.',
      ],
    },
    {
      id: 'propiedad-intelectual',
      titulo: 'Propiedad intelectual',
      bloques: [
        'La marca Kuski, su logotipo, los textos, el diseño de la tienda y los demás contenidos propios pertenecen a Kuski Agroindustria S.A. o se usan con autorización. Las fotografías de terceros se usan conforme a sus licencias.',
        'No está permitido reproducirlos, distribuirlos ni modificarlos con fines comerciales sin autorización escrita.',
      ],
    },
    {
      id: 'ley-aplicable',
      titulo: 'Ley aplicable y jurisdicción',
      bloques: [
        'Estos Términos se rigen por las leyes de la República del Perú. Las controversias se someterán a los jueces y tribunales de Cusco, sin perjuicio de tu derecho a acudir al INDECOPI.',
        'Si resides en la Unión Europea, conservas además la protección que te otorgan las normas imperativas de consumo de tu país de residencia.',
      ],
    },
  ],
};
