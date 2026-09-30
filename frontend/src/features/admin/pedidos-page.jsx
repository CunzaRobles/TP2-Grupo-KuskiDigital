import { ArrowRight, Ban, PackageCheck, Truck, Warehouse } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { useSesion } from '@/features/auth/api';
import { EstadoPedido, Tracking } from '@/features/pedidos/tracking';
import { mensajeErrorAdmin as mensajeError } from './errores';
import { formatDate, formatMoney } from '@/lib/format';
import { banderaPais, nombrePais } from '@/lib/paises';
import { useCambiarEstado, usePedidoAdmin, usePedidosAdmin } from './api';
import { aQueryPedidos, CLAVES_FILTROS_PEDIDOS } from './constantes';
import { FiltrosPedidos } from './filtros-pedidos';
import { puede } from './permisos';
import { FilaVacia, PageHeader, PaginacionAdmin, Tabla, Td } from './ui';
import { useFiltrosUrl } from './use-filtros';

const ICONOS_ESTADO = {
  preparando: Warehouse,
  en_transito: Truck,
  entregado: PackageCheck,
  cancelado: Ban,
};

function Dato({ etiqueta, children }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {etiqueta}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

/**
 * Cambio de estado (tracking simulado): un botón por transición permitida. Cancelar pide
 * confirmación porque devuelve el stock y reembolsa el pago.
 */
function CambioEstado({ pedido }) {
  const { t } = useTranslation();
  const cambiar = useCambiarEstado();
  const [comentario, setComentario] = useState('');
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);

  const aplicar = (estado) =>
    cambiar.mutate(
      { codigo: pedido.codigo, estado, comentario: comentario.trim() },
      {
        onSuccess: () => {
          setComentario('');
          setConfirmarCancelacion(false);
          toast.success(
            t('admin.pedidosPage.estadoActualizado', { estado: t(`pedidos.estados.${estado}`) }),
          );
        },
      },
    );

  if (!pedido.transicionesPermitidas.length) {
    return <p className="text-sm text-muted-foreground">{t('admin.pedidosPage.estadoFinal')}</p>;
  }

  const avances = pedido.transicionesPermitidas.filter((e) => e !== 'cancelado');
  const puedeCancelar = pedido.transicionesPermitidas.includes('cancelado');

  return (
    <div className="grid gap-3">
      {cambiar.isError && <Alert variante="error" titulo={mensajeError(t, cambiar.error)} />}
      <Field
        label={t('admin.pedidosPage.comentario')}
        hint={t('admin.pedidosPage.comentarioAyuda')}
      >
        <Input value={comentario} maxLength={255} onChange={(e) => setComentario(e.target.value)} />
      </Field>
      <div className="flex flex-wrap gap-2">
        {avances.map((estado) => {
          const Icono = ICONOS_ESTADO[estado] ?? ArrowRight;
          return (
            <Button
              key={estado}
              onClick={() => aplicar(estado)}
              loading={cambiar.isPending && cambiar.variables?.estado === estado}
              disabled={cambiar.isPending}
            >
              <Icono aria-hidden="true" />
              {t('admin.pedidosPage.marcarComo', { estado: t(`pedidos.estados.${estado}`) })}
            </Button>
          );
        })}
        {puedeCancelar && (
          <Button
            variant="ghost"
            className="text-destructive"
            onClick={() => setConfirmarCancelacion(true)}
            disabled={cambiar.isPending}
          >
            <Ban aria-hidden="true" />
            {t('admin.pedidosPage.cancelar')}
          </Button>
        )}
      </div>

      <Dialog open={confirmarCancelacion} onOpenChange={setConfirmarCancelacion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('admin.pedidosPage.confirmarCancelacion', { codigo: pedido.codigo })}
            </DialogTitle>
            <DialogDescription>
              {t('admin.pedidosPage.confirmarCancelacionDetalle')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmarCancelacion(false)}>
              {t('ui.cancelar')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => aplicar('cancelado')}
              loading={cambiar.isPending}
            >
              {t('admin.pedidosPage.siCancelar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetallePedido({ codigo }) {
  const { t, i18n } = useTranslation();
  const idioma = i18n.language;
  const { data: usuario } = useSesion();
  const { data: pedido, isPending, isError, error } = usePedidoAdmin(codigo);

  if (isPending) {
    return (
      <DrawerBody className="grid content-start gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </DrawerBody>
    );
  }
  if (isError) {
    return (
      <DrawerBody>
        <Alert variante="error" titulo={mensajeError(t, error)} />
      </DrawerBody>
    );
  }

  const m = pedido.montos;
  return (
    <>
      <DrawerBody className="grid content-start gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <EstadoPedido estado={pedido.estado} />
          <span className="text-sm text-muted-foreground">
            {formatDate(pedido.creadoEn, idioma, { dateStyle: 'long', timeStyle: 'short' })}
          </span>
        </div>
        <Tracking tracking={pedido.tracking} compacto />

        <dl className="grid gap-4 sm:grid-cols-2">
          <Dato etiqueta={t('admin.tabla.cliente')}>
            <span className="grid">
              <span className="font-semibold">{pedido.cliente?.nombre}</span>
              <span className="text-muted-foreground">{pedido.cliente?.correo}</span>
            </span>
          </Dato>
          <Dato etiqueta={t('pedidos.detalle.direccion')}>
            <span className="grid">
              <span>{pedido.direccion.nombreDestinatario}</span>
              <span className="text-muted-foreground">
                {pedido.direccion.direccion}, {pedido.direccion.ciudad} ·{' '}
                {banderaPais(pedido.direccion.paisCodigo)}{' '}
                {nombrePais(pedido.direccion.paisCodigo, idioma)}
              </span>
            </span>
          </Dato>
          <Dato etiqueta={t('pedidos.detalle.pago')}>
            {pedido.pago ? (
              <span className="grid">
                <span>
                  {t(`admin.metodosPago.${pedido.pago.metodo}`)} ·{' '}
                  {t(`admin.estadosPago.${pedido.pago.estado}`)}
                </span>
                <span className="text-muted-foreground">
                  {t('pedidos.detalle.operacion', { numero: pedido.pago.numeroOperacion })}
                </span>
              </span>
            ) : (
              '—'
            )}
          </Dato>
          <Dato etiqueta={t('pedidos.detalle.envio')}>
            {pedido.envio ? (
              <span className="grid">
                <span>
                  {pedido.envio.transportista} · {t(`checkout.metodo.${pedido.envio.metodo}`)}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {pedido.envio.codigoSeguimiento}
                </span>
              </span>
            ) : (
              '—'
            )}
          </Dato>
        </dl>

        <section className="grid gap-2">
          <h3 className="text-h4">{t('pedidos.detalle.productos')}</h3>
          <ul className="grid divide-y rounded-lg border">
            {pedido.items.map((i) => (
              <li key={i.productoId} className="flex justify-between gap-3 px-3 py-2 text-sm">
                <span>
                  {i.cantidad} × {i.nombreProducto}
                </span>
                <span className="tabular-nums">{formatMoney(i.subtotalPen, 'PEN', idioma)}</span>
              </li>
            ))}
          </ul>
          <dl className="grid gap-1 text-sm">
            {[
              ['subtotal', m.subtotalPen],
              ['envio', m.envioPen],
              ['igv', m.igvPen],
            ].map(([clave, valor]) => (
              <div key={clave} className="flex justify-between text-muted-foreground">
                <dt>{t(`admin.pedidosPage.montos.${clave}`)}</dt>
                <dd className="tabular-nums">{formatMoney(valor, 'PEN', idioma)}</dd>
              </div>
            ))}
            <div className="flex justify-between font-semibold">
              <dt>{t('pedidos.detalle.totalPagado')}</dt>
              <dd className="tabular-nums">
                {formatMoney(m.totalPen, 'PEN', idioma)}
                {pedido.moneda !== 'PEN' && (
                  <span className="ml-2 font-normal text-muted-foreground">
                    ({formatMoney(m.total, pedido.moneda, idioma)})
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className="grid gap-2">
          <h3 className="text-h4">{t('admin.pedidosPage.historial')}</h3>
          <ol className="grid gap-2 border-l pl-4">
            {pedido.tracking.historial.map((h, i) => (
              <li key={i} className="grid text-sm">
                <span className="font-semibold">{t(`pedidos.estados.${h.estado}`)}</span>
                <span className="text-muted-foreground">
                  {formatDate(h.fecha, idioma, { dateStyle: 'medium', timeStyle: 'short' })}
                  {h.comentario && ` · ${h.comentario}`}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </DrawerBody>
      {puede(usuario?.rol, 'pedidosEstado') && (
        <DrawerFooter>
          <CambioEstado pedido={pedido} />
        </DrawerFooter>
      )}
    </>
  );
}

export function PedidosPage() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.language;
  const [params, setParams] = useSearchParams();
  const codigo = params.get('codigo');
  const { filtros, page, actualizar, limpiar, hayFiltros, setPage } =
    useFiltrosUrl(CLAVES_FILTROS_PEDIDOS);
  const { data, isPending, isError, error, isPlaceholderData } = usePedidosAdmin(
    aQueryPedidos(filtros, page),
  );

  const abrir = (c) =>
    setParams((p) => {
      const n = new URLSearchParams(p);
      if (c) n.set('codigo', c);
      else n.delete('codigo');
      return n;
    });

  const columnas = [
    { clave: 'codigo', etiqueta: t('admin.tabla.pedido') },
    { clave: 'fecha', etiqueta: t('admin.tabla.fecha') },
    { clave: 'destino', etiqueta: t('admin.tabla.destino') },
    { clave: 'envio', etiqueta: t('admin.tabla.envio') },
    { clave: 'unidades', etiqueta: t('admin.tabla.unidades'), alinear: 'derecha' },
    { clave: 'estado', etiqueta: t('admin.tabla.estado') },
    { clave: 'accion', etiqueta: <span className="sr-only">{t('admin.tabla.acciones')}</span> },
  ];

  return (
    <>
      <title>{`${t('admin.secciones.pedidos')} · Kuski`}</title>
      <PageHeader
        titulo={t('admin.secciones.pedidos')}
        descripcion={t('admin.pedidosPage.descripcion')}
      />
      <FiltrosPedidos
        filtros={filtros}
        actualizar={actualizar}
        limpiar={limpiar}
        hayFiltros={hayFiltros}
      />
      {isError && <Alert variante="error" titulo={mensajeError(t, error)} />}

      <Tabla
        caption={t('admin.secciones.pedidos')}
        columnas={columnas}
        cargando={isPending}
        className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}
      >
        {data?.items.length === 0 && (
          <FilaVacia columnas={columnas.length}>{t('admin.tabla.sinResultados')}</FilaVacia>
        )}
        {data?.items.map((p) => (
          <tr key={p.codigo} className="hover:bg-secondary/50">
            <Td className="font-semibold">{p.codigo}</Td>
            <Td className="whitespace-nowrap text-muted-foreground">
              {formatDate(p.creadoEn, idioma, { dateStyle: 'medium' })}
            </Td>
            <Td>
              <span className="grid">
                <span className="font-semibold">{p.destinatario}</span>
                <span className="text-xs text-muted-foreground">
                  {banderaPais(p.paisCodigo)} {p.ciudad}
                </span>
              </span>
            </Td>
            <Td className="whitespace-nowrap">
              {p.envio ? (
                <span className="grid">
                  <span>{p.envio.transportista}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {p.envio.codigoSeguimiento}
                  </span>
                </span>
              ) : (
                '—'
              )}
            </Td>
            <Td alinear="derecha">{p.unidades}</Td>
            <Td>
              <EstadoPedido estado={p.estado} />
            </Td>
            <Td alinear="derecha">
              <Button variant="secondary" size="sm" onClick={() => abrir(p.codigo)}>
                {t('admin.pedidosPage.gestionar')}
                <span className="sr-only"> {p.codigo}</span>
              </Button>
            </Td>
          </tr>
        ))}
      </Tabla>
      <PaginacionAdmin pagination={data?.pagination} onPage={setPage} />

      <Drawer open={Boolean(codigo)} onOpenChange={(o) => !o && abrir(null)}>
        <DrawerContent className="max-w-xl">
          <DrawerHeader>
            <DrawerTitle>{t('pedidos.detalle.pedido', { codigo })}</DrawerTitle>
            <DrawerDescription>{t('admin.pedidosPage.detalleDescripcion')}</DrawerDescription>
          </DrawerHeader>
          {codigo && <DetallePedido codigo={codigo} />}
        </DrawerContent>
      </Drawer>
    </>
  );
}
