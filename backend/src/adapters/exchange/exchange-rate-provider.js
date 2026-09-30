/**
 * Contrato del proveedor de tipo de cambio.
 *
 * obtenerTasa(moneda) → { moneda, simbolo, valorEnPen }  (1 unidad de la moneda = valorEnPen soles)
 * listarTasas()       → [{ moneda, simbolo, valorEnPen }]
 */
export class ExchangeRateProvider {
  async obtenerTasa(_moneda) {
    throw new Error('ExchangeRateProvider.obtenerTasa no está implementado');
  }

  async listarTasas() {
    throw new Error('ExchangeRateProvider.listarTasas no está implementado');
  }
}
