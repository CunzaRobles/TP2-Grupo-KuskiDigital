import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { USUARIO, stubNavegador } from '@/test/tienda';
import { checkoutReducer, estadoInicial, NUEVA } from './estado';
import { PasoEnvio } from './paso-envio';

// Paso 1 aislado con el mismo reducer de la página: sin API ni router (María no tiene
// direcciones guardadas, así que el paso abre el formulario de dirección nueva).
let alContinuar;

function CheckoutPaso1() {
  const [estado, dispatch] = useReducer(checkoutReducer, USUARIO, estadoInicial);
  if (estado.paso !== 0) return <h2>Paso {estado.paso + 1}</h2>;
  return (
    <PasoEnvio
      direcciones={{ isPending: false, data: [] }}
      seleccion={NUEVA}
      envio={estado.envio}
      onCambiar={(cambios) => dispatch({ type: 'envio', cambios })}
      onContinuar={(datos) => {
        alContinuar(datos);
        dispatch({ type: 'ir', paso: 1 });
      }}
    />
  );
}

beforeAll(stubNavegador);

beforeEach(() => {
  vi.clearAllMocks();
  alContinuar = vi.fn();
});

describe('checkout · paso 1 (Envío)', () => {
  it('UT-24: con un campo obligatorio vacío no avanza al paso 2 y muestra el error', async () => {
    const user = userEvent.setup();
    render(<CheckoutPaso1 />);

    const destinatario = screen.getByLabelText('Nombre de quien recibe');
    await user.clear(destinatario);
    await user.click(screen.getByRole('button', { name: /Continuar al método de envío/ }));

    expect(await screen.findByText('Escribe el nombre de quien recibe')).toBeInTheDocument();
    expect(screen.getByText('Escribe la dirección completa (calle y número)')).toBeInTheDocument();
    expect(destinatario).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.getByRole('heading', { name: '¿A dónde enviamos tu pedido?' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Paso 2' })).not.toBeInTheDocument();
    expect(alContinuar).not.toHaveBeenCalled();
  });
});
