import { X } from 'lucide-react';
import { Dialog as DrawerPrimitive } from 'radix-ui';
import { useTranslation } from 'react-i18next';
import { usePortalContainer } from '@/lib/portal-container';
import { cn } from '@/lib/utils';
import { DialogOverlay } from './dialog';

// Panel lateral (carrito, filtros en móvil). Radix Dialog: foco atrapado, Escape y scroll bloqueado.
export const Drawer = DrawerPrimitive.Root;
export const DrawerTrigger = DrawerPrimitive.Trigger;
export const DrawerClose = DrawerPrimitive.Close;

const LADOS = {
  right:
    'inset-y-0 right-0 h-full w-full max-w-md border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
  left: 'inset-y-0 left-0 h-full w-full max-w-sm border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
  bottom:
    'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-dialog border-t data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
};

export function DrawerContent({ side = 'right', className, children, ...props }) {
  const { t } = useTranslation();
  const container = usePortalContainer();

  return (
    <DrawerPrimitive.Portal container={container}>
      <DialogOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          'fixed z-50 flex flex-col bg-popover text-popover-foreground shadow-sheet',
          'duration-300 ease-andino data-[state=open]:animate-in data-[state=closed]:animate-out',
          LADOS[side],
          className,
        )}
        {...props}
      >
        {children}
        <DrawerPrimitive.Close
          className="absolute top-4 right-4 inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={t('ui.cerrar')}
        >
          <X className="size-5" aria-hidden="true" />
        </DrawerPrimitive.Close>
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
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
