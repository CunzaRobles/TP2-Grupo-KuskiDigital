import { createContext, useContext } from 'react';

export const LenisContext = createContext(null);

// Ref a la instancia activa de Lenis: ref.current es null con movimiento reducido o fuera de la
// tienda. Para uso imperativo: useLenisRef().current?.scrollTo(0).
export const useLenisRef = () => useContext(LenisContext);
