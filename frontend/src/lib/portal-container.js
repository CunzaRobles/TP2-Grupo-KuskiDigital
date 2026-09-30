import { createContext, useContext } from 'react';

// Contenedor donde se montan los portales (Dialog, Drawer, Select). Dentro de un <ThemeScope>
// apunta al propio scope, así el contenido flotante hereda el tema (p. ej. .dark del admin).
export const PortalContainerContext = createContext(undefined);

export const usePortalContainer = () => useContext(PortalContainerContext);
