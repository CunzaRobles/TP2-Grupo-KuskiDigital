import { MapPin, Plus } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PaisSelect } from '@/components/ui/pais-select';
import { RadioCard, RadioCardGroup } from '@/components/ui/radio-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useValidacion } from '@/lib/formulario';
import { banderaPais, nombrePais } from '@/lib/paises';
import { NUEVA } from './estado';
import { Paso } from './paso';
import { direccionSchema } from './schemas';

// Dirección en una línea: "Av. de la Cultura 1520, Cusco · Perú"
export function DireccionTexto({ direccion, className }) {
  const { i18n } = useTranslation();
  return (
    <span className={className}>
      {direccion.direccion}, {direccion.ciudad}
      {direccion.codigoPostal && ` ${direccion.codigoPostal}`} ·{' '}
      <span aria-hidden="true">{banderaPais(direccion.paisCodigo)} </span>
      {nombrePais(direccion.paisCodigo, i18n.resolvedLanguage)}
    </span>
  );
}

function FormularioDireccion({ valores, errores, onCambiar, guardar, onGuardar }) {
  const { t } = useTranslation();
  const idGuardar = useId();
  const error = (campo) => errores[campo] && t(errores[campo]);
  const input = (campo) => ({
    value: valores[campo] ?? '',
    onChange: (e) => onCambiar({ [campo]: e.target.value }),
  });

  return (
    <div className="grid gap-5 rounded-xl border bg-surface p-5 sm:grid-cols-2">
      <Field label={t('checkout.envio.destinatario')} error={error('nombreDestinatario')}>
        <Input autoComplete="name" {...input('nombreDestinatario')} />
      </Field>
      <Field
        label={t('checkout.envio.pais')}
        hint={t('checkout.envio.paisAyuda')}
        error={error('paisCodigo')}
      >
        {(props) => (
          <PaisSelect
            {...props}
            placeholder={t('checkout.envio.elegirPais')}
            value={valores.paisCodigo}
            onValueChange={(paisCodigo) => onCambiar({ paisCodigo })}
          />
        )}
      </Field>
      <Field
        label={t('checkout.envio.direccion')}
        error={error('direccion')}
        className="sm:col-span-2"
      >
        <Input autoComplete="street-address" {...input('direccion')} />
      </Field>
      <Field label={t('checkout.envio.ciudad')} error={error('ciudad')}>
        <Input autoComplete="address-level2" {...input('ciudad')} />
      </Field>
      <Field label={t('checkout.envio.codigoPostal')} error={error('codigoPostal')}>
        <Input autoComplete="postal-code" {...input('codigoPostal')} />
      </Field>
      <Field
        label={t('checkout.envio.telefono')}
        hint={t('checkout.envio.telefonoAyuda')}
        error={error('telefono')}
        className="sm:col-span-2"
      >
        <Input type="tel" autoComplete="tel" {...input('telefono')} />
      </Field>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Checkbox id={idGuardar} checked={guardar} onCheckedChange={(v) => onGuardar(v === true)} />
        <FieldLabel htmlFor={idGuardar} className="font-medium">
          {t('checkout.envio.guardar')}
        </FieldLabel>
      </div>
    </div>
  );
}

/**
 * Paso 1 · Envío: una dirección guardada (la principal viene elegida) o una nueva. Elegir el
 * país ya recalcula el envío y el total en el resumen.
 */
export function PasoEnvio({ direcciones, seleccion, envio, onCambiar, onContinuar }) {
  const { t } = useTranslation();
  const { errores, comprobar } = useValidacion(direccionSchema, envio.nueva);
  const esNueva = seleccion === NUEVA;

  // Entrega la dirección nueva ya validada (o null si eligió una guardada)
  const continuar = (formulario) => {
    const datos = esNueva ? comprobar(formulario) : null;
    if (esNueva && !datos) return;
    onContinuar(datos);
  };

  return (
    <Paso
      titulo={t('checkout.envio.titulo')}
      descripcion={t('checkout.envio.descripcion')}
      onContinuar={continuar}
      textoContinuar={t('checkout.envio.continuar')}
    >
      {direcciones.isPending ? (
        <div className="grid gap-3" aria-hidden="true">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      ) : (
        <>
          {direcciones.data?.length > 0 && (
            <RadioCardGroup
              value={String(seleccion)}
              onValueChange={(valor) =>
                onCambiar({ seleccion: valor === NUEVA ? NUEVA : Number(valor) })
              }
              aria-label={t('checkout.envio.titulo')}
            >
              {direcciones.data.map((d) => (
                <RadioCard key={d.id} value={String(d.id)}>
                  <span className="flex flex-wrap items-center gap-2 font-semibold">
                    <MapPin className="size-4 text-verde" aria-hidden="true" />
                    {d.nombreDestinatario}
                    {d.esPrincipal && (
                      <Badge variant="neutral">{t('cuenta.direcciones.principal')}</Badge>
                    )}
                  </span>
                  <DireccionTexto direccion={d} className="text-sm text-muted-foreground" />
                </RadioCard>
              ))}
              <RadioCard value={NUEVA}>
                <span className="flex items-center gap-2 font-semibold">
                  <Plus className="size-4 text-verde" aria-hidden="true" />
                  {t('checkout.envio.otra')}
                </span>
              </RadioCard>
            </RadioCardGroup>
          )}

          {esNueva && (
            <FormularioDireccion
              valores={envio.nueva}
              errores={errores}
              onCambiar={(cambios) => onCambiar({ nueva: { ...envio.nueva, ...cambios } })}
              guardar={envio.guardar}
              onGuardar={(guardar) => onCambiar({ guardar })}
            />
          )}
        </>
      )}
    </Paso>
  );
}
