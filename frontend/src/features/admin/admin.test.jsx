import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { json, llamadas, renderRuta, stubApi, stubNavegador } from '@/test/tienda';

const cuenta = (rol, extra = {}) => ({
  id: { admin_gerente: 1, admin_ventas: 2, admin_logistica: 3, cliente: 10 }[rol],
  nombre: 'Rosa',
  apellido: 'Huamán',
  correo: `${rol}@kuski.pe`,
  rol,
  ...extra,
});

const sesion = (rol) => ({ 'GET /auth/me': { usuario: cuenta(rol) } });

const dashboard = {
  kpis: {
    ingresosMes: { valorPen: 1500, variacionPct: 50, serie: [0, 300, 1200] },
    pedidosMes: { valor: 10, variacionPct: -20, serie: [0, 2, 8] },
    ticketPromedio: { valorPen: 150, variacionPct: null, serie: [0, 150, 150] },
    stockBajo: {
      valor: 2,
      productos: [
        { id: 35, sku: 'ART-002', nombre: 'Retablo Ayacuchano', stock: 0, categoria: 'Artesanía' },
      ],
    },
  },
  serieMensual: [
    { mes: '2026-08', ingresosPen: 1000, pedidos: 8 },
    { mes: '2026-09', ingresosPen: 1500, pedidos: 10 },
  ],
  serieDiaria: [],
  pedidosPorEstado: {
    pendiente: 0,
    pagado: 3,
    preparando: 1,
    en_transito: 2,
    entregado: 9,
    cancelado: 0,
  },
};

const productoInventario = {
  id: 1,
  sku: 'CAF-001',
  nombre: 'Café Orgánico Kuski',
  stock: 10,
  stockMinimo: 5,
  stockBajo: false,
  activo: true,
  categoria: { id: 1, nombre: 'Café' },
  imagen: null,
};

const pagina = (items) => ({
  items,
  pagination: { page: 1, limit: 20, total: items.length, totalPages: 1 },
});

beforeEach(() => {
  stubNavegador();
});

describe('Panel admin · acceso por rol', () => {
  it('sin sesión lleva al login del panel y vuelve a la sección pedida', async () => {
    const user = userEvent.setup();
    let conectado = false;
    stubApi({
      'GET /auth/me': () =>
        conectado
          ? { usuario: cuenta('admin_logistica') }
          : json(401, { error: { code: 'NO_AUTENTICADO', message: '' } }),
      'POST /auth/login': () => {
        conectado = true;
        return { usuario: cuenta('admin_logistica') };
      },
      'GET /admin/inventario': pagina([productoInventario]),
    });
    const { router } = renderRuta('/admin/inventario');

    await user.type(await screen.findByLabelText('Correo electrónico'), 'logistica@kuski.pe');
    await user.type(screen.getByLabelText('Contraseña'), 'Kuski2026');
    await user.click(screen.getByRole('button', { name: 'Entrar al panel' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Inventario' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/inventario');
  });

  it('una cuenta de cliente no entra: ve un aviso claro', async () => {
    stubApi(sesion('cliente'));
    renderRuta('/admin/dashboard');
    expect(
      await screen.findByText(/Tu cuenta es de cliente/, {}, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Menú del panel' })).not.toBeInTheDocument();
  });

  it('el login del panel avisa si la cuenta es de cliente', async () => {
    const user = userEvent.setup();
    let conectado = false;
    stubApi({
      'GET /auth/me': () =>
        conectado
          ? { usuario: cuenta('cliente') }
          : json(401, { error: { code: 'NO_AUTENTICADO', message: '' } }),
      'POST /auth/login': () => {
        conectado = true;
        return { usuario: cuenta('cliente') };
      },
    });
    renderRuta('/admin/login');

    await user.type(await screen.findByLabelText('Correo electrónico'), 'maria@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Cliente2026');
    await user.click(screen.getByRole('button', { name: 'Entrar al panel' }));

    expect(await screen.findByText('Esta cuenta no tiene acceso al panel')).toBeInTheDocument();
  });

  it('/admin lleva a la primera sección del rol (logística no tiene dashboard)', async () => {
    stubApi({ ...sesion('admin_logistica'), 'GET /admin/pedidos': pagina([]) });
    const { router } = renderRuta('/admin');
    expect(await screen.findByRole('heading', { level: 1, name: 'Pedidos' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/pedidos');
  });

  it.each([
    [
      'admin_gerente',
      [
        'Dashboard',
        'Estadísticas',
        'Ventas',
        'Pedidos',
        'Inventario',
        'Productos',
        'Categorías',
        'Usuarios',
      ],
      [],
    ],
    [
      'admin_ventas',
      ['Dashboard', 'Estadísticas', 'Ventas', 'Pedidos'],
      ['Inventario', 'Productos', 'Categorías', 'Usuarios'],
    ],
    [
      'admin_logistica',
      ['Pedidos', 'Inventario'],
      ['Dashboard', 'Estadísticas', 'Ventas', 'Productos', 'Categorías', 'Usuarios'],
    ],
  ])('el menú de %s solo muestra sus secciones', async (rol, visibles, ocultas) => {
    stubApi({
      ...sesion(rol),
      'GET /admin/dashboard': dashboard,
      'GET /admin/pedidos': pagina([]),
    });
    renderRuta('/admin');
    const menu = await screen.findByRole('navigation', { name: 'Menú del panel' });
    for (const nombre of visibles)
      expect(within(menu).getByRole('link', { name: nombre })).toBeInTheDocument();
    for (const nombre of ocultas)
      expect(within(menu).queryByRole('link', { name: nombre })).not.toBeInTheDocument();
  });

  it('una sección sin permiso muestra el aviso 403 dentro del panel (ruta protegida)', async () => {
    const fetchMock = stubApi(sesion('admin_ventas'));
    renderRuta('/admin/usuarios');
    expect(
      await screen.findByRole('heading', { name: 'Sin acceso a esta sección' }),
    ).toBeInTheDocument();
    expect(llamadas(fetchMock, 'GET /admin/usuarios')).toHaveLength(0);
  });
});

describe('Dashboard', () => {
  it('muestra los KPIs con su variación y el stock bajo', async () => {
    stubApi({ ...sesion('admin_gerente'), 'GET /admin/dashboard': dashboard });
    renderRuta('/admin/dashboard');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Hola, Rosa' }),
    ).toBeInTheDocument();
    const ingresos = (await screen.findByRole('heading', { name: 'Ingresos del mes' })).closest(
      'article',
    );
    expect(within(ingresos).getByText('S/ 1,500.00')).toBeInTheDocument();
    expect(within(ingresos).getByText('+50%')).toBeInTheDocument();
    const ticket = screen.getByRole('heading', { name: 'Ticket promedio' }).closest('article');
    expect(within(ticket).getByText('Sin datos del mes anterior')).toBeInTheDocument();
    expect(screen.getByText('Retablo Ayacuchano')).toBeInTheDocument();
  });

  it('el gráfico mensual también se puede leer como tabla', async () => {
    const user = userEvent.setup();
    stubApi({ ...sesion('admin_gerente'), 'GET /admin/dashboard': dashboard });
    renderRuta('/admin/dashboard');

    await user.click(await screen.findByRole('button', { name: 'Ver como tabla' }));
    const tabla = screen.getByRole('table', { name: 'Ingresos mensuales' });
    expect(within(tabla).getByText('S/ 1,500.00')).toBeInTheDocument();
  });
});

describe('Inventario', () => {
  it('edita el stock en línea como ajuste del kardex', async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi({
      ...sesion('admin_logistica'),
      'GET /admin/inventario': pagina([productoInventario]),
      'POST /admin/inventario/movimientos': (_u, body) => ({
        producto: { id: 1, stock: body.stockNuevo, stockMinimo: 5, stockBajo: false },
        movimiento: { id: 1 },
      }),
    });
    renderRuta('/admin/inventario');

    await user.click(
      await screen.findByRole('button', { name: 'Editar stock de Café Orgánico Kuski (ahora 10)' }),
    );
    const campo = screen.getByLabelText('Stock contado de Café Orgánico Kuski');
    await user.clear(campo);
    await user.type(campo, '7{Enter}');

    await waitFor(() =>
      expect(llamadas(fetchMock, 'POST /admin/inventario/movimientos')).toHaveLength(1),
    );
    expect(llamadas(fetchMock, 'POST /admin/inventario/movimientos')[0].body).toEqual({
      productoId: 1,
      tipo: 'ajuste',
      stockNuevo: 7,
    });
  });

  it('Escape cancela la edición sin llamar a la API', async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi({
      ...sesion('admin_gerente'),
      'GET /admin/inventario': pagina([productoInventario]),
    });
    renderRuta('/admin/inventario');

    await user.click(await screen.findByRole('button', { name: /Editar stock de Café/ }));
    await user.type(screen.getByLabelText(/Stock contado/), '{Escape}');

    expect(screen.queryByLabelText(/Stock contado/)).not.toBeInTheDocument();
    expect(llamadas(fetchMock, 'POST /admin/inventario/movimientos')).toHaveLength(0);
  });
});

describe('Pedidos', () => {
  const detalle = {
    codigo: 'KD-000007',
    estado: 'pagado',
    creadoEn: '2026-09-30T10:00:00.000Z',
    moneda: 'PEN',
    montos: { subtotalPen: 70, envioPen: 15, igvPen: 15.3, totalPen: 100.3, total: 100.3 },
    direccion: {
      nombreDestinatario: 'María Quispe',
      paisCodigo: 'PE',
      ciudad: 'Cusco',
      direccion: 'Av. Cultura 1',
    },
    items: [{ productoId: 1, nombreProducto: 'Café', cantidad: 2, subtotalPen: 70 }],
    pago: { metodo: 'yape', estado: 'aprobado', numeroOperacion: 'SIM-1' },
    envio: { transportista: 'Olva Courier', metodo: 'estandar', codigoSeguimiento: 'OLV-1' },
    tracking: {
      estadoActual: 'pagado',
      cancelado: false,
      pasos: [
        { clave: 'confirmado', estado: 'pagado', completado: true, fecha: null },
        { clave: 'preparando', estado: 'preparando', completado: false, fecha: null },
        { clave: 'en_transito', estado: 'en_transito', completado: false, fecha: null },
        { clave: 'entregado', estado: 'entregado', completado: false, fecha: null },
      ],
      historial: [
        { estado: 'pagado', comentario: 'Pago aprobado', fecha: '2026-09-30T10:00:00.000Z' },
      ],
    },
    cliente: { id: 10, nombre: 'María Quispe', correo: 'maria@example.com' },
    transicionesPermitidas: ['preparando', 'cancelado'],
  };

  it('logística cambia el estado desde el detalle', async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi({
      ...sesion('admin_logistica'),
      'GET /admin/pedidos': pagina([]),
      'GET /admin/pedidos/KD-000007': detalle,
      'PATCH /admin/pedidos/KD-000007/estado': (_u, body) => ({
        ...detalle,
        estado: body.estado,
        transicionesPermitidas: ['en_transito', 'cancelado'],
      }),
    });
    renderRuta('/admin/pedidos?codigo=KD-000007');

    await user.type(await screen.findByLabelText('Comentario (opcional)'), 'Empacado');
    await user.click(screen.getByRole('button', { name: 'Marcar como Preparando' }));

    await waitFor(() =>
      expect(llamadas(fetchMock, 'PATCH /admin/pedidos/KD-000007/estado')).toHaveLength(1),
    );
    expect(llamadas(fetchMock, 'PATCH /admin/pedidos/KD-000007/estado')[0].body).toEqual({
      estado: 'preparando',
      comentario: 'Empacado',
    });
  });

  it('ventas ve el pedido pero no puede cambiar su estado', async () => {
    stubApi({
      ...sesion('admin_ventas'),
      'GET /admin/pedidos': pagina([]),
      'GET /admin/pedidos/KD-000007': detalle,
    });
    renderRuta('/admin/pedidos?codigo=KD-000007');

    expect(await screen.findByText('maria@example.com')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Marcar como/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).not.toBeInTheDocument();
  });
});

describe('Búsqueda rápida (Ctrl+K)', () => {
  it('se abre con Ctrl+K y solo ofrece las secciones del rol', async () => {
    const user = userEvent.setup();
    stubApi({ ...sesion('admin_logistica'), 'GET /admin/pedidos': pagina([]) });
    const { router } = renderRuta('/admin/pedidos');
    await screen.findByRole('heading', { level: 1, name: 'Pedidos' });

    await user.keyboard('{Control>}k{/Control}');
    const dialogo = await screen.findByRole('dialog', { name: 'Búsqueda rápida' });
    const opciones = within(dialogo)
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(opciones.join(' ')).toContain('Inventario');
    expect(opciones.join(' ')).not.toContain('Usuarios');

    await user.type(within(dialogo).getByRole('combobox'), 'invent{Enter}');
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/inventario'));
  });
});

describe('Formulario de producto', () => {
  it('valida antes de enviar y marca los campos con error', async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi({
      ...sesion('admin_gerente'),
      'GET /categorias': [],
      'GET /comunidades': [],
      'GET /certificaciones': [],
    });
    renderRuta('/admin/productos/nuevo');

    await user.click(await screen.findByRole('button', { name: 'Crear producto' }));

    expect(await screen.findByText('De 3 a 30 letras, números o guiones')).toBeInTheDocument();
    expect(screen.getByText('Elige una categoría')).toBeInTheDocument();
    expect(llamadas(fetchMock, 'POST /admin/productos')).toHaveLength(0);
  });

  it('muestra la vista previa de las fotos elegidas y descarta tipos no válidos', async () => {
    const user = userEvent.setup({ applyAccept: false });
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
    stubApi({
      ...sesion('admin_gerente'),
      'GET /categorias': [],
      'GET /comunidades': [],
      'GET /certificaciones': [],
    });
    renderRuta('/admin/productos/nuevo');

    const input = await screen.findByLabelText(/Elige fotos/);
    await user.upload(input, [
      new File(['x'], 'cafe.png', { type: 'image/png' }),
      new File(['x'], 'notas.pdf', { type: 'application/pdf' }),
    ]);

    expect(screen.getByRole('img', { name: 'cafe.png' })).toHaveAttribute('src', 'blob:preview');
    expect(screen.queryByRole('img', { name: 'notas.pdf' })).not.toBeInTheDocument();
    expect(screen.getByText('Por subir')).toBeInTheDocument();
  });
});
