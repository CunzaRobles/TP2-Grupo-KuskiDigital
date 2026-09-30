import { useState } from 'react';
import { PortalContainerContext } from '@/lib/portal-container';
import { cn } from '@/lib/utils';

// Aplica un tema a un subárbol. La tienda siempre es clara; el modo oscuro solo existe en el admin.
export function ThemeScope({ theme = 'light', className, children, ...props }) {
  const [contenedor, setContenedor] = useState(null);

  return (
    <div
      ref={setContenedor}
      data-theme={theme}
      className={cn(theme === 'dark' && 'dark', 'bg-background text-foreground', className)}
      {...props}
    >
      <PortalContainerContext value={contenedor ?? undefined}>{children}</PortalContainerContext>
    </div>
  );
}
