import * as tarifaEnvioRepository from '../../repositories/tarifa-envio.repository.js';
import { MockShippingProvider } from './mock-shipping-provider.js';

// Punto único de cambio: sustituir por el courier real sin tocar los servicios.
export const shippingProvider = new MockShippingProvider({
  obtenerTarifasPorZona: tarifaEnvioRepository.findByZona,
});
