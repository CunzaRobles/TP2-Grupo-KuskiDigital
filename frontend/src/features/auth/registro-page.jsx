import { Check, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate, useSearchParams } from 'react-router';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PaisSelect } from '@/components/ui/pais-select';
import { PasswordInput } from '@/components/ui/password-input';
import { useCurrency } from '@/lib/currency';
import { erroresDeCampos, mensajeError } from '@/lib/errores';
import { useFormulario } from '@/lib/formulario';
import { Link } from '@/lib/motion/enlaces';
import { useNavigate } from '@/lib/motion/use-navigate';
import { cn } from '@/lib/utils';
import { useRegistro, useSesion } from './api';
import { AuthLayout } from './auth-layout';
import { REQUISITOS_PASSWORD, destinoSeguro, registroSchema } from './schemas';

function Requisitos({ password }) {
  const { t } = useTranslation();
  return (
    <ul className="grid gap-1 text-xs" aria-label={t('auth.requisitos.titulo')}>
      {REQUISITOS_PASSWORD.map(({ clave, cumple }) => {
        const ok = cumple(password);
        const Icono = ok ? Check : Circle;
        return (
          <li
            key={clave}
            className={cn('flex items-center gap-2', ok ? 'text-musgo' : 'text-muted-foreground')}
          >
            <Icono className="size-3.5" aria-hidden="true" />
            {t(clave)}
            <span className="sr-only">{ok ? t('auth.requisitos.cumplido') : ''}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function RegistroPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const destino = destinoSeguro(params.get('redirect'));
  const { moneda } = useCurrency();
  const { data: usuario } = useSesion();
  const registro = useRegistro();
  const { valores, errores, cambiar, enviar, campo } = useFormulario(registroSchema, {
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    confirmacion: '',
    paisCodigo: 'PE',
  });

  if (usuario && !registro.isSuccess) return <Navigate to={destino} replace />;

  // El backend puede rechazar el correo (ya registrado) o algún campo: se marcan en el formulario.
  const erroresApi = {
    ...erroresDeCampos(registro.error),
    ...(registro.error?.code === 'CORREO_EN_USO' && { correo: t('errores.CORREO_EN_USO') }),
  };
  const error = (nombre) => (errores[nombre] ? t(errores[nombre]) : erroresApi[nombre]);

  // La confirmación solo se valida aquí: la API recibe los datos de la cuenta.
  const alEnviar = enviar(({ nombre, apellido, correo, password, paisCodigo }) =>
    registro.mutate(
      {
        nombre,
        apellido,
        correo,
        password,
        paisCodigo,
        idiomaPreferido: i18n.resolvedLanguage ?? 'es',
        monedaPreferida: moneda,
      },
      { onSuccess: () => navigate(destino, { replace: true }) },
    ),
  );

  const enlaceLogin = `/login${params.get('redirect') ? `?redirect=${encodeURIComponent(destino)}` : ''}`;

  return (
    <AuthLayout
      eyebrow={t('auth.registro.eyebrow')}
      titulo={t('auth.registro.titulo')}
      descripcion={t('auth.registro.descripcion')}
    >
      <title>{`${t('auth.registro.titulo')} · Kuski`}</title>
      <form noValidate onSubmit={alEnviar} className="grid gap-5">
        {registro.isError && registro.error?.code !== 'CORREO_EN_USO' && (
          <Alert variante="error" titulo={mensajeError(t, registro.error)} />
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t('auth.campos.nombre')} error={error('nombre')}>
            <Input autoComplete="given-name" {...campo('nombre')} />
          </Field>
          <Field label={t('auth.campos.apellido')} error={error('apellido')}>
            <Input autoComplete="family-name" {...campo('apellido')} />
          </Field>
        </div>
        <Field label={t('auth.campos.correo')} error={error('correo')}>
          <Input type="email" autoComplete="email" inputMode="email" {...campo('correo')} />
        </Field>
        <Field label={t('auth.campos.pais')} error={error('paisCodigo')}>
          {(props) => (
            <PaisSelect
              {...props}
              value={valores.paisCodigo}
              onValueChange={(codigo) => cambiar('paisCodigo', codigo)}
            />
          )}
        </Field>
        <div className="grid gap-2">
          <Field label={t('auth.campos.password')} error={error('password')}>
            <PasswordInput autoComplete="new-password" {...campo('password')} />
          </Field>
          <Requisitos password={valores.password} />
        </div>
        <Field label={t('auth.campos.confirmacion')} error={error('confirmacion')}>
          <PasswordInput autoComplete="new-password" {...campo('confirmacion')} />
        </Field>
        <Button type="submit" size="lg" loading={registro.isPending}>
          {t('auth.registro.enviar')}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        {t('auth.registro.conCuenta')}{' '}
        <Link to={enlaceLogin} className="font-semibold text-link hover:underline">
          {t('auth.registro.iniciarSesion')}
        </Link>
      </p>
    </AuthLayout>
  );
}
