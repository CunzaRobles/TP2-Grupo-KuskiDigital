import { ArrowLeft, BarChart3, Boxes, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { Logo } from '@/components/layout/logo';
import { Alert } from '@/components/ui/alert';
import { AndeanDivider } from '@/components/ui/andean-divider';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { ThemeScope } from '@/components/ui/theme-scope';
import { useLogin, useSesion } from '@/features/auth/api';
import { destinoSeguro, loginSchema } from '@/features/auth/schemas';
import { mensajeErrorAdmin as mensajeError } from './errores';
import { useFormulario } from '@/lib/formulario';
import { esAdmin } from './permisos';

const PUNTOS = [
  { Icono: BarChart3, clave: 'admin.login.punto1' },
  { Icono: Boxes, clave: 'admin.login.punto2' },
  { Icono: Truck, clave: 'admin.login.punto3' },
];

// Solo destinos dentro del panel.
const destinoAdmin = (redirect) => {
  const destino = destinoSeguro(redirect, '/admin');
  return destino.startsWith('/admin') && !destino.startsWith('/admin/login') ? destino : '/admin';
};

/**
 * Acceso del equipo (gerencia, ventas, logística). Usa el mismo login de la API; si la cuenta
 * es de cliente lo explica en lugar de entrar.
 */
export function AdminLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const destino = destinoAdmin(params.get('redirect'));
  const { data: usuario } = useSesion();
  const login = useLogin();
  const { errores, enviar, campo } = useFormulario(loginSchema, { correo: '', password: '' });

  if (usuario && esAdmin(usuario.rol) && !login.isPending) return <Navigate to={destino} replace />;

  const alEnviar = enviar((datos) =>
    login.mutate(datos, {
      onSuccess: ({ usuario: u }) => {
        if (esAdmin(u.rol)) navigate(destino, { replace: true });
      },
    }),
  );

  const esCliente = usuario && !esAdmin(usuario.rol);

  return (
    <ThemeScope className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <title>{`${t('admin.login.titulo')} · Kuski`}</title>
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-cafe p-12 text-alpaca lg:flex">
        <Logo tone="light" />
        <div className="grid max-w-md gap-6">
          <p className="eyebrow text-maiz">{t('admin.login.eyebrow')}</p>
          <p className="font-serif text-h2 leading-tight">{t('admin.login.lema')}</p>
          <AndeanDivider className="w-40 text-maiz" />
          <ul className="grid gap-3 text-sm text-alpaca/85">
            {PUNTOS.map(({ Icono, clave }) => (
              <li key={clave} className="flex items-center gap-3">
                <Icono className="size-4 shrink-0 text-maiz" aria-hidden="true" />
                {t(clave)}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-alpaca/60">Kuski Agroindustria S.A. · Cusco, Perú</p>
      </aside>

      <main className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <span className="lg:hidden">
            <Logo compact />
          </span>
          <Button asChild variant="ghost" size="sm" className="ml-auto">
            <Link to="/">
              <ArrowLeft aria-hidden="true" />
              {t('admin.volverTienda')}
            </Link>
          </Button>
        </div>
        <section className="mx-auto grid w-full max-w-sm flex-1 content-center gap-8 py-10">
          <header className="grid gap-3">
            <p className="eyebrow text-link">{t('admin.titulo')}</p>
            <h1 className="text-h2">{t('admin.login.titulo')}</h1>
            <p className="text-muted-foreground">{t('admin.login.descripcion')}</p>
          </header>
          <form noValidate onSubmit={alEnviar} className="grid gap-5">
            {login.isError && <Alert variante="error" titulo={mensajeError(t, login.error)} />}
            {esCliente && (
              <Alert variante="aviso" titulo={t('admin.login.sinAcceso')}>
                {t('admin.login.sinAccesoDetalle', { correo: usuario.correo })}
              </Alert>
            )}
            <Field label={t('auth.campos.correo')} error={errores.correo && t(errores.correo)}>
              <Input type="email" autoComplete="username" inputMode="email" {...campo('correo')} />
            </Field>
            <Field
              label={t('auth.campos.password')}
              error={errores.password && t(errores.password)}
            >
              <PasswordInput autoComplete="current-password" {...campo('password')} />
            </Field>
            <Button type="submit" size="lg" loading={login.isPending}>
              {t('admin.login.enviar')}
            </Button>
          </form>
        </section>
      </main>
    </ThemeScope>
  );
}
