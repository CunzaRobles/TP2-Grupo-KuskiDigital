/**
 * Contrato del proveedor de envíos (courier / DHL).
 *
 * cotizar({ paisCodigo, pesoG }) → {
 *   zona,
 *   opciones: [{ tarifaEnvioId, metodo, transportista, costoPen, diasMin, diasMax }]
 * }
 * generarEnvio({ paisCodigo, metodo, pesoG, referencia }) → {
 *   tarifaEnvioId, transportista, metodo, codigoSeguimiento, fechaEstimada (YYYY-MM-DD)
 * }
 */
export class ShippingProvider {
  async cotizar(_solicitud) {
    throw new Error('ShippingProvider.cotizar no está implementado');
  }

  async generarEnvio(_solicitud) {
    throw new Error('ShippingProvider.generarEnvio no está implementado');
  }
}
