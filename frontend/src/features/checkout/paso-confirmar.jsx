import { CreditCard, Lock, MapPin, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui/alert';
import { Price } from '@/components/ui/price';
import { mensajeError } from '@/lib/errores';
import { formatMoney } from '@/lib/format';
import { Link } from '@/lib/motion/enlaces';
import { Paso } from './paso';
import { DireccionTexto } from './paso-envio';
import { detectarMarca, enmascarar } from './tarjeta';

function Bloque({ icono: Icono, titulo, onEditar, children }) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-4 border-b pb-5 last:border-b-0 last:pb-0">
      <Icono className="mt-1 size-5 shrink-0 text-musgo" aria-hidden="true" />
      <div className="grid flex-1 gap-1">
        <h3 className="text-sm font-semibold">{titulo}</h3>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
      <button
        type="button"
        onClick={onEditar}
        className="h-fit rounded-sm text-sm font-semibold text-link hover:underline"
        aria-label={`${t('checkout.confirmar.editar')}: ${titulo}`}
      >
        {t('checkout.confirmar.editar')}
      </button>
    </div>
  );
}

export function DescripcionPago({ pago }) {
  const { t } = useTranslation();
  if (pago.metodo === 'tarjeta') {
    const marca = detectarMarca(pago.datos.numero);
    return `${marca ? t(`checkout.pago.marcas.${marca}`) : t('checkout.pago.metodos.tarjeta')} ${enmascarar(pago.datos.numero)}`;
  }
  if (pago.metodo === 'paypal') return `PayPal · ${pago.datos.correoPaypal}`;
  const tel = pago.datos.telefono;
  return `${t(`checkout.pago.metodos.${pago.metodo}`)} · ${tel.slice(0, 3)} *** ${tel.slice(-3)}`;
}

/**
 * Paso 4 · Confirmar: repaso de envío, método y pago (cada bloque se puede editar) y el botón
 * de pago con el total exacto.
 */
export function PasoConfirmar({
  direccion,
  opcionEnvio,
  pago,
  cotizacion,
  error,
  pagando,
  onEditar,
  onVolver,
  onPagar,
}) {
  const { t, i18n } = useTranslation();
  const total = cotizacion?.resumen.total;
  const moneda = cotizacion?.moneda;

  return (
    <Paso
      titulo={t('checkout.confirmar.titulo')}
      descripcion={t('checkout.confirmar.descripcion')}
      onVolver={onVolver}
      onContinuar={onPagar}
      cargando={pagando}
      continuarDeshabilitado={!cotizacion}
      iconoContinuar={null}
      textoContinuar={
        <>
          <Lock aria-hidden="true" />
          {total != null
            ? t('checkout.confirmar.pagar', {
                total: formatMoney(total, moneda, i18n.resolvedLanguage),
              })
            : t('checkout.confirmar.pagarSinTotal')}
        </>
      }
    >
      {error && (
        <Alert
          variante="error"
          titulo={mensajeError(t, error)}
          accion={
            (error.code === 'STOCK_INSUFICIENTE' || error.code === 'PRODUCTO_NO_ENCONTRADO') && (
              <Link to="/carrito" className="font-semibold text-link hover:underline">
                {t('checkout.confirmar.revisarCarrito')}
              </Link>
            )
          }
        />
      )}

      <div className="grid gap-5 rounded-xl border bg-card p-5">
        <Bloque icono={MapPin} titulo={t('checkout.confirmar.envioA')} onEditar={() => onEditar(0)}>
          <p className="font-medium text-foreground">{direccion.nombreDestinatario}</p>
          <DireccionTexto direccion={direccion} />
          {direccion.telefono && <p>{direccion.telefono}</p>}
        </Bloque>
        <Bloque icono={Truck} titulo={t('checkout.confirmar.metodo')} onEditar={() => onEditar(1)}>
          {opcionEnvio && (
            <p className="flex flex-wrap items-baseline justify-between gap-2">
              <span>
                {t(`checkout.metodo.${opcionEnvio.metodo}`)} ·{' '}
                {t('checkout.metodo.detalle', {
                  transportista: opcionEnvio.transportista,
                  min: opcionEnvio.diasMin,
                  max: opcionEnvio.diasMax,
                })}
              </span>
              <Price amount={opcionEnvio.costo} currency={moneda} className="text-foreground" />
            </p>
          )}
        </Bloque>
        <Bloque
          icono={CreditCard}
          titulo={t('checkout.confirmar.pago')}
          onEditar={() => onEditar(2)}
        >
          <p className="font-mono">
            <DescripcionPago pago={pago} />
          </p>
        </Bloque>
      </div>

      <p className="text-xs text-muted-foreground">{t('checkout.confirmar.simulado')}</p>
    </Paso>
  );
}
