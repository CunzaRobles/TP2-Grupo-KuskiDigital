import { Check, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { transicion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useAgregarProducto } from './use-agregar-producto';
import { useConfirmacion } from './use-confirmacion';

/**
 * Botón "+" de las tarjetas: agrega una unidad sin salir de la página, hace volar la foto
 * (`imagenRef`) al carrito y confirma con "Agregado" durante 1.5 s (el botón se ensancha para
 * mostrar el texto y vuelve solo). La confirmación se anuncia también a lectores de pantalla.
 */
export function BotonAgregar({ producto, imagenRef, className }) {
  const { t } = useTranslation();
  const agregarProducto = useAgregarProducto();
  const [agregado, confirmar] = useConfirmacion();

  const alAgregar = () => {
    if (agregarProducto(producto, imagenRef?.current)) confirmar();
  };

  return (
    <>
      <motion.button
        type="button"
        layout
        transition={transicion('rapida')}
        onClick={alAgregar}
        disabled={!producto.disponible}
        aria-label={t('carrito.agregarProducto', { nombre: producto.nombre })}
        style={{ borderRadius: 9999 }}
        className={cn(
          'relative z-10 inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 text-sm font-semibold',
          'transition-colors duration-200 ease-andino active:scale-95',
          'disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground',
          agregado
            ? 'bg-musgo px-4 text-white'
            : 'bg-primary text-primary-foreground hover:bg-primary-hover',
          className,
        )}
      >
        <motion.span layout="position" className="inline-flex">
          {agregado ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Plus className="size-5" aria-hidden="true" />
          )}
        </motion.span>
        {agregado && (
          <motion.span layout="position" aria-hidden="true">
            {t('carrito.agregadoCorto')}
          </motion.span>
        )}
      </motion.button>
      <span className="sr-only" role="status">
        {agregado ? t('carrito.agregadoProducto', { nombre: producto.nombre }) : ''}
      </span>
    </>
  );
}
