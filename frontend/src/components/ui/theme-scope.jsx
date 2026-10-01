import { useEffect, useState } from 'react';
import { PortalContainerContext } from '@/lib/portal-container';
import { cn } from '@/lib/utils';

// El admin conserva "editorial andino": Fraunces + Manrope, que la tienda no descarga.
const FUENTES_ADMIN =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Manrope:wght@400..700&display=swap';
const ID_FUENTES = 'kuski-fuentes-admin';

function useFuentesAdmin() {
  useEffect(() => {
    if (document.getElementById(ID_FUENTES)) return;
    const link = Object.assign(document.createElement('link'), {
      id: ID_FUENTES,
      rel: 'stylesheet',
      href: FUENTES_ADMIN,
    });
    document.head.appendChild(link);
  }, []);
}

// Tema del panel admin para un subárbol (clase .admin de tokens.css), en modo claro u oscuro.
// La tienda no lo usa: su tema son los tokens de :root.
export function ThemeScope({ theme = 'light', className, children, ...props }) {
  const [contenedor, setContenedor] = useState(null);
  useFuentesAdmin();

  return (
    <div
      ref={setContenedor}
      data-theme={theme}
      className={cn(
        'admin',
        theme === 'dark' && 'dark',
        'bg-background text-foreground',
        className,
      )}
      {...props}
    >
      <PortalContainerContext value={contenedor ?? undefined}>{children}</PortalContainerContext>
    </div>
  );
}
