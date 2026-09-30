import { ExchangeRateProvider } from './exchange-rate-provider.js';

const aTasa = (fila) => ({
  moneda: fila.monedaCodigo,
  simbolo: fila.simbolo,
  valorEnPen: Number(fila.valorEnPen),
});

/**
 * Tipo de cambio simulado: tabla fija tipos_cambio (PEN/USD/EUR).
 * Un proveedor real (API de SUNAT o del BCRP) implementaría la misma interfaz.
 */
export class TablaExchangeRateProvider extends ExchangeRateProvider {
  constructor({ buscarPorMoneda, listar }) {
    super();
    this.buscarPorMoneda = buscarPorMoneda;
    this.listar = listar;
  }

  async obtenerTasa(moneda) {
    const fila = await this.buscarPorMoneda(moneda);
    if (!fila) throw new Error(`Moneda sin tipo de cambio: ${moneda}`);
    return aTasa(fila);
  }

  async listarTasas() {
    return (await this.listar()).map(aTasa);
  }
}
