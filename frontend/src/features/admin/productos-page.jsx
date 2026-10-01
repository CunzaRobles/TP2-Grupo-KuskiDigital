import { ImageOff, Pencil, Plus, Star } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useCategorias } from '@/features/catalogo/api';
import { mensajeErrorAdmin as mensajeError } from './errores';
import { formatMoney } from '@/lib/format';
import { miniatura } from '@/lib/imagen';
import { useDesactivarProducto, useProductosAdmin } from './api';
import { BuscadorFiltro } from './filtros-pedidos';
import { FilaVacia, PageHeader, PaginacionAdmin, Tabla, Td } from './ui';
import { useFiltrosUrl } from './use-filtros';

const TODOS = 'todos';

export function Miniatura({ imagen, className = 'size-11' }) {
  return imagen ? (
    <img
      {...miniatura(imagen.url, 48)}
      alt=""
      loading="lazy"
      className={`${className} shrink-0 rounded-md border object-cover`}
    />
  ) : (
    <span
      className={`${className} grid shrink-0 place-content-center rounded-md border bg-muted text-muted-foreground`}
    >
      <ImageOff className="size-4" aria-hidden="true" />
    </span>
  );
}

export function StockBadge({ stock, stockBajo }) {
  const { t } = useTranslation();
  return (
    <Badge variant={stock === 0 ? 'destructive' : stockBajo ? 'maiz' : 'neutral'}>
      {t('admin.inventarioPage.stockN', { count: stock })}
    </Badge>
  );
}

export function ProductosPage() {
  const { t, i18n } = useTranslation();
  const { filtros, page, actualizar, setPage } = useFiltrosUrl(['q', 'categoria', 'activo']);
  const query = Object.fromEntries(
    Object.entries({ ...filtros, page, orden: 'nombre' }).filter(([, v]) => v !== ''),
  );
  const { data, isPending, isError, error, isPlaceholderData } = useProductosAdmin(query);
  const { data: categorias = [] } = useCategorias();
  const desactivar = useDesactivarProducto();
  const [aDesactivar, setADesactivar] = useState(null);

  const confirmarDesactivar = () =>
    desactivar.mutate(aDesactivar.id, {
      onSuccess: () => {
        toast.success(t('admin.productosPage.desactivado', { nombre: aDesactivar.nombre }));
        setADesactivar(null);
      },
      onError: (e) => toast.error(mensajeError(t, e)),
    });

  const columnas = [
    { clave: 'producto', etiqueta: t('admin.tabla.producto') },
    { clave: 'categoria', etiqueta: t('admin.tabla.categoria') },
    { clave: 'comunidad', etiqueta: t('admin.tabla.comunidad') },
    { clave: 'precio', etiqueta: t('admin.tabla.precio'), alinear: 'derecha' },
    { clave: 'stock', etiqueta: t('admin.tabla.stock') },
    { clave: 'estado', etiqueta: t('admin.tabla.estado') },
    { clave: 'acciones', etiqueta: <span className="sr-only">{t('admin.tabla.acciones')}</span> },
  ];

  return (
    <>
      <title>{`${t('admin.secciones.productos')} · Kuski`}</title>
      <PageHeader
        titulo={t('admin.secciones.productos')}
        descripcion={t('admin.productosPage.descripcion')}
        acciones={
          <Button asChild>
            <Link to="/admin/productos/nuevo">
              <Plus aria-hidden="true" />
              {t('admin.productosPage.nuevo')}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 rounded-xl border bg-card p-4 shadow-soft sm:grid-cols-[2fr_1fr_1fr]">
        <BuscadorFiltro
          valor={filtros.q}
          onBuscar={(q) => actualizar({ q })}
          placeholder={t('admin.productosPage.buscar')}
        />
        <Field label={t('admin.tabla.categoria')}>
          {(props) => (
            <Select
              value={filtros.categoria || TODOS}
              onValueChange={(v) => actualizar({ categoria: v === TODOS ? '' : v })}
            >
              <SelectTrigger size="sm" {...props}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>{t('admin.filtros.todas')}</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
        <Field label={t('admin.tabla.estado')}>
          {(props) => (
            <Select
              value={filtros.activo || TODOS}
              onValueChange={(v) => actualizar({ activo: v === TODOS ? '' : v })}
            >
              <SelectTrigger size="sm" {...props}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>{t('admin.filtros.todos')}</SelectItem>
                <SelectItem value="true">{t('admin.productosPage.activos')}</SelectItem>
                <SelectItem value="false">{t('admin.productosPage.inactivos')}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </Field>
      </div>

      {isError && <Alert variante="error" titulo={mensajeError(t, error)} />}

      <Tabla
        caption={t('admin.secciones.productos')}
        columnas={columnas}
        cargando={isPending}
        className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}
      >
        {data?.items.length === 0 && (
          <FilaVacia columnas={columnas.length}>{t('admin.tabla.sinResultados')}</FilaVacia>
        )}
        {data?.items.map((p) => (
          <tr key={p.id} className="hover:bg-secondary/50">
            <Td>
              <span className="flex items-center gap-3">
                <Miniatura imagen={p.imagen} />
                <span className="grid min-w-0">
                  <Link
                    to={`/admin/productos/${p.id}`}
                    className="truncate font-semibold hover:underline"
                  >
                    {p.nombre}
                  </Link>
                  <span className="font-mono text-xs text-muted-foreground">{p.sku}</span>
                </span>
              </span>
            </Td>
            <Td>{p.categoria?.nombre}</Td>
            <Td className="max-w-48 truncate text-muted-foreground">{p.comunidad?.nombre}</Td>
            <Td alinear="derecha">{formatMoney(p.precioBasePen, 'PEN', i18n.language)}</Td>
            <Td>
              <StockBadge stock={p.stock} stockBajo={p.stockBajo} />
            </Td>
            <Td>
              <span className="flex flex-wrap gap-1">
                <Badge variant={p.activo ? 'verde' : 'outline'}>
                  {p.activo ? t('admin.productosPage.activo') : t('admin.productosPage.inactivo')}
                </Badge>
                {p.destacado && (
                  <Badge variant="maiz">
                    <Star aria-hidden="true" />
                    {t('admin.productosPage.destacado')}
                  </Badge>
                )}
              </span>
            </Td>
            <Td alinear="derecha">
              <span className="flex justify-end gap-1">
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/admin/productos/${p.id}`}>
                    <Pencil aria-hidden="true" />
                    {t('admin.acciones.editar')}
                    <span className="sr-only"> {p.nombre}</span>
                  </Link>
                </Button>
                {p.activo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setADesactivar(p)}
                  >
                    {t('admin.productosPage.desactivar')}
                    <span className="sr-only"> {p.nombre}</span>
                  </Button>
                )}
              </span>
            </Td>
          </tr>
        ))}
      </Tabla>
      <PaginacionAdmin pagination={data?.pagination} onPage={setPage} />

      <Dialog open={Boolean(aDesactivar)} onOpenChange={(o) => !o && setADesactivar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('admin.productosPage.confirmarDesactivar', { nombre: aDesactivar?.nombre })}
            </DialogTitle>
            <DialogDescription>
              {t('admin.productosPage.confirmarDesactivarDetalle')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setADesactivar(null)}>
              {t('ui.cancelar')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarDesactivar}
              loading={desactivar.isPending}
            >
              {t('admin.productosPage.desactivar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
