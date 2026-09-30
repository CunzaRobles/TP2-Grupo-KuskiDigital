import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CurrencyProvider } from '@/lib/currency-provider';
import { Button } from './button';
import { Field } from './field';
import { Input } from './input';
import { Price } from './price';
import { QuantitySelector } from './quantity-selector';
import { Stepper } from './stepper';

const plano = (texto) => texto.replace(/\s/g, ' ');

describe('Price', () => {
  it('usa la moneda activa del contexto', () => {
    render(
      <CurrencyProvider initialMoneda="USD">
        <Price amount={12.8} />
      </CurrencyProvider>,
    );
    const precio = screen.getByText((_, el) => el?.dataset.slot === 'price');
    expect(precio).toHaveAttribute('data-currency', 'USD');
    expect(plano(precio.textContent)).toBe('$ 12.80'); // formato es-PE
  });

  it('muestra el precio anterior tachado solo si es mayor', () => {
    const { container, rerender } = render(<Price amount={40} currency="PEN" compareAt={48} />);
    expect(container.querySelector('s')).toHaveTextContent('48.00');
    rerender(<Price amount={40} currency="PEN" compareAt={30} />);
    expect(container.querySelector('s')).toBeNull();
  });
});

describe('QuantitySelector', () => {
  it('suma, resta y respeta los límites', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<QuantitySelector value={1} onChange={onChange} max={3} />);

    expect(screen.getByRole('button', { name: 'Disminuir cantidad' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Aumentar cantidad' }));
    expect(onChange).toHaveBeenLastCalledWith(2);

    rerender(<QuantitySelector value={3} onChange={onChange} max={3} />);
    expect(screen.getByRole('button', { name: 'Aumentar cantidad' })).toBeDisabled();
  });

  it('limita al máximo lo escrito a mano', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<QuantitySelector value={1} onChange={onChange} max={5} />);

    const campo = screen.getByRole('textbox', { name: 'Cantidad' });
    await user.clear(campo);
    await user.type(campo, '40{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(5);
  });
});

describe('Stepper', () => {
  const pasos = [
    { id: 'envio', label: 'Envío' },
    { id: 'metodo', label: 'Método de envío' },
    { id: 'pago', label: 'Pago' },
    { id: 'confirmar', label: 'Confirmar' },
  ];

  it('marca el paso actual y permite volver solo a pasos completados', async () => {
    const onStepClick = vi.fn();
    const user = userEvent.setup();
    render(<Stepper steps={pasos} current={2} onStepClick={onStepClick} />);

    expect(screen.getByText('Paso 3 de 4')).toBeInTheDocument();
    const botones = screen.getAllByRole('button');
    expect(botones).toHaveLength(2);

    await user.click(botones[0]);
    expect(onStepClick).toHaveBeenCalledWith(0);
    expect(document.querySelector('[aria-current="step"]')).toHaveTextContent('Pago');
  });
});

describe('Button y Field', () => {
  it('bloquea el botón mientras carga', () => {
    render(<Button loading>Pagar</Button>);
    const boton = screen.getByRole('button', { name: 'Pagar' });
    expect(boton).toBeDisabled();
    expect(boton).toHaveAttribute('aria-busy', 'true');
  });

  it('conecta etiqueta y error con el control', () => {
    render(
      <Field label="Correo" error="Correo inválido">
        <Input />
      </Field>,
    );
    const campo = screen.getByLabelText('Correo');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription('Correo inválido');
  });
});
