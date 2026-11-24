import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { llamadas, renderRuta, stubApi, stubNavegador } from '@/test/tienda';

const cuenta = (rol) => ({
  id: { admin_gerente: 1, admin_ventas: 2, admin_logistica: 3 }[rol],
  nombre: 'Luis',
  apellido: 'Mamani',
  correo: `${rol}@kuski.pe`,
  rol,
});
const sesion = (rol) => ({ 'GET /auth/me': { usuario: cuenta(rol) } });

const hoja = (id, cambios = {}) => ({
  id,
  codigo: `LR-2026-00000${id}`,
  tipo: 'reclamo',
  estado: 'recibido',
  creadoEn: '2026-11-24T15:00:00.000Z',
  fechaLimite: '2026-12-15',
  diasRestantes: 10,
  consumidor: {
    nombre: 'María Quispe',
    tipoDocumento: 'DNI',
    numeroDocumento: '45678912',
    domicilio: 'Av. El Sol 123, Cusco',
    telefono: '+51 984 123 456',
    correo: 'maria@example.com',
    menorDeEdad: false,
    apoderadoNombre: null,
  },
  bien: { tipo: 'producto', pedidoCodigo: 'KD-000123', montoReclamado: 65, descripcion: 'Café' },
  detalle: 'El paquete llegó abierto.',
  pedidoConsumidor: 'Un paquete nuevo.',
  respuesta: null,
  ...cambios,
});

const pagina = (items) => ({
  items,
  pagination: { page: 1, limit: 20, total: items.length, totalPages: 1 },
});

beforeEach(stubNavegador);

describe('Panel · Reclamaciones', () => {
  it('ventas la ve en el menú y en Ctrl+K; logística no', async () => {
    const user = userEvent.setup();
    stubApi({ ...sesion('admin_ventas'), 'GET /admin/reclamaciones': pagina([]) });
    renderRuta('/admin/reclamaciones');

    const menu = await screen.findByRole('navigation', { name: 'Menú del panel' });
    expect(within(menu).getByRole('link', { name: 'Reclamaciones' })).toHaveAttribute(
      'href',
      '/admin/reclamaciones',
    );
    await screen.findByRole('heading', { level: 1, name: 'Reclamaciones' });
    await user.keyboard('{Control>}k{/Control}');
    const dialogo = await screen.findByRole('dialog', { name: 'Búsqueda rápida' });
    expect(within(dialogo).getByRole('option', { name: /Reclamaciones/ })).toBeInTheDocument();
  });

  it('logística no la ve en el menú y la ruta muestra el aviso 403', async () => {
    const fetchMock = stubApi({ ...sesion('admin_logistica'), 'GET /admin/pedidos': pagina([]) });
    renderRuta('/admin/reclamaciones');

    expect(
      await screen.findByRole('heading', { name: 'Sin acceso a esta sección' }),
    ).toBeInTheDocument();
    const menu = screen.getByRole('navigation', { name: 'Menú del panel' });
    expect(within(menu).queryByRole('link', { name: 'Reclamaciones' })).not.toBeInTheDocument();
    expect(llamadas(fetchMock, 'GET /admin/reclamaciones')).toHaveLength(0);
  });

  it('muestra los días restantes y marca en rojo los de 3 días o menos', async () => {
    stubApi({
      ...sesion('admin_gerente'),
      'GET /admin/reclamaciones': pagina([
        hoja(1, { diasRestantes: 10 }),
        hoja(2, { diasRestantes: 3 }),
        hoja(3, { diasRestantes: -2 }),
        hoja(4, { estado: 'respondido', diasRestantes: null }),
      ]),
    });
    renderRuta('/admin/reclamaciones');

    await screen.findByRole('cell', { name: 'LR-2026-000004' });
    const filas = screen.getAllByRole('row').slice(1);
    const plazo = (fila) => within(fila).getByText(/hábil|Respondida/);
    expect(plazo(filas[0])).toHaveTextContent('10 días hábiles');
    expect(plazo(filas[0])).not.toHaveAttribute('data-urgente');
    expect(plazo(filas[1])).toHaveTextContent('3 días hábiles');
    expect(plazo(filas[1])).toHaveAttribute('data-urgente');
    expect(plazo(filas[1])).toHaveClass('text-destructive');
    expect(plazo(filas[2])).toHaveTextContent('Vencida hace 2 días hábiles');
    expect(plazo(filas[2])).toHaveAttribute('data-urgente');
    expect(plazo(filas[3])).toHaveTextContent('Respondida');
  });

  it('filtra por estado y fecha con la URL', async () => {
    const fetchMock = stubApi({
      ...sesion('admin_ventas'),
      'GET /admin/reclamaciones': pagina([]),
    });
    renderRuta('/admin/reclamaciones?estado=recibido&desde=2026-11-01&hasta=2026-11-30');

    await waitFor(() => expect(llamadas(fetchMock, 'GET /admin/reclamaciones')).toHaveLength(1));
    const { url } = llamadas(fetchMock, 'GET /admin/reclamaciones')[0];
    expect(Object.fromEntries(url.searchParams)).toEqual({
      page: '1',
      estado: 'recibido',
      desde: '2026-11-01',
      hasta: '2026-11-30',
    });
  });

  it('registra la respuesta desde el detalle', async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi({
      ...sesion('admin_ventas'),
      'GET /admin/reclamaciones': pagina([hoja(1)]),
      'PATCH /admin/reclamaciones/1': (_url, cuerpo) => hoja(1, { estado: cuerpo.estado }),
    });
    renderRuta('/admin/reclamaciones');

    await screen.findByRole('cell', { name: 'LR-2026-000001' });
    await user.click(screen.getByRole('button', { name: 'Gestionar LR-2026-000001' }));
    const detalle = await screen.findByRole('dialog', { name: 'Hoja LR-2026-000001' });
    expect(within(detalle).getByText('El paquete llegó abierto.')).toBeInTheDocument();

    // Muy corta: se marca en el campo y no se envía
    await user.type(within(detalle).getByLabelText('Respuesta al consumidor'), 'Lo vemos');
    await user.click(within(detalle).getByRole('button', { name: 'Enviar respuesta' }));
    expect(within(detalle).getByLabelText('Respuesta al consumidor')).toHaveAccessibleDescription(
      'Escribe una respuesta de al menos 20 caracteres',
    );
    expect(llamadas(fetchMock, 'PATCH /admin/reclamaciones/1')).toHaveLength(0);

    await user.type(
      within(detalle).getByLabelText('Respuesta al consumidor'),
      ' y te enviamos un paquete nuevo sin costo.',
    );
    await user.click(within(detalle).getByRole('button', { name: 'Enviar respuesta' }));

    await waitFor(() =>
      expect(llamadas(fetchMock, 'PATCH /admin/reclamaciones/1')[0]?.body).toEqual({
        estado: 'respondido',
        respuesta: 'Lo vemos y te enviamos un paquete nuevo sin costo.',
      }),
    );
  });
});
