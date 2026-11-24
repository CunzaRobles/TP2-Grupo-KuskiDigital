import { BookOpenText, Info, Printer } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioCard, RadioCardGroup } from '@/components/ui/radio-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EMPRESA } from '@/features/legal/empresa';
import { erroresDeCampos, mensajeError } from '@/lib/errores';
import { formatDate, formatMoney } from '@/lib/format';
import { useFormulario } from '@/lib/formulario';
import { Link } from '@/lib/motion/enlaces';
import { cn } from '@/lib/utils';
import { useRegistrarReclamacion } from './api';
import { BIENES, HOJA_VACIA, reclamacionSchema, TIPOS, TIPOS_DOCUMENTO } from './schemas';

// Fecha AAAA-MM-DD (sin hora) en el idioma de la tienda, sin desfase por zona horaria.
const fechaLarga = (iso, idioma) => formatDate(`${iso}T12:00:00`, idioma, { dateStyle: 'long' });

// Razón social, RUC y domicilio salen de features/legal/empresa.js: RUC y domicilio solo se
// muestran cuando están configurados.
function DatosProveedor({ codigo, fecha }) {
  const { t, i18n } = useTranslation();
  const filas = [
    ['razonSocial', EMPRESA.razonSocial],
    EMPRESA.ruc && ['ruc', EMPRESA.ruc],
    EMPRESA.domicilio && ['domicilio', EMPRESA.domicilio],
    ['fecha', formatDate(fecha, i18n.resolvedLanguage, { dateStyle: 'long' })],
    ['hoja', codigo ?? t('reclamaciones.proveedor.hojaPendiente')],
  ].filter(Boolean);

  return (
    <dl className="grid gap-x-8 gap-y-3 rounded-surface border border-border bg-surface p-5 text-sm sm:grid-cols-2">
      {filas.map(([clave, valor]) => (
        <div key={clave} className="grid gap-0.5">
          <dt className="text-muted-foreground">{t(`reclamaciones.proveedor.${clave}`)}</dt>
          <dd className={cn('font-semibold', clave === 'hoja' && codigo && 'tabular-nums')}>
            {valor}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function AvisoLegal({ className }) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        'flex gap-3 rounded-surface border border-foreground/20 bg-surface p-4 text-sm',
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="grid gap-1.5">
        <p className="font-semibold">{t('reclamaciones.avisoLegal')}</p>
        <p className="text-muted-foreground">{t('reclamaciones.plazo')}</p>
      </div>
    </div>
  );
}

function Seccion({ titulo, children }) {
  return (
    <fieldset className="grid gap-5 border-t border-border pt-8">
      <legend className="float-left mb-1 w-full font-display text-h4 font-medium">{titulo}</legend>
      {children}
    </fieldset>
  );
}

// Reclamo o queja: tarjetas de opción con la definición de cada una (D.S. 011-2011-PCM).
function ElegirTipo({ valor, onCambiar, error }) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <div className="grid gap-2">
      <p id={`${id}-label`} className="text-sm font-semibold">
        {t('reclamaciones.campos.tipo')}
      </p>
      <RadioCardGroup
        value={valor}
        onValueChange={onCambiar}
        aria-labelledby={`${id}-label`}
        className="sm:grid-cols-2"
      >
        {TIPOS.map((tipo) => (
          <RadioCard
            key={tipo}
            value={tipo}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
          >
            <span className="font-semibold">{t(`reclamaciones.tipos.${tipo}.nombre`)}</span>
            <span className="text-sm text-muted-foreground">
              {t(`reclamaciones.tipos.${tipo}.definicion`)}
            </span>
          </RadioCard>
        ))}
      </RadioCardGroup>
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Formulario({ onRegistrada }) {
  const { t } = useTranslation();
  const registrar = useRegistrarReclamacion();
  const idMenor = useId();
  const { valores, errores, cambiar, enviar, campo } = useFormulario(reclamacionSchema, HOJA_VACIA);

  // Errores de la API (VALIDATION_ERROR) en su campo; el resto, en un aviso.
  const erroresApi = erroresDeCampos(registrar.error);
  const error = (nombre) => (errores[nombre] ? t(errores[nombre]) : erroresApi[nombre]);
  const errorGeneral =
    registrar.isError && Object.keys(erroresApi).length === 0
      ? mensajeError(t, registrar.error)
      : null;

  const alEnviar = enviar((hoja) => registrar.mutate(hoja, { onSuccess: onRegistrada }));

  return (
    <form noValidate onSubmit={alEnviar} className="grid gap-10">
      <Seccion titulo={t('reclamaciones.secciones.consumidor')}>
        <Field label={t('reclamaciones.campos.nombre')} error={error('nombre')}>
          <Input autoComplete="name" maxLength={150} {...campo('nombre')} />
        </Field>
        <div className="grid items-start gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Field label={t('reclamaciones.campos.tipoDocumento')}>
            {(props) => (
              <Select
                value={valores.tipoDocumento}
                onValueChange={(v) => cambiar('tipoDocumento', v)}
              >
                <SelectTrigger {...props}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_DOCUMENTO.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {t(`reclamaciones.documentos.${tipo}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>
          <Field label={t('reclamaciones.campos.numeroDocumento')} error={error('numeroDocumento')}>
            <Input
              inputMode={valores.tipoDocumento === 'DNI' ? 'numeric' : 'text'}
              autoComplete="off"
              maxLength={12}
              {...campo('numeroDocumento')}
            />
          </Field>
        </div>
        <Field label={t('reclamaciones.campos.domicilio')} error={error('domicilio')}>
          <Input autoComplete="street-address" maxLength={255} {...campo('domicilio')} />
        </Field>
        <div className="grid items-start gap-5 sm:grid-cols-2">
          <Field label={t('reclamaciones.campos.telefono')} error={error('telefono')}>
            <Input type="tel" autoComplete="tel" maxLength={20} {...campo('telefono')} />
          </Field>
          <Field label={t('reclamaciones.campos.correo')} error={error('correo')}>
            <Input type="email" autoComplete="email" inputMode="email" {...campo('correo')} />
          </Field>
        </div>
        <div className="flex items-start gap-3">
          <Checkbox
            id={idMenor}
            checked={valores.menorDeEdad}
            onCheckedChange={(v) => cambiar('menorDeEdad', v === true)}
            className="mt-0.5"
          />
          <label htmlFor={idMenor} className="text-sm">
            {t('reclamaciones.campos.menorDeEdad')}
          </label>
        </div>
        {valores.menorDeEdad && (
          <Field label={t('reclamaciones.campos.apoderadoNombre')} error={error('apoderadoNombre')}>
            <Input maxLength={150} {...campo('apoderadoNombre')} />
          </Field>
        )}
      </Seccion>

      <Seccion titulo={t('reclamaciones.secciones.bien')}>
        <Field label={t('reclamaciones.campos.bienContratado')}>
          {(props) => (
            <Select
              value={valores.bienContratado}
              onValueChange={(v) => cambiar('bienContratado', v)}
            >
              <SelectTrigger {...props} className="sm:max-w-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BIENES.map((bien) => (
                  <SelectItem key={bien} value={bien}>
                    {t(`reclamaciones.bienes.${bien}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
        <Field label={t('reclamaciones.campos.descripcion')} error={error('descripcion')}>
          <Input maxLength={500} {...campo('descripcion')} />
        </Field>
        <div className="grid items-start gap-5 sm:grid-cols-2">
          <Field
            label={t('reclamaciones.campos.pedidoCodigo')}
            hint={t('reclamaciones.campos.pedidoCodigoAyuda')}
            error={error('pedidoCodigo')}
          >
            <Input placeholder="KD-000123" maxLength={9} {...campo('pedidoCodigo')} />
          </Field>
          <Field label={t('reclamaciones.campos.montoReclamado')} error={error('montoReclamado')}>
            <Input inputMode="decimal" placeholder="0.00" {...campo('montoReclamado')} />
          </Field>
        </div>
      </Seccion>

      <Seccion titulo={t('reclamaciones.secciones.detalle')}>
        <ElegirTipo
          valor={valores.tipo}
          onCambiar={(v) => cambiar('tipo', v)}
          error={error('tipo')}
        />
        <Field label={t('reclamaciones.campos.detalle')} error={error('detalle')}>
          <Textarea rows={5} maxLength={3000} {...campo('detalle')} />
        </Field>
        <Field
          label={t('reclamaciones.campos.pedidoConsumidor')}
          hint={t('reclamaciones.campos.pedidoConsumidorAyuda')}
          error={error('pedidoConsumidor')}
        >
          <Textarea rows={3} maxLength={2000} {...campo('pedidoConsumidor')} />
        </Field>
      </Seccion>

      <div className="grid gap-4 border-t border-border pt-8">
        {errorGeneral && <Alert variante="error" titulo={errorGeneral} />}
        <Button
          type="submit"
          size="lg"
          loading={registrar.isPending}
          className="sm:justify-self-start"
        >
          {t('reclamaciones.enviar')}
        </Button>
      </div>
    </form>
  );
}

// Constancia: la copia de la hoja registrada, con su código y la fecha límite. Imprimible.
function Constancia({ hoja, onNueva }) {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const titulo = useRef(null);

  useEffect(() => {
    window.scrollTo?.({ top: 0 });
    titulo.current?.focus();
  }, []);

  const { consumidor, bien } = hoja;
  const datos = [
    ['nombre', consumidor.nombre],
    [
      'numeroDocumento',
      `${t(`reclamaciones.documentos.${consumidor.tipoDocumento}`)} ${consumidor.numeroDocumento}`,
    ],
    ['domicilio', consumidor.domicilio],
    ['telefono', consumidor.telefono],
    ['correo', consumidor.correo],
    consumidor.menorDeEdad && ['apoderadoNombre', consumidor.apoderadoNombre],
  ].filter(Boolean);

  return (
    <section aria-labelledby="constancia-titulo" className="grid gap-8">
      <div className="grid gap-3">
        <h2
          id="constancia-titulo"
          ref={titulo}
          tabIndex={-1}
          className="text-h2 tabular-nums outline-none"
        >
          {t('reclamaciones.constancia.titulo', { codigo: hoja.codigo })}
        </h2>
        <Alert
          variante="exito"
          titulo={t('reclamaciones.constancia.registrada', { context: hoja.tipo })}
        >
          {t('reclamaciones.constancia.copia', {
            correo: consumidor.correo,
            fecha: fechaLarga(hoja.fechaLimite, idioma),
          })}
        </Alert>
      </div>

      <DatosProveedor codigo={hoja.codigo} fecha={hoja.creadoEn} />

      <dl className="grid gap-6 text-sm">
        <div className="grid gap-2">
          <dt className="font-display text-h4 font-medium">
            {t('reclamaciones.secciones.consumidor')}
          </dt>
          <dd className="grid gap-1">
            {datos.map(([clave, valor]) => (
              <p key={clave}>
                <span className="text-muted-foreground">{t(`reclamaciones.campos.${clave}`)}:</span>{' '}
                {valor}
              </p>
            ))}
          </dd>
        </div>
        <div className="grid gap-2">
          <dt className="font-display text-h4 font-medium">{t('reclamaciones.secciones.bien')}</dt>
          <dd className="grid gap-1">
            <p>
              <span className="text-muted-foreground">
                {t(`reclamaciones.bienes.${bien.tipo}`)}:
              </span>{' '}
              {bien.descripcion}
            </p>
            {bien.pedidoCodigo && (
              <p>
                <span className="text-muted-foreground">
                  {t('reclamaciones.constancia.pedidoCodigo')}:
                </span>{' '}
                {bien.pedidoCodigo}
              </p>
            )}
            {bien.montoReclamado != null && (
              <p>
                <span className="text-muted-foreground">
                  {t('reclamaciones.constancia.montoReclamado')}:
                </span>{' '}
                {formatMoney(bien.montoReclamado, 'PEN', idioma)}
              </p>
            )}
          </dd>
        </div>
        <div className="grid gap-2">
          <dt className="font-display text-h4 font-medium">
            {t('reclamaciones.secciones.detalle')}
          </dt>
          <dd className="grid gap-3">
            <p>
              <span className="text-muted-foreground">{t('reclamaciones.campos.tipo')}:</span>{' '}
              {t(`reclamaciones.tipos.${hoja.tipo}.nombre`)}
            </p>
            <p className="whitespace-pre-line">{hoja.detalle}</p>
            <p className="text-muted-foreground">{t('reclamaciones.campos.pedidoConsumidor')}:</p>
            <p className="whitespace-pre-line">{hoja.pedidoConsumidor}</p>
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-muted-foreground">{t('reclamaciones.constancia.fechaLimite')}</dt>
          <dd className="font-semibold">{fechaLarga(hoja.fechaLimite, idioma)}</dd>
        </div>
      </dl>

      <AvisoLegal />

      <div className="flex flex-wrap gap-3 print:hidden">
        <Button onClick={() => window.print()}>
          <Printer aria-hidden="true" />
          {t('reclamaciones.constancia.imprimir')}
        </Button>
        <Button variant="secondary" onClick={onNueva}>
          {t('reclamaciones.constancia.otra')}
        </Button>
        <Button asChild variant="ghost">
          <Link to="/">{t('reclamaciones.constancia.volver')}</Link>
        </Button>
      </div>
    </section>
  );
}

/**
 * Libro de Reclamaciones virtual (Ley 29571, arts. 150-151; D.S. 011-2011-PCM y modificatorias).
 * Formulario en las tres secciones de la hoja oficial y, al enviarlo, la constancia con el
 * código correlativo, que se puede imprimir.
 */
export function LibroReclamacionesPage() {
  const { t } = useTranslation();
  const [hoja, setHoja] = useState(null);
  const [hoy] = useState(() => new Date());

  return (
    <div className="container-page py-10 sm:py-14 print:py-0">
      <div className="mx-auto grid max-w-3xl gap-8">
        <title>{`${t('reclamaciones.titulo')} · Kuski`}</title>
        <header className="grid gap-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <BookOpenText className="size-5" aria-hidden="true" />
            {EMPRESA.razonSocial}
          </p>
          <h1 className="text-h1">{t('reclamaciones.titulo')}</h1>
          {!hoja && (
            <p className="text-lead text-muted-foreground">{t('reclamaciones.descripcion')}</p>
          )}
        </header>

        {hoja ? (
          <Constancia hoja={hoja} onNueva={() => setHoja(null)} />
        ) : (
          <>
            <DatosProveedor fecha={hoy} />
            <AvisoLegal />
            <Formulario onRegistrada={setHoja} />
          </>
        )}
      </div>
    </div>
  );
}
