import { MapPin, Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PaisSelect } from '@/components/ui/pais-select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { useSesion } from '@/features/auth/api';
import { DireccionTexto } from '@/features/checkout/paso-envio';
import { direccionSchema } from '@/features/checkout/schemas';
import { SectionError } from '@/features/home/section-heading';
import { erroresDeCampos, mensajeError } from '@/lib/errores';
import { useFormulario } from '@/lib/formulario';
import {
  useDirecciones,
  useEliminarDireccion,
  useGuardarDireccion,
  useMarcarPrincipal,
} from './api';

function NuevaDireccionDialog({ abierto, onAbierto }) {
  const { t } = useTranslation();
  const { data: usuario } = useSesion();
  const guardar = useGuardarDireccion();
  const { valores, errores, cambiar, enviar, campo } = useFormulario(direccionSchema, {
    nombreDestinatario: usuario ? `${usuario.nombre} ${usuario.apellido}` : '',
    paisCodigo: usuario?.paisCodigo ?? 'PE',
    ciudad: '',
    direccion: '',
    codigoPostal: '',
    telefono: usuario?.telefono ?? '',
  });
  const erroresApi = erroresDeCampos(guardar.error);
  const error = (c) => (errores[c] ? t(errores[c]) : erroresApi[c]);

  const alEnviar = enviar((datos) =>
    guardar.mutate(datos, {
      onSuccess: () => {
        toast.success(t('cuenta.direcciones.guardada'));
        onAbierto(false);
      },
    }),
  );

  return (
    <Dialog open={abierto} onOpenChange={onAbierto}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('cuenta.direcciones.nueva')}</DialogTitle>
          <DialogDescription>{t('cuenta.direcciones.nuevaDescripcion')}</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={alEnviar} className="grid gap-4 sm:grid-cols-2">
          {guardar.isError && !Object.keys(erroresApi).length && (
            <Alert
              variante="error"
              titulo={mensajeError(t, guardar.error)}
              className="sm:col-span-2"
            />
          )}
          <Field label={t('checkout.envio.destinatario')} error={error('nombreDestinatario')}>
            <Input autoComplete="name" {...campo('nombreDestinatario')} />
          </Field>
          <Field label={t('checkout.envio.pais')} error={error('paisCodigo')}>
            {(props) => (
              <PaisSelect
                {...props}
                value={valores.paisCodigo}
                onValueChange={(codigo) => cambiar('paisCodigo', codigo)}
              />
            )}
          </Field>
          <Field
            label={t('checkout.envio.direccion')}
            error={error('direccion')}
            className="sm:col-span-2"
          >
            <Input autoComplete="street-address" {...campo('direccion')} />
          </Field>
          <Field label={t('checkout.envio.ciudad')} error={error('ciudad')}>
            <Input autoComplete="address-level2" {...campo('ciudad')} />
          </Field>
          <Field label={t('checkout.envio.codigoPostal')} error={error('codigoPostal')}>
            <Input autoComplete="postal-code" {...campo('codigoPostal')} />
          </Field>
          <Field
            label={t('checkout.envio.telefono')}
            error={error('telefono')}
            className="sm:col-span-2"
          >
            <Input type="tel" autoComplete="tel" {...campo('telefono')} />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button variant="ghost" onClick={() => onAbierto(false)}>
              {t('ui.cancelar')}
            </Button>
            <Button type="submit" loading={guardar.isPending}>
              {t('cuenta.direcciones.guardar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmarEliminar({ direccion, onCerrar }) {
  const { t } = useTranslation();
  const eliminar = useEliminarDireccion();

  return (
    <Dialog open={Boolean(direccion)} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('cuenta.direcciones.eliminarTitulo')}</DialogTitle>
          <DialogDescription>
            {direccion && <DireccionTexto direccion={direccion} />}
          </DialogDescription>
        </DialogHeader>
        {eliminar.isError && <Alert variante="error" titulo={mensajeError(t, eliminar.error)} />}
        <DialogFooter>
          <Button variant="ghost" onClick={onCerrar}>
            {t('ui.cancelar')}
          </Button>
          <Button
            variant="destructive"
            loading={eliminar.isPending}
            onClick={() =>
              eliminar.mutate(direccion.id, {
                onSuccess: () => {
                  toast.success(t('cuenta.direcciones.eliminada'));
                  onCerrar();
                },
              })
            }
          >
            <Trash2 aria-hidden="true" />
            {t('cuenta.direcciones.eliminar')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Mis direcciones: la principal se usa por defecto en el checkout.
export function DireccionesPage() {
  const { t } = useTranslation();
  const direcciones = useDirecciones();
  const marcar = useMarcarPrincipal();
  const [nueva, setNueva] = useState(false);
  const [aEliminar, setAEliminar] = useState(null);

  const accionNueva = (
    <Button onClick={() => setNueva(true)}>
      <Plus aria-hidden="true" />
      {t('cuenta.direcciones.nueva')}
    </Button>
  );

  let contenido;
  if (direcciones.isPending) {
    contenido = (
      <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
    );
  } else if (direcciones.isError) {
    contenido = <SectionError onRetry={direcciones.refetch} />;
  } else if (direcciones.data.length === 0) {
    contenido = (
      <EmptyState
        objeto="busqueda"
        titulo={t('cuenta.direcciones.vacio')}
        descripcion={t('cuenta.direcciones.vacioDetalle')}
        accion={accionNueva}
      />
    );
  } else {
    contenido = (
      <ul className="grid gap-4 sm:grid-cols-2">
        {direcciones.data.map((d) => (
          <li
            key={d.id}
            className="grid content-between gap-4 rounded-2xl border bg-card p-5 shadow-soft"
          >
            <div className="grid gap-1.5">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                <MapPin className="size-4 text-verde" aria-hidden="true" />
                {d.nombreDestinatario}
                {d.esPrincipal && (
                  <Badge variant="verde">{t('cuenta.direcciones.principal')}</Badge>
                )}
              </p>
              <DireccionTexto direccion={d} className="text-sm text-muted-foreground" />
              {d.telefono && <p className="text-sm text-muted-foreground">{d.telefono}</p>}
            </div>
            <div className="flex flex-wrap gap-2 border-t pt-3">
              {!d.esPrincipal && (
                <Button
                  variant="ghost"
                  size="sm"
                  loading={marcar.isPending && marcar.variables === d.id}
                  onClick={() => marcar.mutate(d.id)}
                >
                  <Star aria-hidden="true" />
                  {t('cuenta.direcciones.marcarPrincipal')}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => setAEliminar(d)}
                aria-label={t('cuenta.direcciones.eliminarDe', { direccion: d.direccion })}
              >
                <Trash2 aria-hidden="true" />
                {t('cuenta.direcciones.eliminar')}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section aria-label={t('cuenta.nav.direcciones')} className="grid gap-6">
      <title>{`${t('cuenta.nav.direcciones')} · Kuski`}</title>
      {direcciones.data?.length > 0 && <div className="flex justify-end">{accionNueva}</div>}
      {contenido}
      {/* key: el formulario se reinicia cada vez que se abre */}
      {nueva && <NuevaDireccionDialog key="nueva" abierto={nueva} onAbierto={setNueva} />}
      <ConfirmarEliminar direccion={aEliminar} onCerrar={() => setAEliminar(null)} />
    </section>
  );
}
