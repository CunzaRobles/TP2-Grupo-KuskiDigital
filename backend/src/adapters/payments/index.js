import { env } from '../../config/env.js';
import { MockPaymentGateway } from './mock-payment-gateway.js';

// Punto único de cambio: sustituir por la pasarela real sin tocar los servicios.
export const paymentGateway = new MockPaymentGateway({
  latenciaMinMs: env.PAGO_LATENCIA_MIN_MS,
  latenciaMaxMs: env.PAGO_LATENCIA_MAX_MS,
});
