import { Plus, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
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
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useSesion } from '@/features/auth/api';
import { registroSchema } from '@/features/auth/schemas';
import { erroresDeCampos } from '@/lib/errores';
import { mensajeErrorAdmin as mensajeError } from './errores';
import { formatDate } from '@/lib/format';
import { useFormulario } from '@/lib/formulario';
import { banderaPais } from '@/lib/paises';
import { useGuardarUsuario, useUsuariosAdmin } from './api';
import { ROLES } from './constantes';
import { BuscadorFiltro } from './filtros-pedidos';
import { FilaVacia, PageHeader, PaginacionAdmin, Tabla, Td } from './ui';
import { useFiltrosUrl } from './use-filtros';

const TODOS = 'todos';

// Alta de una cuenta del equipo: mismas reglas de contraseña que el registro.
const nuevoUsuarioSchema = z
  .object(registroSchema.shape)
  .pick({ nombre: true, apellido: true, correo: true, password: true })
  .extend({ rol: z.enum(ROLES) });

function RolSelect({ valor, onChange, disabled, label, ...props }) {
  const { t } = useTranslation();
  return (
    <Select value={valor} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger size="sm" aria-label={label} {...props}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {t(`admin.roles.${r}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function NuevoUsuario({ onCerrar }) {
  const { t } = useTranslation();
  const guardar = useGuardarUsuario();
  const { valores, errores, cambiar, enviar, campo } = useFormulario(nuevoUsuarioSchema, {
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    rol: 'admin_ventas',
  });
  const erroresApi = erroresDeCampos(guardar.error);
  const error = (c) => (errores[c] && t(errores[c])) || erroresApi[c];

  const alEnviar = enviar((datos) =>
    guardar.mutate(
      { datos },
      {
        onSuccess: (u) => {
          toast.success(t('admin.usuariosPage.creado', { correo: u.correo }));
          onCerrar();
        },
      },
    ),
  );

  return (
    <form noValidate onSubmit={alEnviar} className="grid gap-4">
      {guardar.isError && <Alert variante="error" titulo={mensajeError(t, guardar.error)} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('auth.campos.nombre')} error={error('nombre')}>
          <Input autoComplete="off" {...campo('nombre')} />
        </Field>
        <Field label={t('auth.campos.apellido')} error={error('apellido')}>
          <Input autoComplete="off" {...campo('apellido')} />
        </Field>
      </div>
      <Field label={t('auth.campos.correo')} error={error('correo')}>
        <Input type="email" autoComplete="off" {...campo('correo')} />
      </Field>
      <Field
        label={t('admin.usuariosPage.passwordInicial')}
        error={error('password')}
        hint={t('admin.usuariosPage.passwordAyuda')}
      >
        <PasswordInput autoComplete="new-password" {...campo('password')} />
      </Field>
      <Field label={t('admin.usuariosPage.rol')}>
        {(props) => (
          <RolSelect valor={valores.rol} onChange={(r) => cambiar('rol', r)} {...props} />
        )}
      </Field>
      <DialogFooter>
        <Button variant="secondary" onClick={onCerrar}>
          {t('ui.cancelar')}
        </Button>
        <Button type="submit" loading={guardar.isPending}>
          {t('admin.usuariosPage.crear')}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function UsuariosPage() {
  const { t, i18n } = useTranslation();
  const { data: yo } = useSesion();
  const { filtros, page, actualizar, setPage } = useFiltrosUrl(['q', 'rol', 'activo']);
  const query = Object.fromEntries(
    Object.entries({ ...filtros, page }).filter(([, v]) => v !== ''),
  );
  const { data, isPending, isError, error, isPlaceholderData } = useUsuariosAdmin(query);
  const guardar = useGuardarUsuario();
  const [creando, setCreando] = useState(false);

  const cambiar = (usuario, datos, mensaje) =>
    guardar.mutate(
      { id: usuario.id, datos },
      {
        onSuccess: () => toast.success(mensaje),
        onError: (e) => toast.error(mensajeError(t, e)),
      },
    );

  const columnas = [
    { clave: 'usuario', etiqueta: t('admin.tabla.usuario') },
    { clave: 'rol', etiqueta: t('admin.usuariosPage.rol') },
    { clave: 'pedidos', etiqueta: t('admin.secciones.pedidos'), alinear: 'derecha' },
    { clave: 'alta', etiqueta: t('admin.usuariosPage.alta') },
    { clave: 'estado', etiqueta: t('admin.tabla.estado') },
    { clave: 'acciones', etiqueta: <span className="sr-only">{t('admin.tabla.acciones')}</span> },
  ];

  return (
    <>
      <title>{`${t('admin.secciones.usuarios')} · Kuski`}</title>
      <PageHeader
        titulo={t('admin.secciones.usuarios')}
        descripcion={t('admin.usuariosPage.descripcion')}
        acciones={
          <Button onClick={() => setCreando(true)}>
            <Plus aria-hidden="true" />
            {t('admin.usuariosPage.nuevo')}
          </Button>
        }
      />

      <div className="grid gap-3 rounded-xl border bg-card p-4 shadow-soft sm:grid-cols-[2fr_1fr_1fr]">
        <BuscadorFiltro
          valor={filtros.q}
          onBuscar={(q) => actualizar({ q })}
          placeholder={t('admin.usuariosPage.buscar')}
        />
        <Field label={t('admin.usuariosPage.rol')}>
          {(props) => (
            <Select
              value={filtros.rol || TODOS}
              onValueChange={(v) => actualizar({ rol: v === TODOS ? '' : v })}
            >
              <SelectTrigger size="sm" {...props}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>{t('admin.filtros.todos')}</SelectItem>
                <SelectItem value="admin_gerente,admin_ventas,admin_logistica">
                  {t('admin.usuariosPage.equipo')}
                </SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`admin.roles.${r}`)}
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
                <SelectItem value="true">{t('admin.usuariosPage.activos')}</SelectItem>
                <SelectItem value="false">{t('admin.usuariosPage.inactivos')}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </Field>
      </div>

      {isError && <Alert variante="error" titulo={mensajeError(t, error)} />}

      <Tabla
        caption={t('admin.secciones.usuarios')}
        columnas={columnas}
        cargando={isPending}
        className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}
      >
        {data?.items.length === 0 && (
          <FilaVacia columnas={columnas.length}>{t('admin.tabla.sinResultados')}</FilaVacia>
        )}
        {data?.items.map((u) => {
          const soyYo = u.id === yo?.id;
          const nombre = `${u.nombre} ${u.apellido}`;
          return (
            <tr key={u.id} className="hover:bg-secondary/50">
              <Td>
                <span className="grid">
                  <span className="font-semibold">
                    {nombre}
                    {soyYo && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({t('admin.usuariosPage.tu')})
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {banderaPais(u.paisCodigo)} {u.correo}
                  </span>
                </span>
              </Td>
              <Td className="w-52">
                <RolSelect
                  valor={u.rol}
                  label={t('admin.usuariosPage.rolDe', { nombre })}
                  disabled={soyYo || guardar.isPending}
                  onChange={(rol) =>
                    cambiar(
                      u,
                      { rol },
                      t('admin.usuariosPage.rolCambiado', { nombre, rol: t(`admin.roles.${rol}`) }),
                    )
                  }
                />
              </Td>
              <Td alinear="derecha">{u.totalPedidos}</Td>
              <Td className="whitespace-nowrap text-muted-foreground">
                {formatDate(u.creadoEn, i18n.language)}
              </Td>
              <Td>
                <Badge variant={u.activo ? 'verde' : 'outline'}>
                  {u.activo ? t('admin.usuariosPage.activo') : t('admin.usuariosPage.inactivo')}
                </Badge>
              </Td>
              <Td alinear="derecha">
                {!soyYo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={u.activo ? 'text-destructive' : undefined}
                    disabled={guardar.isPending}
                    onClick={() =>
                      cambiar(
                        u,
                        { activo: !u.activo },
                        t(
                          u.activo
                            ? 'admin.usuariosPage.desactivado'
                            : 'admin.usuariosPage.activado',
                          { nombre },
                        ),
                      )
                    }
                  >
                    {u.activo ? <UserX aria-hidden="true" /> : <UserCheck aria-hidden="true" />}
                    {u.activo
                      ? t('admin.usuariosPage.desactivar')
                      : t('admin.usuariosPage.activar')}
                    <span className="sr-only"> {nombre}</span>
                  </Button>
                )}
              </Td>
            </tr>
          );
        })}
      </Tabla>
      <PaginacionAdmin pagination={data?.pagination} onPage={setPage} />

      <Dialog open={creando} onOpenChange={setCreando}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.usuariosPage.nuevo')}</DialogTitle>
            <DialogDescription>{t('admin.usuariosPage.nuevoDescripcion')}</DialogDescription>
          </DialogHeader>
          {creando && <NuevoUsuario onCerrar={() => setCreando(false)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
