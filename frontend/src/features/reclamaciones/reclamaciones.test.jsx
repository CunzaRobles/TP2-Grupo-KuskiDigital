import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { json, llamadas, renderRuta, stubApi, stubNavegador } from '@/test/tienda';

beforeAll(stubNavegador);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// Respuesta de POST /reclamaciones (la constancia)
const constancia = (cuerpo) => ({
  id: 1,
  codigo: 'LR-2026-000001',
  tipo: cuerpo.tipo,
  estado: 'recibido',
  creadoEn: '2026-11-24T15:00:00.000Z',
  fechaLimite: '2026-12-15',
  diasRestantes: 15,
  consumidor: {
    nombre: cuerpo.nombre,
    tipoDocumento: cuerpo.tipoDocumento,
    numeroDocumento: cuerpo.numeroDocumento,
    domicilio: cuerpo.domicilio,
    telefono: cuerpo.telefono,
    correo: cuerpo.correo,
    menorDeEdad: cuerpo.menorDeEdad,
    apoderadoNombre: cuerpo.apoderadoNombre ?? null,
  },
  bien: {
    tipo: cuerpo.bienContratado,
    pedidoCodigo: cuerpo.pedidoCodigo ?? null,
    montoReclamado: cuerpo.montoReclamado ?? null,
    descripcion: cuerpo.descripcion,
  },
  detalle: cuerpo.detalle,
  pedidoConsumidor: cuerpo.pedidoConsumidor,
  respuesta: null,
});

const campo = (nombre) => screen.getByLabelText(nombre);

async function llenarHoja(user) {
  await user.type(await screen.findByLabelText('Nombre completo'), 'María Quispe Huamán');
  await user.type(campo('Número de documento'), '45678912');
  await user.type(campo('Domicilio'), 'Av. El Sol 123, Cusco');
  await user.type(campo('Teléfono'), '+51 984 123 456');
  await user.type(campo('Correo electrónico'), 'Maria.Quispe@Example.com');
  await user.type(campo('Descripción del producto o servicio'), 'Café Geisha, 250 g');
  await user.type(campo('Código de pedido (opcional)'), 'kd-000123');
  await user.type(campo('Monto reclamado en soles (opcional)'), '65.50');
  await user.click(screen.getByRole('radio', { name: /Reclamo/ }));
  await user.type(campo('Detalle'), 'El paquete llegó abierto y con el café derramado.');
  await user.type(campo('Pedido del consumidor'), 'Que me envíen un paquete nuevo.');
}

describe('Libro de Reclamaciones', () => {
  it('muestra el proveedor, el aviso legal y las tres secciones de la hoja', async () => {
    stubApi();
    renderRuta('/libro-reclamaciones');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Libro de Reclamaciones' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Kuski Agroindustria S.A.').length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        'La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante INDECOPI.',
      ),
    ).toBeVisible();
    for (const seccion of [
      '1. Identificación del consumidor',
      '2. Identificación del bien contratado',
      '3. Detalle de la reclamación y pedido del consumidor',
    ]) {
      expect(screen.getByRole('group', { name: seccion })).toBeInTheDocument();
    }
  });

  it('muestra cada error en su campo y no envía la hoja', async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi();
    renderRuta('/libro-reclamaciones');

    await user.type(await screen.findByLabelText('Número de documento'), '1234567');
    await user.type(campo('Código de pedido (opcional)'), 'PED-1');
    await user.click(screen.getByRole('checkbox', { name: 'Soy menor de edad' }));
    await user.click(screen.getByRole('button', { name: 'Enviar hoja de reclamación' }));

    const errores = {
      'Nombre completo': 'Escribe tu nombre completo',
      'Número de documento': 'El DNI tiene 8 dígitos',
      'Correo electrónico': 'Ingresa un correo válido, por ejemplo nombre@correo.com',
      'Nombre del padre, madre o apoderado': 'Escribe el nombre de tu padre, madre o apoderado',
      'Código de pedido (opcional)': 'El código de pedido tiene el formato KD-000123',
      Detalle: 'Cuéntanos qué pasó (al menos 10 caracteres)',
    };
    for (const [etiqueta, mensaje] of Object.entries(errores)) {
      const control = campo(etiqueta);
      expect(control).toHaveAttribute('aria-invalid', 'true');
      expect(control).toHaveAccessibleDescription(mensaje);
    }
    // Reclamo o queja: el error va junto a las opciones
    expect(screen.getByRole('radio', { name: /Reclamo/ })).toHaveAccessibleDescription(
      'Elige si es un reclamo o una queja',
    );
    await waitFor(() => expect(campo('Nombre completo')).toHaveFocus());
    expect(llamadas(fetchMock, 'POST /reclamaciones')).toHaveLength(0);

    // Al corregir un campo, su error desaparece
    await user.type(campo('Nombre completo'), 'María Quispe');
    expect(campo('Nombre completo')).not.toHaveAttribute('aria-invalid');
  });

  it('envía la hoja y muestra la constancia con el código y el botón de imprimir', async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi({ 'POST /reclamaciones': (_url, cuerpo) => constancia(cuerpo) });
    const imprimir = vi.fn();
    vi.stubGlobal('print', imprimir);
    renderRuta('/libro-reclamaciones');

    await llenarHoja(user);
    await user.click(screen.getByRole('button', { name: 'Enviar hoja de reclamación' }));

    const titulo = await screen.findByRole('heading', {
      level: 2,
      name: 'Hoja de reclamación LR-2026-000001',
    });
    await waitFor(() => expect(titulo).toHaveFocus());
    expect(screen.getByText('Registramos tu reclamo')).toBeInTheDocument();
    expect(screen.getByText(/maria.quispe@example.com.*15 de diciembre de 2026/)).toBeVisible();

    expect(llamadas(fetchMock, 'POST /reclamaciones')[0].body).toEqual({
      tipo: 'reclamo',
      nombre: 'María Quispe Huamán',
      tipoDocumento: 'DNI',
      numeroDocumento: '45678912',
      domicilio: 'Av. El Sol 123, Cusco',
      telefono: '+51 984 123 456',
      correo: 'maria.quispe@example.com',
      menorDeEdad: false,
      bienContratado: 'producto',
      pedidoCodigo: 'KD-000123',
      montoReclamado: 65.5,
      descripcion: 'Café Geisha, 250 g',
      detalle: 'El paquete llegó abierto y con el café derramado.',
      pedidoConsumidor: 'Que me envíen un paquete nuevo.',
    });

    await user.click(screen.getByRole('button', { name: 'Imprimir constancia' }));
    expect(imprimir).toHaveBeenCalledOnce();
  });

  it('marca en su campo los errores que devuelve la API', async () => {
    const user = userEvent.setup();
    stubApi({
      'POST /reclamaciones': json(400, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'domicilio: Too small',
          details: [{ path: 'domicilio', message: 'El domicilio es demasiado corto' }],
        },
      }),
    });
    renderRuta('/libro-reclamaciones');

    await llenarHoja(user);
    await user.click(screen.getByRole('button', { name: 'Enviar hoja de reclamación' }));

    await waitFor(() =>
      expect(campo('Domicilio')).toHaveAccessibleDescription('El domicilio es demasiado corto'),
    );
  });
});

it('el pie de la tienda enlaza siempre al Libro de Reclamaciones', async () => {
  stubApi();
  renderRuta('/catalogo');

  const pie = await screen.findByRole('contentinfo');
  const enlace = within(pie).getByRole('link', { name: 'Libro de Reclamaciones' });
  expect(enlace).toHaveAttribute('href', '/libro-reclamaciones');
  expect(enlace.querySelector('svg')).not.toBeNull(); // ícono del libro
});
