import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { useCategorias, useCertificaciones, useComunidades } from '@/features/catalogo/api';
import { erroresDeCampos } from '@/lib/errores';
import { mensajeErrorAdmin as mensajeError } from './errores';
import { useFormulario } from '@/lib/formulario';
import { useGuardarProducto, useProductoAdmin, useSubirImagen } from './api';
import { subirCola, useColaImagenes } from './cola-imagenes';
import { ImagenesProducto } from './imagenes-producto';
import { StockBadge } from './productos-page';
import { productoSchema } from './schemas';
import { PageHeader, Panel } from './ui';

const VACIO = {
  sku: '',
  nombre: '',
  slug: '',
  descripcion: '',
  precioBasePen: '',
  pesoG: '',
  stockMinimo: '5',
  stockInicial: '0',
  categoriaId: '',
  comunidadId: '',
  certificacionIds: [],
  destacado: false,
  activo: true,
};

const aFormulario = (p) => ({
  sku: p.sku,
  nombre: p.nombre,
  slug: p.slug,
  descripcion: p.descripcion ?? '',
  precioBasePen: String(p.precioBasePen),
  pesoG: String(p.pesoG),
  stockMinimo: String(p.stockMinimo),
  stockInicial: '0',
  categoriaId: String(p.categoriaId),
  comunidadId: String(p.comunidadId),
  certificacionIds: p.certificacionIds,
  destacado: p.destacado,
  activo: p.activo,
});

function SelectCampo({ label, error, valor, onChange, opciones, placeholder }) {
  return (
    <Field label={label} error={error}>
      {(props) => (
        <Select value={valor || undefined} onValueChange={onChange}>
          <SelectTrigger {...props}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {opciones.map((o) => (
              <SelectItem key={o.id} value={String(o.id)}>
                {o.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </Field>
  );
}

function Formulario({ producto }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const esNuevo = !producto;
  const guardar = useGuardarProducto();
  const subir = useSubirImagen();
  const { cola, agregar, quitar, marcar } = useColaImagenes();
  const { data: categorias = [] } = useCategorias();
  const { data: comunidades = [] } = useComunidades();
  const { data: certificaciones = [] } = useCertificaciones();
  const { valores, errores, cambiar, enviar, campo } = useFormulario(
    productoSchema,
    producto ? aFormulario(producto) : VACIO,
  );
  const [subiendo, setSubiendo] = useState(false);
  const erroresApi = erroresDeCampos(guardar.error);
  const error = (c) => (errores[c] && t(errores[c])) || erroresApi[c];

  // Producto existente: las fotos se suben al elegirlas.
  const alAgregar = (archivos) => {
    const nuevos = agregar(archivos);
    if (!esNuevo) subirCola({ items: nuevos, productoId: producto.id, subir, quitar, marcar });
  };

  const alEnviar = enviar(({ stockInicial, ...datos }) => {
    const cuerpo = esNuevo ? { ...datos, stockInicial } : datos;
    guardar.mutate(
      { id: producto?.id, datos: cuerpo },
      {
        onSuccess: async (guardado) => {
          if (esNuevo) {
            // Las fotos elegidas antes de crear el producto se suben ahora.
            setSubiendo(true);
            const fallos = await subirCola({
              items: cola,
              productoId: guardado.id,
              subir,
              quitar,
              marcar,
            });
            setSubiendo(false);
            toast.success(t('admin.productoForm.creado', { nombre: guardado.nombre }));
            if (fallos) toast.error(t('admin.imagenes.fallos', { count: fallos }));
            navigate(`/admin/productos/${guardado.id}`, { replace: true });
          } else {
            toast.success(t('admin.productoForm.guardado'));
          }
        },
      },
    );
  });

  const alternarCertificacion = (id, marcada) =>
    cambiar(
      'certificacionIds',
      marcada
        ? [...valores.certificacionIds, id]
        : valores.certificacionIds.filter((c) => c !== id),
    );

  return (
    <form
      noValidate
      onSubmit={alEnviar}
      className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start"
    >
      <div className="grid gap-6">
        {guardar.isError && <Alert variante="error" titulo={mensajeError(t, guardar.error)} />}

        <Panel titulo={t('admin.productoForm.datos')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('admin.productoForm.nombre')}
              error={error('nombre')}
              className="sm:col-span-2"
            >
              <Input {...campo('nombre')} />
            </Field>
            <Field
              label={t('admin.productoForm.sku')}
              error={error('sku')}
              hint={t('admin.productoForm.skuAyuda')}
            >
              <Input {...campo('sku')} className="font-mono uppercase" />
            </Field>
            <Field
              label={t('admin.productoForm.slug')}
              error={error('slug')}
              hint={t('admin.productoForm.slugAyuda')}
            >
              <Input {...campo('slug')} className="font-mono" />
            </Field>
            <Field
              label={t('admin.productoForm.descripcion')}
              error={error('descripcion')}
              className="sm:col-span-2"
            >
              <textarea
                {...campo('descripcion')}
                rows={5}
                className="w-full rounded-md border border-input bg-card px-3.5 py-2.5 text-base shadow-soft focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 focus-visible:outline-none aria-invalid:border-destructive"
              />
            </Field>
          </div>
        </Panel>

        <Panel titulo={t('admin.productoForm.origen')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectCampo
              label={t('admin.tabla.categoria')}
              error={error('categoriaId')}
              valor={valores.categoriaId}
              onChange={(v) => cambiar('categoriaId', v)}
              opciones={categorias}
              placeholder={t('admin.productoForm.elegir')}
            />
            <SelectCampo
              label={t('admin.tabla.comunidad')}
              error={error('comunidadId')}
              valor={valores.comunidadId}
              onChange={(v) => cambiar('comunidadId', v)}
              opciones={comunidades}
              placeholder={t('admin.productoForm.elegir')}
            />
            <fieldset className="grid gap-2 sm:col-span-2">
              <legend className="mb-2 text-sm font-semibold">
                {t('admin.productoForm.certificaciones')}
              </legend>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {certificaciones.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={valores.certificacionIds.includes(c.id)}
                      onCheckedChange={(v) => alternarCertificacion(c.id, v === true)}
                    />
                    {c.nombre}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </Panel>

        <Panel
          titulo={t('admin.productoForm.fotos')}
          descripcion={
            esNuevo ? t('admin.productoForm.fotosNuevo') : t('admin.productoForm.fotosDetalle')
          }
        >
          <ImagenesProducto
            productoId={producto?.id}
            imagenes={producto?.imagenes}
            cola={cola}
            onAgregar={alAgregar}
            onQuitar={quitar}
          />
        </Panel>
      </div>

      <div className="grid gap-6 xl:sticky xl:top-24">
        <Panel titulo={t('admin.productoForm.precioStock')}>
          <div className="grid gap-4">
            <Field label={t('admin.productoForm.precio')} error={error('precioBasePen')}>
              <Input inputMode="decimal" {...campo('precioBasePen')} />
            </Field>
            <Field
              label={t('admin.productoForm.peso')}
              error={error('pesoG')}
              hint={t('admin.productoForm.pesoAyuda')}
            >
              <Input inputMode="numeric" {...campo('pesoG')} />
            </Field>
            <Field label={t('admin.productoForm.stockMinimo')} error={error('stockMinimo')}>
              <Input inputMode="numeric" {...campo('stockMinimo')} />
            </Field>
            {esNuevo ? (
              <Field
                label={t('admin.productoForm.stockInicial')}
                error={error('stockInicial')}
                hint={t('admin.productoForm.stockInicialAyuda')}
              >
                <Input inputMode="numeric" {...campo('stockInicial')} />
              </Field>
            ) : (
              <div className="grid gap-1.5">
                <FieldLabel>{t('admin.tabla.stock')}</FieldLabel>
                <div className="flex items-center justify-between gap-2">
                  <StockBadge stock={producto.stock} stockBajo={producto.stockBajo} />
                  <Link
                    to={`/admin/inventario?q=${encodeURIComponent(producto.sku)}`}
                    className="text-sm font-semibold text-link hover:underline"
                  >
                    {t('admin.productoForm.ajustarStock')}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </Panel>

        <Panel titulo={t('admin.productoForm.visibilidad')}>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={valores.activo}
              onCheckedChange={(v) => cambiar('activo', v === true)}
              className="mt-0.5"
            />
            <span className="grid">
              <span className="font-semibold">{t('admin.productoForm.activo')}</span>
              <span className="text-muted-foreground">{t('admin.productoForm.activoAyuda')}</span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={valores.destacado}
              onCheckedChange={(v) => cambiar('destacado', v === true)}
              className="mt-0.5"
            />
            <span className="grid">
              <span className="font-semibold">{t('admin.productoForm.destacado')}</span>
              <span className="text-muted-foreground">
                {t('admin.productoForm.destacadoAyuda')}
              </span>
            </span>
          </label>
        </Panel>

        <Button type="submit" size="lg" loading={guardar.isPending || subiendo}>
          {esNuevo ? t('admin.productoForm.crear') : t('admin.productoForm.guardar')}
        </Button>
      </div>
    </form>
  );
}

export function ProductoFormPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const esNuevo = id === 'nuevo';
  const { data: producto, isPending, isError, error } = useProductoAdmin(esNuevo ? null : id);

  const titulo = esNuevo
    ? t('admin.productoForm.tituloNuevo')
    : (producto?.nombre ?? t('ui.cargando'));

  return (
    <>
      <title>{`${titulo} · Kuski`}</title>
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/productos">
            <ArrowLeft aria-hidden="true" />
            {t('admin.secciones.productos')}
          </Link>
        </Button>
      </div>
      <PageHeader
        eyebrow={esNuevo ? t('admin.productoForm.eyebrowNuevo') : producto?.sku}
        titulo={titulo}
        acciones={
          producto?.activo && (
            <Button asChild variant="secondary" size="sm">
              <Link to={`/producto/${producto.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden="true" />
                {t('admin.productoForm.verEnTienda')}
              </Link>
            </Button>
          )
        }
      />
      {isError && <Alert variante="error" titulo={mensajeError(t, error)} />}
      {esNuevo ? (
        <Formulario />
      ) : isPending ? (
        <div className="grid gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        producto && <Formulario key={producto.id} producto={producto} />
      )}
    </>
  );
}
