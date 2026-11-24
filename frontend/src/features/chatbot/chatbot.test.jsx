import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import i18n from '@/lib/i18n';
import { json, llamadas, renderRuta, stubApi, stubNavegador } from '@/test/tienda';

beforeAll(stubNavegador);

afterEach(() => {
  vi.unstubAllGlobals();
});

const RESPUESTA_PAGO = {
  intencion: 'medios_pago',
  texto: 'Aceptamos tarjeta, PayPal, y Yape o Plin (solo en soles).',
  sugerencias: ['¿Cuánto cuesta el envío?', 'Hablar con un asesor'],
  enlaces: [{ texto: 'Medios de pago en los Términos', url: '/terminos#pagos' }],
};

const abrirChat = async (user) => {
  await user.click(await screen.findByRole('button', { name: 'Abrir el asistente virtual' }));
  return screen.findByRole('dialog', { name: 'Asistente de Kuski' });
};

describe('Asistente virtual', () => {
  it('el botón flotante está en la tienda y mide al menos 44 × 44 px', async () => {
    stubApi();
    renderRuta('/catalogo');

    const boton = await screen.findByRole('button', { name: 'Abrir el asistente virtual' });
    expect(boton).toHaveClass('size-14'); // 56 px
    expect(boton).toHaveAttribute('aria-expanded', 'false');
  });

  it('se abre y se cierra con el teclado (Esc), y el foco queda atrapado en el panel', async () => {
    const user = userEvent.setup();
    stubApi();
    renderRuta('/catalogo');

    const boton = await screen.findByRole('button', { name: 'Abrir el asistente virtual' });
    boton.focus();
    await user.keyboard('{Enter}');

    const panel = await screen.findByRole('dialog', { name: 'Asistente de Kuski' });
    expect(within(panel).getByRole('textbox', { name: 'Tu consulta' })).toHaveFocus();
    expect(
      within(panel).getByRole('log', { name: 'Conversación con el asistente' }),
    ).toHaveAttribute('aria-live', 'polite');

    // Tab recorre solo los controles del panel
    for (let i = 0; i < 10; i += 1) {
      await user.tab();
      expect(panel).toContainElement(document.activeElement);
    }

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(boton).toHaveFocus();
  });

  it('envía el mensaje, muestra "escribiendo…" y luego la respuesta con sus enlaces', async () => {
    const user = userEvent.setup();
    let responder;
    const fetchMock = stubApi({
      'POST /chatbot/mensaje': () =>
        new Promise((resolve) => {
          responder = () => resolve(RESPUESTA_PAGO);
        }),
    });
    renderRuta('/catalogo');

    const panel = await abrirChat(user);
    await user.type(
      within(panel).getByRole('textbox', { name: 'Tu consulta' }),
      'Medios de pago{Enter}',
    );

    const log = within(panel).getByRole('log');
    expect(within(log).getByText('Medios de pago')).toBeInTheDocument();
    expect(await within(panel).findByText('Kuski está escribiendo…')).toBeInTheDocument();
    expect(log).toHaveAttribute('aria-busy', 'true');
    expect(llamadas(fetchMock, 'POST /chatbot/mensaje')[0].body).toEqual({
      mensaje: 'Medios de pago',
      idioma: 'es',
    });

    responder();
    expect(await within(log).findByText(RESPUESTA_PAGO.texto)).toBeInTheDocument();
    expect(within(panel).queryByText('Kuski está escribiendo…')).not.toBeInTheDocument();
    expect(
      within(log).getByRole('link', { name: 'Medios de pago en los Términos' }),
    ).toHaveAttribute('href', '/terminos#pagos');
    // Las sugerencias pasan a ser las de la respuesta
    const sugerencias = within(panel).getByRole('list', { name: 'Sugerencias rápidas' });
    expect(
      within(sugerencias)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(RESPUESTA_PAGO.sugerencias);
    expect(within(panel).getByRole('textbox', { name: 'Tu consulta' })).toHaveValue('');
  });

  it('una sugerencia rápida se envía como mensaje', async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi({
      'POST /chatbot/mensaje': {
        intencion: 'asesor_humano',
        texto: 'Te atiende una persona por correo en contacto@kuski.pe.',
        sugerencias: [],
        enlaces: [{ texto: 'Enviar un correo', url: 'mailto:contacto@kuski.pe' }],
      },
    });
    renderRuta('/catalogo');

    const panel = await abrirChat(user);
    await user.click(within(panel).getByRole('button', { name: 'Hablar con un asesor' }));

    expect(await within(panel).findByRole('link', { name: 'Enviar un correo' })).toHaveAttribute(
      'href',
      'mailto:contacto@kuski.pe',
    );
    expect(llamadas(fetchMock, 'POST /chatbot/mensaje')[0].body.mensaje).toBe(
      'Hablar con un asesor',
    );
  });

  it('responde en el idioma activo de la interfaz', async () => {
    await i18n.changeLanguage('de');
    const user = userEvent.setup();
    const fetchMock = stubApi({ 'POST /chatbot/mensaje': RESPUESTA_PAGO });
    renderRuta('/catalogo');

    await user.click(await screen.findByRole('button', { name: 'Virtuellen Assistenten öffnen' }));
    const panel = await screen.findByRole('dialog', { name: 'Kuski-Assistent' });
    await user.click(within(panel).getByRole('button', { name: 'Zahlungsarten' }));

    await waitFor(() =>
      expect(llamadas(fetchMock, 'POST /chatbot/mensaje')[0]?.body).toEqual({
        mensaje: 'Zahlungsarten',
        idioma: 'de',
      }),
    );
  });

  it('si la API falla, lo dice en el chat', async () => {
    const user = userEvent.setup();
    stubApi({
      'POST /chatbot/mensaje': json(429, { error: { code: 'RATE_LIMITED', message: 'x' } }),
    });
    renderRuta('/catalogo');

    const panel = await abrirChat(user);
    await user.type(within(panel).getByRole('textbox'), 'hola{Enter}');

    expect(
      await within(panel).findByText(
        'Enviaste muchos mensajes seguidos. Espera un minuto e inténtalo de nuevo.',
      ),
    ).toBeInTheDocument();
  });

  it('no aparece en el panel admin', async () => {
    stubApi({
      'GET /auth/me': {
        usuario: {
          id: 3,
          nombre: 'C',
          apellido: 'Q',
          correo: 'l@kuski.pe',
          rol: 'admin_logistica',
        },
      },
      'GET /admin/pedidos': {
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
    });
    renderRuta('/admin/pedidos');

    await screen.findByRole('heading', { level: 1, name: 'Pedidos' });
    expect(
      screen.queryByRole('button', { name: 'Abrir el asistente virtual' }),
    ).not.toBeInTheDocument();
  });
});
