import { QueryClientProvider } from '@tanstack/react-query';
import { LazyMotion, MotionConfig } from 'motion/react';
import { useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { CarritoProvider } from '@/features/carrito/carrito-provider';
import { CurrencyProvider } from '@/lib/currency-provider';
import { createQueryClient } from '@/lib/query-client';
import '@/lib/i18n';

// Las funciones de animación de Motion (lib/motion/funciones.js) se piden con el navegador en
// reposo, después del primer pintado: hasta entonces los componentes `m` muestran su estado final.
const enReposo = () =>
  new Promise((listo) =>
    'requestIdleCallback' in window ? requestIdleCallback(listo, { timeout: 1500 }) : listo(),
  );
const cargarFuncionesMotion = () =>
  enReposo()
    .then(() => import('@/lib/motion/funciones'))
    .then((m) => m.default);

// reducedMotion="user": Motion desactiva transformaciones si el sistema pide menos movimiento.
export function Providers({ children }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <CarritoProvider>
          <LazyMotion features={cargarFuncionesMotion}>
            <MotionConfig reducedMotion="user">
              {children}
              <Toaster />
            </MotionConfig>
          </LazyMotion>
        </CarritoProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
}
