import { randomInt } from 'node:crypto';
import { redondear } from '../../utils/money.js';
import { ShippingProvider } from './shipping-provider.js';
import { zonaDePais } from './zonas.js';

const ORDEN_METODOS = { estandar: 0, express: 1 };
const digitos = (n) => Array.from({ length: n }, () => randomInt(10)).join('');

// Formato de guía verosímil según el transportista.
const generarCodigoSeguimiento = (transportista, paisCodigo) => {
  if (/dhl/i.test(transportista)) return `DHL${digitos(10)}`;
  if (/serpost/i.test(transportista)) return `RR${digitos(9)}PE`;
  if (/olva/i.test(transportista)) return `OLV-${digitos(8)}`;
  return `KD${paisCodigo}${digitos(10)}`;
};

const sumarDias = (fecha, dias) => {
  const d = new Date(fecha);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

/**
 * Proveedor de envíos simulado sobre la tabla tarifas_envio:
 * costo = costo_base_pen + costo_por_kg_pen × peso en kg.
 * Recibe la función que lee las tarifas de una zona (inyección de dependencias).
 */
export class MockShippingProvider extends ShippingProvider {
  constructor({ obtenerTarifasPorZona, ahora = () => new Date() }) {
    super();
    this.obtenerTarifasPorZona = obtenerTarifasPorZona;
    this.ahora = ahora;
  }

  async cotizar({ paisCodigo, pesoG }) {
    const zona = zonaDePais(paisCodigo);
    const tarifas = await this.obtenerTarifasPorZona(zona);
    const kg = pesoG / 1000;

    const opciones = tarifas
      .map((t) => ({
        tarifaEnvioId: t.id,
        metodo: t.metodo,
        transportista: t.transportista,
        costoPen: redondear(Number(t.costoBasePen) + Number(t.costoPorKgPen) * kg),
        diasMin: t.diasMin,
        diasMax: t.diasMax,
      }))
      .sort((a, b) => ORDEN_METODOS[a.metodo] - ORDEN_METODOS[b.metodo]);

    return { zona, opciones };
  }

  async generarEnvio({ paisCodigo, metodo, pesoG }) {
    const { opciones } = await this.cotizar({ paisCodigo, pesoG });
    const opcion = opciones.find((o) => o.metodo === metodo);
    if (!opcion) throw new Error(`No hay tarifa ${metodo} para ${paisCodigo}`);

    return {
      tarifaEnvioId: opcion.tarifaEnvioId,
      transportista: opcion.transportista,
      metodo,
      codigoSeguimiento: generarCodigoSeguimiento(opcion.transportista, paisCodigo),
      fechaEstimada: sumarDias(this.ahora(), opcion.diasMax),
    };
  }
}
