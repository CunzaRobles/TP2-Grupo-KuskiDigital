import { createContext, useContext } from 'react';

export const MONEDAS = ['PEN', 'USD', 'EUR'];
export const MONEDA_POR_DEFECTO = 'PEN';
export const CLAVE_MONEDA = 'kuski.moneda';

export const esMonedaValida = (valor) => MONEDAS.includes(valor);

// localStorage puede no existir o lanzar (modo privado, datos del sitio bloqueados)
export const leerMonedaGuardada = () => {
  try {
    const guardada = window.localStorage.getItem(CLAVE_MONEDA);
    return esMonedaValida(guardada) ? guardada : MONEDA_POR_DEFECTO;
  } catch {
    return MONEDA_POR_DEFECTO;
  }
};

export const guardarMoneda = (moneda) => {
  try {
    window.localStorage.setItem(CLAVE_MONEDA, moneda);
  } catch {
    // sin persistencia: la moneda se mantiene solo en memoria
  }
};

export const CurrencyContext = createContext(null);

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency debe usarse dentro de <CurrencyProvider>');
  return ctx;
};
