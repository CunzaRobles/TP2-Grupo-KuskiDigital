import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
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
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { erroresDeCampos } from '@/lib/errores';
import { mensajeErrorAdmin as mensajeError } from './errores';
import { useFormulario } from '@/lib/formulario';
import { useCategoriasAdmin, useEliminarCategoria, useGuardarCategoria } from './api';
import { Miniatura } from './productos-page';
import { FilaVacia, PageHeader, Tabla, Td } from './ui';

const categoriaSchema = z.object({
  nombre: z.string().trim().min(2, 'admin.validacion.nombre').max(100, 'validacion.largo'),
  slug: z
    .string()
    .trim()
    .regex(/^([a-z0-9-]{1,120})?$/, 'admin.validacion.slug')
    .transform((s) => s || undefined),
  descripcion: z.string().trim().max(1000, 'validacion.largo'),
  imagenUrl: z
    .string()
    .trim()
    .refine((v) => !v || /^https?:\/\/\S+$/.test(v), 'admin.validacion.url')
    .transform((v) => v || null),
  orden: z.coerce
    .number()
    .int('admin.validacion.entero')
    .min(0, 'admin.validacion.minimo')
    .max(999, 'admin.validacion.maximo'),
});

function FormularioCategoria({ categoria, onCerrar }) {
  const { t } = useTranslation();
  const guardar = useGuardarCategoria();
  const { errores, enviar, campo } = useFormulario(categoriaSchema, {
    nombre: categoria?.nombre ?? '',
    slug: categoria?.slug ?? '',
    descripcion: categoria?.descripcion ?? '',
    imagenUrl: categoria?.imagenUrl ?? '',
    orden: String(categoria?.orden ?? 0),
  });
  const erroresApi = erroresDeCampos(guardar.error);
  const error = (c) => (errores[c] && t(errores[c])) || erroresApi[c];

  const alEnviar = enviar((datos) =>
    guardar.mutate(
      { id: categoria?.id, datos },
      {
        onSuccess: (c) => {
          toast.success(t('admin.categoriasPage.guardada', { nombre: c.nombre }));
          onCerrar();
        },
      },
    ),
  );

  return (
    <form noValidate onSubmit={alEnviar} className="grid gap-4">
      {guardar.isError && <Alert variante="error" titulo={mensajeError(t, guardar.error)} />}
      <Field label={t('admin.categoriasPage.nombre')} error={error('nombre')}>
        <Input {...campo('nombre')} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
        <Field
          label={t('admin.productoForm.slug')}
          error={error('slug')}
          hint={t('admin.productoForm.slugAyuda')}
        >
          <Input {...campo('slug')} className="font-mono" />
        </Field>
        <Field label={t('admin.categoriasPage.orden')} error={error('orden')}>
          <Input inputMode="numeric" {...campo('orden')} />
        </Field>
      </div>
      <Field label={t('admin.productoForm.descripcion')} error={error('descripcion')}>
        <Input {...campo('descripcion')} />
      </Field>
      <Field
        label={t('admin.categoriasPage.imagen')}
        error={error('imagenUrl')}
        hint={t('admin.categoriasPage.imagenAyuda')}
      >
        <Input type="url" {...campo('imagenUrl')} />
      </Field>
      <DialogFooter>
        <Button variant="secondary" onClick={onCerrar}>
          {t('ui.cancelar')}
        </Button>
        <Button type="submit" loading={guardar.isPending}>
          {t('admin.acciones.guardar')}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CategoriasPage() {
  const { t } = useTranslation();
  const { data = [], isPending, isError, error } = useCategoriasAdmin();
  const eliminar = useEliminarCategoria();
  // null: cerrado · {}: nueva · categoría: editar
  const [editando, setEditando] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);

  const confirmarEliminar = () =>
    eliminar.mutate(aEliminar.id, {
      onSuccess: () => {
        toast.success(t('admin.categoriasPage.eliminada', { nombre: aEliminar.nombre }));
        setAEliminar(null);
      },
    });

  const columnas = [
    { clave: 'categoria', etiqueta: t('admin.tabla.categoria') },
    { clave: 'slug', etiqueta: 'Slug' },
    { clave: 'productos', etiqueta: t('admin.secciones.productos'), alinear: 'derecha' },
    { clave: 'orden', etiqueta: t('admin.categoriasPage.orden'), alinear: 'derecha' },
    { clave: 'acciones', etiqueta: <span className="sr-only">{t('admin.tabla.acciones')}</span> },
  ];

  return (
    <>
      <title>{`${t('admin.secciones.categorias')} · Kuski`}</title>
      <PageHeader
        titulo={t('admin.secciones.categorias')}
        descripcion={t('admin.categoriasPage.descripcion')}
        acciones={
          <Button onClick={() => setEditando({})}>
            <Plus aria-hidden="true" />
            {t('admin.categoriasPage.nueva')}
          </Button>
        }
      />
      {isError && <Alert variante="error" titulo={mensajeError(t, error)} />}

      <Tabla
        caption={t('admin.secciones.categorias')}
        columnas={columnas}
        cargando={isPending}
        filasCarga={4}
      >
        {!isPending && data.length === 0 && (
          <FilaVacia columnas={columnas.length}>{t('admin.tabla.sinResultados')}</FilaVacia>
        )}
        {data.map((c) => (
          <tr key={c.id} className="hover:bg-secondary/50">
            <Td>
              <span className="flex items-center gap-3">
                <Miniatura imagen={c.imagenUrl ? { url: c.imagenUrl } : null} />
                <span className="grid min-w-0">
                  <span className="font-semibold">{c.nombre}</span>
                  <span className="max-w-md truncate text-xs text-muted-foreground">
                    {c.descripcion}
                  </span>
                </span>
              </span>
            </Td>
            <Td className="font-mono text-xs">{c.slug}</Td>
            <Td alinear="derecha">
              {t('admin.categoriasPage.productosN', {
                count: c.totalProductos,
                activos: c.productosActivos,
              })}
            </Td>
            <Td alinear="derecha">{c.orden}</Td>
            <Td alinear="derecha">
              <span className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditando(c)}>
                  <Pencil aria-hidden="true" />
                  {t('admin.acciones.editar')}
                  <span className="sr-only"> {c.nombre}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setAEliminar(c)}
                  disabled={c.totalProductos > 0}
                  title={c.totalProductos > 0 ? t('admin.categoriasPage.conProductos') : undefined}
                >
                  <Trash2 aria-hidden="true" />
                  {t('admin.acciones.eliminar')}
                  <span className="sr-only"> {c.nombre}</span>
                </Button>
              </span>
            </Td>
          </tr>
        ))}
      </Tabla>
      <p className="text-sm text-muted-foreground">{t('admin.categoriasPage.nota')}</p>

      <Dialog open={Boolean(editando)} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando?.id ? t('admin.categoriasPage.editar') : t('admin.categoriasPage.nueva')}
            </DialogTitle>
            <DialogDescription>{t('admin.categoriasPage.formDescripcion')}</DialogDescription>
          </DialogHeader>
          {editando && (
            <FormularioCategoria
              key={editando.id ?? 'nueva'}
              categoria={editando.id ? editando : null}
              onCerrar={() => setEditando(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(aEliminar)} onOpenChange={(o) => !o && setAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('admin.categoriasPage.confirmarEliminar', { nombre: aEliminar?.nombre })}
            </DialogTitle>
            <DialogDescription>
              {t('admin.categoriasPage.confirmarEliminarDetalle')}
            </DialogDescription>
          </DialogHeader>
          {eliminar.isError && <Alert variante="error" titulo={mensajeError(t, eliminar.error)} />}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAEliminar(null)}>
              {t('ui.cancelar')}
            </Button>
            <Button variant="destructive" onClick={confirmarEliminar} loading={eliminar.isPending}>
              {t('admin.acciones.eliminar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
