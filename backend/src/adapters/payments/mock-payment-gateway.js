import { randomInt } from 'node:crypto';
import { PaymentGateway } from './payment-gateway.js';

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const digitos = (n) => Array.from({ length: n }, () => randomInt(10)).join('');

// Sufijo de tarjeta que la pasarela simulada siempre rechaza (demo de manejo de errores).
export const SUFIJO_TARJETA_RECHAZADA = '0002';

/**
 * Pasarela simulada: aprueba por defecto, rechaza las tarjetas terminadas en 0002,
 * devuelve un código de aprobación de 6 dígitos para Yape/Plin y tarda entre
 * latenciaMinMs y latenciaMaxMs para que la interfaz muestre su estado de carga.
 */
export class MockPaymentGateway extends PaymentGateway {
  constructor({ latenciaMinMs = 1000, latenciaMaxMs = 2000 } = {}) {
    super();
    this.latenciaMinMs = latenciaMinMs;
    this.latenciaMaxMs = Math.max(latenciaMinMs, latenciaMaxMs);
  }

  async procesarPago({ metodo, monto, moneda, referencia, tarjeta, telefono }) {
    if (this.latenciaMaxMs > 0) {
      await esperar(randomInt(this.latenciaMinMs, this.latenciaMaxMs + 1));
    }

    const base = {
      pasarela: 'simulada',
      numeroOperacion: `SIM-${Date.now().toString().slice(-8)}${digitos(4)}`,
      codigoAprobacion: null,
      tarjetaUltimos4: null,
    };
    const importe = `${moneda} ${Number(monto).toFixed(2)}`;

    if (metodo === 'tarjeta') {
      const numero = String(tarjeta?.numero ?? '').replace(/\D/g, '');
      const tarjetaUltimos4 = numero.slice(-4);
      if (numero.endsWith(SUFIJO_TARJETA_RECHAZADA)) {
        return {
          ...base,
          tarjetaUltimos4,
          aprobado: false,
          estado: 'rechazado',
          mensaje: 'Tarjeta rechazada por el banco emisor: fondos insuficientes',
        };
      }
      return {
        ...base,
        tarjetaUltimos4,
        aprobado: true,
        estado: 'aprobado',
        mensaje: `Pago con tarjeta aprobado: ${importe} (${referencia})`,
      };
    }

    if (metodo === 'yape' || metodo === 'plin') {
      const codigoAprobacion = digitos(6);
      const nombre = metodo === 'yape' ? 'Yape' : 'Plin';
      return {
        ...base,
        codigoAprobacion,
        aprobado: true,
        estado: 'aprobado',
        mensaje: `${nombre} aprobado desde el celular ***${String(telefono ?? '').slice(-3)}: ${importe}. Código de aprobación ${codigoAprobacion}`,
      };
    }

    // PayPal
    return {
      ...base,
      aprobado: true,
      estado: 'aprobado',
      mensaje: `Pago con PayPal aprobado: ${importe} (${referencia})`,
    };
  }
}
