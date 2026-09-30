import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { transicion } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * Progreso del checkout (Envío → Método → Pago → Confirmar).
 * Los pasos ya completados son botones: volver atrás no pierde datos porque el estado vive en el padre.
 *
 * @param {{ id: string, label: string }[]} steps
 * @param {number} current  índice del paso actual (0…n-1)
 * @param {(index: number) => void} [onStepClick]
 */
export function Stepper({ steps, current, onStepClick, className }) {
  const { t } = useTranslation();
  const total = steps.length;
  const progreso = total > 1 ? current / (total - 1) : 1;

  return (
    <nav
      aria-label={t('ui.paso', { actual: current + 1, total })}
      className={cn('w-full', className)}
    >
      {/* Móvil: texto compacto + barra */}
      <div className="flex items-baseline justify-between gap-3 sm:hidden">
        <p className="text-sm font-semibold">{steps[current]?.label}</p>
        <p className="text-xs text-muted-foreground">
          {t('ui.paso', { actual: current + 1, total })}
        </p>
      </div>
      <div
        className="mt-2 h-1 overflow-hidden rounded-full bg-secondary sm:hidden"
        aria-hidden="true"
      >
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${((current + 1) / total) * 100}%` }}
          transition={transicion('lenta')}
        />
      </div>

      {/* Escritorio: pasos con conectores */}
      <div className="relative hidden sm:block">
        <div className="absolute top-4 right-4 left-4 h-0.5 bg-border" aria-hidden="true">
          <motion.div
            className="h-full origin-left bg-primary"
            initial={false}
            animate={{ scaleX: progreso }}
            transition={transicion('lenta')}
          />
        </div>

        <ol className="relative flex items-start justify-between">
          {steps.map((step, i) => {
            const estado = i < current ? 'completado' : i === current ? 'actual' : 'pendiente';
            const clicable = estado === 'completado' && onStepClick;
            const Comp = clicable ? 'button' : 'div';

            return (
              <li
                key={step.id}
                className="relative z-10 flex flex-1 flex-col items-center first:items-start last:items-end"
              >
                <Comp
                  {...(clicable && { type: 'button', onClick: () => onStepClick(i) })}
                  aria-current={estado === 'actual' ? 'step' : undefined}
                  className={cn(
                    'group flex flex-col items-center gap-2 rounded-md text-center',
                    clicable && 'cursor-pointer',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors duration-300 ease-andino',
                      estado === 'completado' &&
                        'border-primary bg-primary text-primary-foreground group-hover:bg-primary-hover',
                      estado === 'actual' && 'border-primary bg-background text-link',
                      estado === 'pendiente' && 'border-border bg-background text-muted-foreground',
                    )}
                  >
                    {estado === 'completado' ? (
                      <Check className="size-4" aria-hidden="true" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={cn(
                      'text-sm',
                      estado === 'pendiente'
                        ? 'text-muted-foreground'
                        : 'font-semibold text-foreground',
                      clicable && 'group-hover:underline',
                    )}
                  >
                    {step.label}
                    {estado !== 'pendiente' && (
                      <span className="sr-only"> ({t(`ui.${estado}`)})</span>
                    )}
                  </span>
                </Comp>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
