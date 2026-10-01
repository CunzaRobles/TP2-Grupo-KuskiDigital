import { ChevronLeft, ChevronRight, Expand, ImageOff } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useViewTransitionState } from 'react-router';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { NOMBRE_IMAGEN_PRODUCTO, transicion } from '@/lib/motion';
import { cn } from '@/lib/utils';

const FLECHA =
  'absolute top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-puna shadow-lift transition-colors hover:bg-white';

/**
 * Galería de la ficha: foto principal con zoom al pasar el cursor (solo con mouse), miniaturas
 * y visor ampliado (clic en la foto o botón "Ampliar", útil en pantallas táctiles).
 */
export function Galeria({ imagenes, nombre, agotado = false }) {
  const { t } = useTranslation();
  const [indice, setIndice] = useState(0);
  const [visor, setVisor] = useState(false);
  // Destino (o origen) de la View Transition: la foto de la tarjeta se expande hasta aquí
  const { pathname } = useLocation();
  const transicionando = useViewTransitionState(pathname);
  const total = imagenes.length;
  const actual = imagenes[Math.min(indice, total - 1)];

  const mover = (paso) => setIndice((i) => (i + paso + total) % total);

  // El zoom sigue al cursor: se ajusta el origen de la transformación sin re-renderizar.
  const alMover = (evento) => {
    const caja = evento.currentTarget.getBoundingClientRect();
    const x = ((evento.clientX - caja.left) / caja.width) * 100;
    const y = ((evento.clientY - caja.top) / caja.height) * 100;
    evento.currentTarget.style.setProperty('--zoom-origen', `${x}% ${y}%`);
  };

  if (!actual) {
    return (
      <div className="flex aspect-4/5 items-center justify-center rounded-2xl bg-muted">
        <ImageOff className="size-10 text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[4.5rem_1fr] lg:gap-5">
      <div className="relative lg:order-2">
        <button
          type="button"
          onClick={() => setVisor(true)}
          onMouseMove={alMover}
          aria-label={t('producto.galeria.ampliar')}
          className="group relative block aspect-4/5 w-full cursor-zoom-in overflow-hidden rounded-2xl bg-muted shadow-card"
          style={{ viewTransitionName: transicionando ? NOMBRE_IMAGEN_PRODUCTO : undefined }}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.img
              key={actual.url}
              src={actual.url}
              alt={actual.textoAlt ?? nombre}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transicion('base')}
              decoding="async"
              fetchPriority={indice === 0 ? 'high' : undefined}
              className={cn(
                'absolute inset-0 size-full object-cover [transform-origin:var(--zoom-origen,50%_50%)]',
                'transition-transform duration-300 ease-andino pointer-fine:group-hover:scale-200',
                agotado && 'grayscale-[40%]',
              )}
            />
          </AnimatePresence>
          <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-puna shadow-soft transition-opacity group-hover:opacity-0">
            <Expand className="size-3.5" aria-hidden="true" />
            {t('producto.galeria.zoom')}
          </span>
        </button>

        {total > 1 && (
          <p className="sr-only" aria-live="polite">
            {t('producto.galeria.posicion', { n: indice + 1, total })}
          </p>
        )}
      </div>

      {total > 1 && (
        <ul
          className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin] lg:order-1 lg:flex-col lg:overflow-visible"
          aria-label={t('producto.galeria.miniaturas')}
        >
          {imagenes.map((imagen, i) => (
            <li key={imagen.url} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndice(i)}
                aria-label={t('producto.galeria.ver', { n: i + 1, total })}
                aria-current={i === indice || undefined}
                className={cn(
                  'block aspect-4/5 w-16 overflow-hidden rounded-lg border-2 transition-[border-color,opacity] duration-200 lg:w-full',
                  i === indice
                    ? 'border-primary'
                    : 'border-transparent opacity-70 hover:opacity-100',
                )}
              >
                <img
                  src={imagen.url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={visor} onOpenChange={setVisor}>
        <DialogContent className="max-w-4xl gap-4 bg-white p-3 sm:p-4">
          <DialogTitle className="sr-only">{nombre}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('producto.galeria.posicion', { n: indice + 1, total })}
          </DialogDescription>
          <div className="relative">
            <img
              src={actual.url}
              alt={actual.textoAlt ?? nombre}
              className="max-h-[80dvh] w-full rounded-xl object-contain"
            />
            {total > 1 && (
              <>
                <button
                  type="button"
                  className={cn(FLECHA, 'left-3')}
                  onClick={() => mover(-1)}
                  aria-label={t('producto.galeria.anterior')}
                >
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={cn(FLECHA, 'right-3')}
                  onClick={() => mover(1)}
                  aria-label={t('producto.galeria.siguiente')}
                >
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
