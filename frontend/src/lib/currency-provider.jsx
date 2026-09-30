import { useCallback, useMemo, useState } from 'react';
import {
  CurrencyContext,
  MONEDAS,
  esMonedaValida,
  guardarMoneda,
  leerMonedaGuardada,
} from './currency';

// Moneda elegida por el visitante (PEN/USD/EUR), persistida en localStorage.
// Las consultas a la API la envían como ?moneda= para que el backend convierta los precios.
export function CurrencyProvider({ children, initialMoneda }) {
  const [moneda, setMonedaState] = useState(() => initialMoneda ?? leerMonedaGuardada());

  const setMoneda = useCallback((nueva) => {
    if (!esMonedaValida(nueva)) return;
    setMonedaState(nueva);
    guardarMoneda(nueva);
  }, []);

  const value = useMemo(() => ({ moneda, setMoneda, monedas: MONEDAS }), [moneda, setMoneda]);

  return <CurrencyContext value={value}>{children}</CurrencyContext>;
}
