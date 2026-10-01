import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from 'lucide-react';
import { Toaster as Sonner } from 'sonner';

// Notificaciones (sonner). Se disparan con `toast()` de ./toast.js.
export function Toaster(props) {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      closeButton
      icons={{
        success: <CircleCheck className="size-5 text-success" />,
        error: <CircleAlert className="size-5 text-destructive" />,
        warning: <TriangleAlert className="size-5 text-error" />,
        info: <Info className="size-5 text-muted-foreground" />,
        loading: <LoaderCircle className="size-5 animate-spin text-muted-foreground" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            'group !gap-3 !rounded-popover !border !border-border !bg-popover !text-popover-foreground !shadow-overlay !font-sans',
          title: '!text-sm !font-semibold',
          description: '!text-sm !text-muted-foreground',
          actionButton: '!rounded-button !bg-primary !text-primary-foreground !font-semibold',
          cancelButton: '!rounded-button !bg-secondary !text-secondary-foreground',
          closeButton: '!border-border !bg-popover !text-muted-foreground',
        },
      }}
      {...props}
    />
  );
}
