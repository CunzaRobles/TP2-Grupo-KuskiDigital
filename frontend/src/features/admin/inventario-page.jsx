import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  History,
  Pencil,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioCard, RadioCardGroup } from '@/components/ui/radio-card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { mensajeErrorAdmin as mensajeError } from './errores';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useInventario, useKardex, useRegistrarMovimiento } from './api';
import { BuscadorFiltro } from './filtros-pedidos';
import { Miniatura, StockBadge } from './productos-page';
import { FilaVacia, PageHeader, PaginacionAdmin, Tabla, Td } from './ui';
import { useFiltrosUrl } from './use-filtros';

/**
 * Stock editable en la misma fila: se escribe el stock contado y se guarda como "ajuste" en el
 * kardex (Enter guarda, Escape cancela).
 */
export function StockEnLinea({ producto }) {
  const { t } = useTranslation();
  const registrar = useRegistrarMovimiento();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(String(producto.stock));

  const cancelar = () => {
    setEditando(false);
    setValor(String(producto.stock));
  };

  const guardar = () => {
    const stockNuevo = Number(valor);
    if (!Number.isInteger(stockNuevo) || stockNuevo < 0) {
      toast.error(t('admin.inventarioPage.stockInvalido'));
      return;
    }
    if (stockNuevo === producto.stock) return cancelar();
    registrar.mutate(
      { productoId: producto.id, tipo: 'ajuste', stockNuevo },
      {
        onSuccess: () => {
          setEditando(false);
          toast.success(
            t('admin.inventarioPage.stockActualizado', {
              nombre: producto.nombre,
              stock: stockNuevo,
            }),
          );
        },
        onError: (e) => toast.error(mensajeError(t, e)),
      },
    );
  };

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => {
          setValor(String(producto.stock));
          setEditando(true);
        }}
        className="group inline-flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-secondary"
        aria-label={t('admin.inventarioPage.editarStock', {
          nombre: producto.nombre,
          stock: producto.stock,
        })}
      >
        <StockBadge stock={producto.stock} stockBajo={producto.stockBajo} />
        <Pencil
          className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden="true"
        />
      </button>
    );
  }

  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        guardar();
      }}
    >
      <Input
        type="number"
        min={0}
        step={1}
        autoFocus
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && cancelar()}
        className="h-8 w-20 px-2 text-sm tabular-nums"
        aria-label={t('admin.inventarioPage.stockContado', { nombre: producto.nombre })}
      />
      <Button
        type="submit"
        size="icon-sm"
        className="size-8"
        loading={registrar.isPending}
        aria-label={t('admin.acciones.guardar')}
      >
        {!registrar.isPending && <Check aria-hidden="true" />}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-8"
        onClick={cancelar}
        aria-label={t('ui.cancelar')}
      >
        <X aria-hidden="true" />
      </Button>
    </form>
  );
}

// Entrada (mercadería que llega) o salida manual (merma, muestra) con motivo.
function DialogoMovimiento({ producto, onCerrar }) {
  const { t } = useTranslation();
  const registrar = useRegistrarMovimiento();
  const [tipo, setTipo] = useState('entrada');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const n = Number(cantidad);
  const valido = Number.isInteger(n) && n > 0;
  const resultante = producto ? producto.stock + (tipo === 'entrada' ? n : -n) : 0;

  const enviar = (e) => {
    e.preventDefault();
    if (!valido) return;
    registrar.mutate(
      { productoId: producto.id, tipo, cantidad: n, motivo: motivo.trim() || undefined },
      {
        onSuccess: ({ producto: p }) => {
          toast.success(
            t('admin.inventarioPage.stockActualizado', { nombre: producto.nombre, stock: p.stock }),
          );
          onCerrar();
        },
      },
    );
  };

  return (
    <Dialog open={Boolean(producto)} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.inventarioPage.registrarMovimiento')}</DialogTitle>
          <DialogDescription>
            {producto?.nombre} ·{' '}
            {t('admin.inventarioPage.stockActual', { count: producto?.stock ?? 0 })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={enviar} className="grid gap-4" noValidate>
          {registrar.isError && (
            <Alert variante="error" titulo={mensajeError(t, registrar.error)} />
          )}
          <RadioCardGroup
            value={tipo}
            onValueChange={setTipo}
            className="grid grid-cols-2 gap-3"
            aria-label={t('admin.inventarioPage.tipo')}
          >
            <RadioCard value="entrada">
              <span className="flex items-center gap-2 font-semibold">
                <ArrowDownToLine className="size-4" aria-hidden="true" />
                {t('admin.inventarioPage.tipos.entrada')}
              </span>
            </RadioCard>
            <RadioCard value="salida">
              <span className="flex items-center gap-2 font-semibold">
                <ArrowUpFromLine className="size-4" aria-hidden="true" />
                {t('admin.inventarioPage.tipos.salida')}
              </span>
            </RadioCard>
          </RadioCardGroup>
          <Field
            label={t('admin.inventarioPage.cantidad')}
            hint={valido ? t('admin.inventarioPage.resultante', { count: resultante }) : undefined}
            error={valido && resultante < 0 ? t('admin.inventarioPage.sinStock') : undefined}
          >
            <Input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </Field>
          <Field label={t('admin.inventarioPage.motivo')}>
            <Input
              value={motivo}
              maxLength={255}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={t(`admin.inventarioPage.motivoEjemplo.${tipo}`)}
            />
          </Field>
          <DialogFooter>
            <Button variant="secondary" onClick={onCerrar}>
              {t('ui.cancelar')}
            </Button>
            <Button
              type="submit"
              disabled={!valido || resultante < 0}
              loading={registrar.isPending}
            >
              {t('admin.acciones.guardar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const VARIANTE_TIPO = { entrada: 'verde', salida: 'outline', ajuste: 'maiz' };

// Historial kardex de un producto (más recientes primero).
function Kardex({ producto }) {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error } = useKardex(producto.id, page);

  return (
    <DrawerBody className="grid content-start gap-4">
      {isError && <Alert variante="error" titulo={mensajeError(t, error)} />}
      {isPending ? (
        Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)
      ) : data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('admin.inventarioPage.sinMovimientos')}</p>
      ) : (
        <ol className="grid divide-y rounded-lg border">
          {data.items.map((m) => (
            <li
              key={m.id}
              className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 px-3 py-2.5 text-sm"
            >
              <span className="flex items-center gap-2">
                <Badge variant={VARIANTE_TIPO[m.tipo]}>
                  {t(`admin.inventarioPage.tipos.${m.tipo}`)}
                </Badge>
                <span
                  className={cn(
                    'font-semibold tabular-nums',
                    m.cantidad < 0 ? 'text-destructive' : 'text-success',
                  )}
                >
                  {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                </span>
              </span>
              <span className="text-right tabular-nums">
                {t('admin.inventarioPage.quedan', { count: m.stockResultante })}
              </span>
              <span className="text-muted-foreground">
                {m.motivo}
                {m.usuario && ` · ${m.usuario.nombre}`}
              </span>
              <time className="text-right text-xs text-muted-foreground" dateTime={m.creadoEn}>
                {formatDate(m.creadoEn, i18n.language, { dateStyle: 'short', timeStyle: 'short' })}
              </time>
            </li>
          ))}
        </ol>
      )}
      <PaginacionAdmin pagination={data?.pagination} onPage={setPage} />
    </DrawerBody>
  );
}

export function InventarioPage() {
  const { t } = useTranslation();
  const { filtros, page, actualizar, setPage } = useFiltrosUrl(['q', 'stock_bajo']);
  const query = Object.fromEntries(
    Object.entries({ ...filtros, page }).filter(([, v]) => v !== ''),
  );
  const { data, isPending, isError, error, isPlaceholderData } = useInventario(query);
  const [movimiento, setMovimiento] = useState(null);
  const [kardex, setKardex] = useState(null);

  const columnas = [
    { clave: 'producto', etiqueta: t('admin.tabla.producto') },
    { clave: 'categoria', etiqueta: t('admin.tabla.categoria') },
    { clave: 'stock', etiqueta: t('admin.tabla.stock') },
    { clave: 'minimo', etiqueta: t('admin.tabla.stockMinimo'), alinear: 'derecha' },
    { clave: 'acciones', etiqueta: <span className="sr-only">{t('admin.tabla.acciones')}</span> },
  ];

  return (
    <>
      <title>{`${t('admin.secciones.inventario')} · Kuski`}</title>
      <PageHeader
        titulo={t('admin.secciones.inventario')}
        descripcion={t('admin.inventarioPage.descripcion')}
      />

      <div className="grid gap-3 rounded-xl border bg-card p-4 shadow-soft sm:grid-cols-[2fr_auto] sm:items-end">
        <BuscadorFiltro
          valor={filtros.q}
          onBuscar={(q) => actualizar({ q })}
          placeholder={t('admin.productosPage.buscar')}
        />
        <label className="flex h-9 items-center gap-2 text-sm font-semibold">
          <Checkbox
            checked={filtros.stock_bajo === 'true'}
            onCheckedChange={(v) => actualizar({ stock_bajo: v === true ? 'true' : '' })}
          />
          {t('admin.inventarioPage.soloStockBajo')}
        </label>
      </div>

      {isError && <Alert variante="error" titulo={mensajeError(t, error)} />}

      <Tabla
        caption={t('admin.secciones.inventario')}
        columnas={columnas}
        cargando={isPending}
        className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}
      >
        {data?.items.length === 0 && (
          <FilaVacia columnas={columnas.length}>{t('admin.tabla.sinResultados')}</FilaVacia>
        )}
        {data?.items.map((p) => (
          <tr key={p.id} className={cn('hover:bg-secondary/50', !p.activo && 'opacity-60')}>
            <Td>
              <span className="flex items-center gap-3">
                <Miniatura imagen={p.imagen} className="size-10" />
                <span className="grid min-w-0">
                  <span className="truncate font-semibold">{p.nombre}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {p.sku}
                    {!p.activo && ` · ${t('admin.productosPage.inactivo')}`}
                  </span>
                </span>
              </span>
            </Td>
            <Td>{p.categoria?.nombre}</Td>
            <Td>
              <StockEnLinea key={p.stock} producto={p} />
            </Td>
            <Td alinear="derecha">{p.stockMinimo}</Td>
            <Td alinear="derecha">
              <span className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => setMovimiento(p)}>
                  <SlidersHorizontal aria-hidden="true" />
                  {t('admin.inventarioPage.movimiento')}
                  <span className="sr-only"> {p.nombre}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setKardex(p)}>
                  <History aria-hidden="true" />
                  {t('admin.inventarioPage.kardex')}
                  <span className="sr-only"> {p.nombre}</span>
                </Button>
              </span>
            </Td>
          </tr>
        ))}
      </Tabla>
      <PaginacionAdmin pagination={data?.pagination} onPage={setPage} />

      <DialogoMovimiento
        key={movimiento?.id}
        producto={movimiento}
        onCerrar={() => setMovimiento(null)}
      />

      <Drawer open={Boolean(kardex)} onOpenChange={(o) => !o && setKardex(null)}>
        <DrawerContent className="max-w-lg">
          <DrawerHeader>
            <DrawerTitle>
              {t('admin.inventarioPage.kardexDe', { nombre: kardex?.nombre })}
            </DrawerTitle>
            <DrawerDescription>{t('admin.inventarioPage.kardexDetalle')}</DrawerDescription>
          </DrawerHeader>
          {kardex && <Kardex producto={kardex} />}
        </DrawerContent>
      </Drawer>
    </>
  );
}
