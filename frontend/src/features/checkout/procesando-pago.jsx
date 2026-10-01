import { Check, LoaderCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { EASE_ANDINO } from '@/lib/motion';

const ETAPAS = ['conectando', 'verificando', 'confirmando'];

/**
 * Pantalla de "procesando pago" mientras la pasarela simulada responde (1–2 s). No se puede
 * cerrar: evita pagar dos veces o salir a mitad de la operación.
 */
export function ProcesandoPago({ abierto, metodo }) {
  const { t } = useTranslation();
  const app = metodo === 'yape' || metodo === 'plin' ? t(`checkout.pago.metodos.${metodo}`) : null;

  return (
    <Dialog open={abierto}>
      <DialogContent
        showClose={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-sm justify-items-center text-center"
      >
        <span className="relative flex size-16 items-center justify-center">
          <span
            className="absolute inset-0 animate-ping rounded-full bg-ichu/30"
            aria-hidden="true"
          />
          <LoaderCircle className="size-10 animate-spin text-primary" aria-hidden="true" />
        </span>
        <div className="grid gap-2">
          <DialogTitle>{t('checkout.procesando.titulo')}</DialogTitle>
          <DialogDescription>
            {app ? t('checkout.procesando.app', { app }) : t('checkout.procesando.descripcion')}
          </DialogDescription>
        </div>
        <ol className="grid w-full gap-2 text-left text-sm" aria-hidden="true">
          {ETAPAS.map((etapa, i) => (
            <motion.li
              key={etapa}
              initial={{ opacity: 0.35 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.6, duration: 0.3, ease: EASE_ANDINO }}
              className="flex items-center gap-2"
            >
              <Check className="size-4 text-musgo" />
              {t(`checkout.procesando.etapas.${etapa}`)}
            </motion.li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
