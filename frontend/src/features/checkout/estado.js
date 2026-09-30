// Estado del checkout. Vive en la página (no en cada paso) para poder volver atrás sin perder
// datos. Los datos de la tarjeta nunca se guardan fuera de la memoria.

export const NUEVA = 'nueva';
export const PASOS = ['envio', 'metodo', 'pago', 'confirmar'];

export const estadoInicial = (usuario) => ({
  paso: 0,
  envio: {
    // null = aún no eligió: se usa la dirección principal (o una nueva si no tiene)
    seleccion: null,
    nueva: {
      nombreDestinatario: usuario ? `${usuario.nombre} ${usuario.apellido}`.trim() : '',
      paisCodigo: usuario?.paisCodigo ?? '',
      ciudad: '',
      direccion: '',
      codigoPostal: '',
      telefono: usuario?.telefono ?? '',
    },
    guardar: true,
  },
  metodoEnvio: 'estandar',
  pago: {
    metodo: null,
    tarjeta: { numero: '', titular: '', vencimiento: '', cvv: '' },
    correoPaypal: usuario?.correo ?? '',
    telefono: '',
  },
  // Rechazo de la pasarela (tarjeta 0002): se muestra en el paso de pago
  rechazo: null,
});

export function checkoutReducer(estado, accion) {
  switch (accion.type) {
    case 'ir':
      return { ...estado, paso: accion.paso };
    case 'envio':
      return { ...estado, envio: { ...estado.envio, ...accion.cambios } };
    case 'metodoEnvio':
      return { ...estado, metodoEnvio: accion.metodo };
    case 'pago':
      return { ...estado, pago: { ...estado.pago, ...accion.cambios }, rechazo: null };
    case 'rechazo':
      // Vuelve al paso de pago y borra el CVV (como haría una pasarela real)
      return {
        ...estado,
        paso: PASOS.indexOf('pago'),
        rechazo: accion.rechazo,
        pago: { ...estado.pago, tarjeta: { ...estado.pago.tarjeta, cvv: '' } },
      };
    default:
      return estado;
  }
}

// Dirección efectiva: la elegida, la principal o una nueva si no hay guardadas.
export const seleccionEfectiva = (seleccion, direcciones = []) =>
  seleccion ?? direcciones.find((d) => d.esPrincipal)?.id ?? direcciones[0]?.id ?? NUEVA;

export const paisDestino = (seleccion, envio, direcciones = []) =>
  seleccion === NUEVA
    ? envio.nueva.paisCodigo || null
    : (direcciones.find((d) => d.id === seleccion)?.paisCodigo ?? null);

/** Cuerpo de POST /pedidos a partir del estado y de los datos ya validados. */
export function cuerpoPedido({ seleccion, envio, metodoEnvio, moneda, pago, direccionValida }) {
  const destino =
    seleccion === NUEVA
      ? { direccion: direccionValida, guardarDireccion: envio.guardar }
      : { direccionId: seleccion };

  let datosPago;
  if (pago.metodo === 'tarjeta') datosPago = { metodo: 'tarjeta', tarjeta: pago.datos };
  else if (pago.metodo === 'paypal') datosPago = { metodo: 'paypal', ...pago.datos };
  else datosPago = { metodo: pago.metodo, ...pago.datos };

  return { ...destino, metodoEnvio, moneda, pago: datosPago };
}
