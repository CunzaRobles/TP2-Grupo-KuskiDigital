import { Truck, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui/alert';
import { Price } from '@/components/ui/price';
import { RadioCard, RadioCardGroup } from '@/components/ui/radio-card';
import { Skeleton } from '@/components/ui/skeleton';
import { mensajeError } from '@/lib/errores';
import { formatDate } from '@/lib/format';
import { Paso } from './paso';

const ICONOS = { estandar: Truck, express: Zap };

// Rango de llegada estimado a partir de hoy: "8 – 14 oct."
function rangoLlegada(diasMin, diasMax, idioma) {
  const fecha = (dias) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return formatDate(d, idioma, { day: 'numeric', month: 'short' });
  };
  return `${fecha(diasMin)} – ${fecha(diasMax)}`;
}

/**
 * Paso 2 · Método de envío: cada opción muestra transportista, días, fecha estimada y precio
 * en la moneda elegida (lo que se ve aquí es exactamente lo que se cobra).
 */
export function PasoMetodo({ cotizacion, metodoEnvio, onElegir, onVolver, onContinuar }) {
  const { t, i18n } = useTranslation();
  const opciones = cotizacion.data?.opcionesEnvio ?? [];

  return (
    <Paso
      titulo={t('checkout.metodo.titulo')}
      descripcion={t('checkout.metodo.descripcion')}
      onVolver={onVolver}
      onContinuar={onContinuar}
      continuarDeshabilitado={!cotizacion.data}
    >
      {cotizacion.isError && !cotizacion.data ? (
        <Alert variante="error" titulo={mensajeError(t, cotizacion.error)} />
      ) : cotizacion.isPending ? (
        <div className="grid gap-3" aria-hidden="true">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : (
        <RadioCardGroup
          value={metodoEnvio}
          onValueChange={onElegir}
          aria-label={t('checkout.metodo.titulo')}
        >
          {opciones.map((o) => {
            const Icono = ICONOS[o.metodo] ?? Truck;
            return (
              <RadioCard key={o.metodo} value={o.metodo} className="items-center">
                <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <span className="flex items-center gap-2 font-semibold">
                    <Icono className="size-4 text-verde" aria-hidden="true" />
                    {t(`checkout.metodo.${o.metodo}`)}
                  </span>
                  <Price amount={o.costo} currency={cotizacion.data.moneda} animate />
                </span>
                <span className="text-sm text-muted-foreground">
                  {t('checkout.metodo.detalle', {
                    transportista: o.transportista,
                    min: o.diasMin,
                    max: o.diasMax,
                  })}
                </span>
                <span className="text-sm">
                  {t('checkout.metodo.llegada', {
                    rango: rangoLlegada(o.diasMin, o.diasMax, i18n.resolvedLanguage),
                  })}
                </span>
              </RadioCard>
            );
          })}
        </RadioCardGroup>
      )}
    </Paso>
  );
}
