import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { CLAVE_CARRITO } from '@/features/carrito/carrito-storage';
import {
  USUARIO,
  carritoApi,
  json,
  llamadas,
  renderRuta,
  stubApi,
  stubNavegador,
} from '@/test/tienda';
import { destinoSeguro } from './schemas';

beforeAll(stubNavegador);
afterEach(() => vi.unstubAllGlobals());

// /auth/me responde 401 hasta que el login (o el registro) crea la sesión.
const apiConLogin = (rutas = {}) => {
  let usuario = null;
  const fetchMock = stubApi({
    'GET /auth/me': () =>
      usuario ? { usuario } : json(401, { error: { code: 'NO_AUTENTICADO', message: 'x' } }),
    'POST /auth/login': (_url, { correo, password }) => {
      if (password !== 'KuskiCliente2026!') {
        return json(401, {
          error: { code: 'CREDENCIALES_INVALIDAS', message: 'Correo o contraseña incorrectos' },
        });
      }
      usuario = { ...USUARIO, correo };
      return { usuario };
    },
    'GET /carrito': carritoApi([]),
    'GET /pedidos': { items: [], pagination: { page: 1, limit: 5, total: 0, totalPages: 0 } },
    ...rutas,
  });
  return fetchMock;
};

describe('login', () => {
  it('valida con Zod antes de llamar a la API y enfoca el primer error', async () => {
    const user = userEvent.setup();
    const fetchMock = apiConLogin();
    renderRuta('/login');

    await user.type(await screen.findByLabelText('Correo electrónico'), 'maria@');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText(/Ingresa un correo válido/)).toBeInTheDocument();
    expect(screen.getByText('Ingresa tu contraseña')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Correo electrónico')).toHaveFocus());
    expect(llamadas(fetchMock, 'POST /auth/login')).toHaveLength(0);
  });

  it('muestra el error de credenciales y, al corregir, vuelve a la página pedida', async () => {
    const user = userEvent.setup();
    const fetchMock = apiConLogin();
    const { router } = renderRuta('/login?redirect=%2Fcuenta');

    await user.type(
      await screen.findByLabelText('Correo electrónico'),
      'MARIA.quispe@example.com ',
    );
    await user.type(screen.getByLabelText('Contraseña'), 'mal');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');

    await user.clear(screen.getByLabelText('Contraseña'));
    await user.type(screen.getByLabelText('Contraseña'), 'KuskiCliente2026!');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/cuenta'));
    // El correo se normaliza como en el backend
    expect(llamadas(fetchMock, 'POST /auth/login').at(-1).body.correo).toBe(
      'maria.quispe@example.com',
    );
  });

  it('enlaza al panel admin y lleva a un administrador directo a su panel', async () => {
    const user = userEvent.setup();
    let usuario = null;
    stubApi({
      'GET /auth/me': () =>
        usuario ? { usuario } : json(401, { error: { code: 'NO_AUTENTICADO', message: 'x' } }),
      'POST /auth/login': (_url, { correo }) => {
        usuario = { ...USUARIO, correo, rol: 'admin_gerente' };
        return { usuario };
      },
    });
    const { router } = renderRuta('/login');

    expect(
      await screen.findByRole('link', { name: 'Ingresar al panel de administración' }),
    ).toHaveAttribute('href', '/admin/login');

    await user.type(screen.getByLabelText('Correo electrónico'), 'gerente@kuski.pe');
    await user.type(screen.getByLabelText('Contraseña'), 'KuskiAdmin2026!');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/admin/));
  });

  it('fusiona el carrito de invitado al iniciar sesión', async () => {
    window.localStorage.setItem(
      CLAVE_CARRITO,
      JSON.stringify([{ productoId: 1, slug: 'cafe', nombre: 'Café', stock: 5, cantidad: 2 }]),
    );
    const user = userEvent.setup();
    const fetchMock = apiConLogin({
      'POST /carrito/fusionar': { carrito: carritoApi([]), ajustes: [] },
    });
    renderRuta('/login');

    await user.type(await screen.findByLabelText('Correo electrónico'), USUARIO.correo);
    await user.type(screen.getByLabelText('Contraseña'), 'KuskiCliente2026!');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => expect(llamadas(fetchMock, 'POST /carrito/fusionar')).toHaveLength(1));
    expect(llamadas(fetchMock, 'POST /carrito/fusionar')[0].body).toEqual({
      items: [{ productoId: 1, cantidad: 2 }],
    });
  });
});

describe('registro', () => {
  it('muestra los requisitos de la contraseña y valida la confirmación', async () => {
    const user = userEvent.setup();
    apiConLogin();
    renderRuta('/registro');

    const password = await screen.findByLabelText('Contraseña');
    await user.type(password, 'kuski');
    expect(screen.getByText('Al menos una letra').closest('li')).toHaveClass('text-musgo');
    expect(screen.getByText('Al menos 8 caracteres').closest('li')).not.toHaveClass('text-musgo');

    await user.type(screen.getByLabelText('Repite la contraseña'), 'otra');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(screen.getAllByText('Este campo es obligatorio')).toHaveLength(2);
  });

  it('marca el correo si ya existe una cuenta', async () => {
    const user = userEvent.setup();
    const fetchMock = apiConLogin({
      'POST /auth/registro': json(409, {
        error: { code: 'CORREO_EN_USO', message: 'Ya existe una cuenta con ese correo' },
      }),
    });
    renderRuta('/registro');

    await user.type(await screen.findByLabelText('Nombre'), 'Anna');
    await user.type(screen.getByLabelText('Apellido'), 'Becker');
    await user.type(screen.getByLabelText('Correo electrónico'), 'anna@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Kastanie2026');
    await user.type(screen.getByLabelText('Repite la contraseña'), 'Kastanie2026');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText(/Ya existe una cuenta con ese correo/)).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');
    expect(llamadas(fetchMock, 'POST /auth/registro')[0].body).toEqual({
      nombre: 'Anna',
      apellido: 'Becker',
      correo: 'anna@example.com',
      password: 'Kastanie2026',
      paisCodigo: 'PE',
      idiomaPreferido: 'es',
      monedaPreferida: 'PEN',
    });
  });
});

describe('rutas protegidas', () => {
  it('sin sesión, el checkout lleva al login y conserva el destino', async () => {
    apiConLogin();
    const { router } = renderRuta('/checkout');

    expect(
      await screen.findByText(
        'Inicia sesión para terminar tu compra. Tu carrito se guarda en tu cuenta.',
      ),
    ).toBeInTheDocument();
    expect(router.state.location.search).toBe('?redirect=%2Fcheckout');
  });

  it('solo acepta redirecciones internas', () => {
    expect(destinoSeguro('/checkout')).toBe('/checkout');
    expect(destinoSeguro('//malicioso.com')).toBe('/cuenta');
    expect(destinoSeguro('https://malicioso.com')).toBe('/cuenta');
    expect(destinoSeguro(null)).toBe('/cuenta');
  });
});

it('la 404 ofrece volver al catálogo y a las categorías', async () => {
  stubApi();
  renderRuta('/no-existe');
  expect(
    await screen.findByRole('heading', {
      level: 1,
      name: 'Esta ruta no lleva a ninguna comunidad',
    }),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Explorar el catálogo/ })).toHaveAttribute(
    'href',
    '/catalogo',
  );
  const sugerencias = screen.getByRole('navigation', {
    name: 'O visita una de nuestras categorías',
  });
  expect(within(sugerencias).getByRole('link', { name: 'Textiles' })).toHaveAttribute(
    'href',
    '/catalogo?categoria=textiles',
  );
});
