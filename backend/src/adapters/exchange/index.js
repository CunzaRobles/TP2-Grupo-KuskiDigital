import * as tipoCambioRepository from '../../repositories/tipo-cambio.repository.js';
import { TablaExchangeRateProvider } from './tabla-exchange-rate-provider.js';

// Punto único de cambio: sustituir por una API de tipo de cambio real sin tocar los servicios.
export const exchangeRateProvider = new TablaExchangeRateProvider({
  buscarPorMoneda: tipoCambioRepository.findByMoneda,
  listar: tipoCambioRepository.findAll,
});
