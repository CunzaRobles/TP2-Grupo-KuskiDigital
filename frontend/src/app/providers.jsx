import { QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { CarritoProvider } from '@/features/carrito/carrito-provider';
import { CurrencyProvider } from '@/lib/currency-provider';
import { createQueryClient } from '@/lib/query-client';
import '@/lib/i18n';

// reducedMotion="user": Motion desactiva transformaciones si el sistema pide menos movimiento.
export function Providers({ children }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <CarritoProvider>
          <MotionConfig reducedMotion="user">
            {children}
            <Toaster />
          </MotionConfig>
        </CarritoProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
}
