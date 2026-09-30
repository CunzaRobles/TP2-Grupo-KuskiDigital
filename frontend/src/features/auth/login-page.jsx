import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { mensajeError } from '@/lib/errores';
import { useFormulario } from '@/lib/formulario';
import { useLogin, useSesion } from './api';
import { AuthLayout } from './auth-layout';
import { destinoSeguro, loginSchema } from './schemas';

/**
 * Inicio de sesión. Con ?redirect= vuelve a donde estaba (p. ej. el checkout). El carrito de
 * invitado se fusiona solo al detectarse la sesión (CarritoProvider).
 */
export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const destino = destinoSeguro(params.get('redirect'));
  const { data: usuario } = useSesion();
  const login = useLogin();
  const { errores, enviar, campo } = useFormulario(loginSchema, { correo: '', password: '' });

  // Ya había sesión (p. ej. volvió con "atrás"): no tiene sentido mostrar el formulario.
  if (usuario && !login.isSuccess) return <Navigate to={destino} replace />;

  const alEnviar = enviar((datos) =>
    login.mutate(datos, { onSuccess: () => navigate(destino, { replace: true }) }),
  );

  const enlaceRegistro = `/registro${params.get('redirect') ? `?redirect=${encodeURIComponent(destino)}` : ''}`;

  return (
    <AuthLayout
      eyebrow={t('auth.login.eyebrow')}
      titulo={t('auth.login.titulo')}
      descripcion={
        params.get('redirect') === '/checkout'
          ? t('auth.login.descripcionCheckout')
          : t('auth.login.descripcion')
      }
    >
      <title>{`${t('auth.login.titulo')} · Kuski`}</title>
      <form noValidate onSubmit={alEnviar} className="grid gap-5">
        {login.isError && (
          <Alert variante="error" titulo={mensajeError(t, login.error)}>
            {login.error?.code === 'CREDENCIALES_INVALIDAS' && t('auth.login.ayudaCredenciales')}
          </Alert>
        )}
        <Field label={t('auth.campos.correo')} error={errores.correo && t(errores.correo)}>
          <Input type="email" autoComplete="email" inputMode="email" {...campo('correo')} />
        </Field>
        <Field label={t('auth.campos.password')} error={errores.password && t(errores.password)}>
          <PasswordInput autoComplete="current-password" {...campo('password')} />
        </Field>
        <Button type="submit" size="lg" loading={login.isPending}>
          {t('auth.login.enviar')}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        {t('auth.login.sinCuenta')}{' '}
        <Link to={enlaceRegistro} className="font-semibold text-link hover:underline">
          {t('auth.login.crearCuenta')}
        </Link>
      </p>
    </AuthLayout>
  );
}
