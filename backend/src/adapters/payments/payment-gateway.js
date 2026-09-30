/**
 * Contrato de la pasarela de pago. Para usar un proveedor real (Izipay, Niubiz, PayPal...)
 * basta con otra clase que implemente procesarPago y cambiarla en adapters/payments/index.js.
 *
 * procesarPago({ metodo, monto, moneda, referencia, tarjeta?, telefono?, correoPaypal? })
 * resuelve con:
 *   {
 *     aprobado: boolean,
 *     estado: 'aprobado' | 'rechazado',
 *     pasarela: string,
 *     numeroOperacion: string,
 *     codigoAprobacion: string | null,   // Yape / Plin
 *     tarjetaUltimos4: string | null,    // nunca el número completo
 *     mensaje: string,
 *   }
 */
export class PaymentGateway {
  async procesarPago(_solicitud) {
    throw new Error('PaymentGateway.procesarPago no está implementado');
  }
}
