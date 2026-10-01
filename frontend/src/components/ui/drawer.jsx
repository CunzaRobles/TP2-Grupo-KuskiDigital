import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Dialog as DrawerPrimitive } from 'radix-ui';
import { createContext, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { transicion } from '@/lib/motion';
import { usePortalContainer } from '@/lib/portal-container';
import { cn } from '@/lib/utils';

// Panel lateral (carrito, filtros en móvil). Radix Dialog: foco atrapado, Escape y scroll bloqueado.
// La entrada es física (resorte suave de Motion) y la salida, un deslizamiento corto. Con
// movimiento reducido, MotionConfig (reducedMotion="user") quita el desplazamiento: solo funde.

const DrawerAbierto = createContext(false);

export function Drawer({ open: openProp, defaultOpen = false, onOpenChange, children, ...props }) {
  const [openInterno, setOpenInterno] = useState(defaultOpen);
  const controlado = openProp !== undefined;
  const open = controlado ? openProp : openInterno;

  const cambiar = (valor) => {
    if (!controlado) setOpenInterno(valor);
    onOpenChange?.(valor);
  };

  return (
    <DrawerPrimitive.Root open={open} onOpenChange={cambiar} {...props}>
      <DrawerAbierto value={open}>{children}</DrawerAbierto>
    </DrawerPrimitive.Root>
  );
}

export const DrawerTrigger = DrawerPrimitive.Trigger;
export const DrawerClose = DrawerPrimitive.Close;

const LADOS = {
  right: 'inset-y-0 right-0 h-full w-full max-w-md border-l',
  left: 'inset-y-0 left-0 h-full w-full max-w-sm border-r',
  bottom: 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-dialog border-t',
};

const FUERA = {
  right: { x: '100%' },
  left: { x: '-100%' },
  bottom: { y: '100%' },
};

// Resorte suave: llega en ~0.45 s con un rebote apenas perceptible
const RESORTE = { type: 'spring', visualDuration: 0.45, bounce: 0.12 };

export function DrawerContent({ side = 'right', className, children, ...props }) {
  const { t } = useTranslation();
  const container = usePortalContainer();
  const open = useContext(DrawerAbierto);

  return (
    <AnimatePresence>
      {open && (
        <DrawerPrimitive.Portal forceMount container={container}>
          <DrawerPrimitive.Overlay forceMount asChild>
            <motion.div
              data-slot="dialog-overlay"
              className="fixed inset-0 z-50 bg-overlay backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transicion('base')}
            />
          </DrawerPrimitive.Overlay>
          <DrawerPrimitive.Content forceMount asChild {...props}>
            <motion.div
              data-slot="drawer-content"
              className={cn(
                'fixed z-50 flex flex-col bg-popover text-popover-foreground shadow-sheet',
                LADOS[side],
                className,
              )}
              initial={FUERA[side]}
              animate={{ x: 0, y: 0, transition: RESORTE }}
              exit={{ ...FUERA[side], transition: transicion('base') }}
            >
              {children}
              <DrawerPrimitive.Close
                className="absolute top-4 right-4 inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label={t('ui.cerrar')}
              >
                <X className="size-5" aria-hidden="true" />
              </DrawerPrimitive.Close>
            </motion.div>
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Portal>
      )}
    </AnimatePresence>
  );
}

export function DrawerHeader({ className, ...props }) {
  return <div className={cn('grid gap-1 border-b px-6 py-5 pr-16', className)} {...props} />;
}

export function DrawerBody({ className, ...props }) {
  return <div className={cn('flex-1 overflow-y-auto px-6 py-5', className)} {...props} />;
}

export function DrawerFooter({ className, ...props }) {
  return <div className={cn('grid gap-3 border-t bg-surface px-6 py-5', className)} {...props} />;
}

export function DrawerTitle({ className, ...props }) {
  return <DrawerPrimitive.Title className={cn('text-h3 font-heading', className)} {...props} />;
}

export function DrawerDescription({ className, ...props }) {
  return (
    <DrawerPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}
