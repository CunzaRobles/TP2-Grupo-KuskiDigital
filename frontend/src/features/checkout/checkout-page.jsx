import { ArrowRight, Lock } from 'lucide-react';
import { AnimatePresence, m as motion } from 'motion/react';
import { useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Stepper } from '@/components/ui/stepper';
import { useSesion } from '@/features/auth/api';
import { useCarrito } from '@/features/carrito/carrito-context';
import { useDirecciones } from '@/features/cuenta/api';
import { useCurrency } from '@/lib/currency';
import { transicion } from '@/lib/motion';
import { Link } from '@/lib/motion/enlaces';
import { useNavigate } from '@/lib/motion/use-navigate';
import { useCotizacion, useCrearPedido } from './api';
import {
  NUEVA,
  PASOS,
  checkoutReducer,
  cuerpoPedido,
  estadoInicial,
  paisDestino,
  seleccionEfectiva,
} from './estado';
import { PasoConfirmar } from './paso-confirmar';
import { PasoEnvio } from './paso-envio';
import { PasoMetodo } from './paso-metodo';
import { PasoPago } from './paso-pago';
import { ProcesandoPago } from './procesando-pago';
import { ResumenPedido } from './resumen-pedido';

function CheckoutSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_24rem]" aria-hidden="true">
      <div className="grid content-start gap-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}

/**
 * Checkout en 4 pasos (Envío → Método de envío → Pago → Confirmar), solo con sesión.
 * El estado vive aquí: volver a un paso anterior no pierde lo escrito. El resumen de la
 * derecha (abajo en móvil) se recalcula con POST /checkout/cotizar al cambiar el país, el
 * método de envío o la moneda.
 */
export function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: usuario } = useSesion();
  const { moneda } = useCurrency();
  const { carrito, cargando, sincronizando } = useCarrito();
  const direcciones = useDirecciones();
  const [estado, dispatch] = useReducer(checkoutReducer, usuario, estadoInicial);
  const [direccionNueva, setDireccionNueva] = useState(null);
  const [pagoValidado, setPagoValidado] = useState(null);
  const crearPedido = useCrearPedido();

  const seleccion = seleccionEfectiva(estado.envio.seleccion, direcciones.data);
  const paisCodigo = paisDestino(seleccion, estado.envio, direcciones.data);
  const firma = carrito.lineas.map((l) => `${l.productoId}x${l.cantidad}`).join(',');
  const cotizacion = useCotizacion({
    paisCodigo,
    moneda,
    metodoEnvio: estado.metodoEnvio,
    firma,
  });

  const pasos = PASOS.map((id) => ({ id, label: t(`checkout.pasos.${id}`) }));
  const ir = (paso) => dispatch({ type: 'ir', paso });
  const direccionElegida =
    seleccion === NUEVA ? direccionNueva : direcciones.data?.find((d) => d.id === seleccion);
  const opcionEnvio = cotizacion.data?.opcionesEnvio.find((o) => o.metodo === estado.metodoEnvio);
  const hayAvisos = carrito.lineas.some((l) => l.aviso);

  const pagar = () => {
    crearPedido.mutate(
      cuerpoPedido({
        seleccion,
        envio: estado.envio,
        metodoEnvio: estado.metodoEnvio,
        moneda,
        pago: pagoValidado,
        direccionValida: direccionNueva,
      }),
      {
        onSuccess: (pedido) =>
          navigate(`/pedido/${pedido.codigo}`, {
            replace: true,
            state: { recien: true, codigoAprobacion: pedido.pago?.codigoAprobacion ?? null },
          }),
        onError: (error) => {
          if (error?.code === 'PAGO_RECHAZADO') {
            dispatch({
              type: 'rechazo',
              rechazo: {
                mensaje: t('errores.PAGO_RECHAZADO'),
                numeroOperacion: error.details?.numeroOperacion ?? null,
              },
            });
            setPagoValidado(null);
          }
        },
      },
    );
  };

  let contenido;
  if ((cargando || sincronizando) && carrito.lineas.length === 0) {
    contenido = <CheckoutSkeleton />;
  } else if (carrito.lineas.length === 0) {
    contenido = (
      <EmptyState
        objeto="canasta"
        titulo={t('checkout.vacio.titulo')}
        descripcion={t('checkout.vacio.descripcion')}
        accion={
          <Button asChild>
            <Link to="/catalogo">
              {t('carrito.explorar')}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />
    );
  } else {
    const errorPedido =
      crearPedido.isError && crearPedido.error?.code !== 'PAGO_RECHAZADO'
        ? crearPedido.error
        : null;

    contenido = (
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_24rem] lg:gap-14">
        <div className="grid min-w-0 gap-8">
          <Stepper steps={pasos} current={estado.paso} onStepClick={ir} />

          {hayAvisos && (
            <Alert
              variante="aviso"
              titulo={t('checkout.avisos.titulo')}
              accion={
                <Link to="/carrito" className="font-semibold text-link hover:underline">
                  {t('checkout.confirmar.revisarCarrito')}
                </Link>
              }
            >
              {t('checkout.avisos.detalle')}
            </Alert>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={estado.paso}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={transicion('base')}
            >
              {estado.paso === 0 && (
                <PasoEnvio
                  direcciones={direcciones}
                  seleccion={seleccion}
                  envio={estado.envio}
                  onCambiar={(cambios) => dispatch({ type: 'envio', cambios })}
                  onContinuar={(datos) => {
                    setDireccionNueva(datos);
                    ir(1);
                  }}
                />
              )}
              {estado.paso === 1 && (
                <PasoMetodo
                  cotizacion={cotizacion}
                  metodoEnvio={estado.metodoEnvio}
                  onElegir={(metodo) => dispatch({ type: 'metodoEnvio', metodo })}
                  onVolver={() => ir(0)}
                  onContinuar={() => ir(2)}
                />
              )}
              {estado.paso === 2 && (
                <PasoPago
                  pago={estado.pago}
                  rechazo={estado.rechazo}
                  onCambiar={(cambios) => dispatch({ type: 'pago', cambios })}
                  onVolver={() => ir(1)}
                  onContinuar={(datos) => {
                    setPagoValidado({ metodo: estado.pago.metodo, datos });
                    ir(3);
                  }}
                />
              )}
              {estado.paso === 3 && direccionElegida && pagoValidado && (
                <PasoConfirmar
                  direccion={direccionElegida}
                  opcionEnvio={opcionEnvio}
                  pago={pagoValidado}
                  cotizacion={cotizacion.data}
                  error={errorPedido}
                  pagando={crearPedido.isPending}
                  onEditar={ir}
                  onVolver={() => ir(2)}
                  onPagar={hayAvisos ? () => {} : pagar}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <ResumenPedido
          carrito={carrito}
          cotizacion={cotizacion.data}
          actualizando={cotizacion.isFetching}
          paisCodigo={paisCodigo}
          className="lg:sticky lg:top-[calc(var(--spacing-header-compact)+1.5rem)]"
        />
      </div>
    );
  }

  return (
    <div className="container-page grid gap-8 py-10 sm:py-14">
      <title>{`${t('checkout.titulo')} · Kuski`}</title>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-3">
          <p className="eyebrow flex items-center gap-2 text-link">
            <Lock className="size-3.5" aria-hidden="true" />
            {t('checkout.eyebrow')}
          </p>
          <h1 className="text-h1">{t('checkout.titulo')}</h1>
        </div>
      </header>
      {contenido}
      <ProcesandoPago abierto={crearPedido.isPending} metodo={pagoValidado?.metodo} />
    </div>
  );
}
