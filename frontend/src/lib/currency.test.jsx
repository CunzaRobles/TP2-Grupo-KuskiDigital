import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CLAVE_MONEDA, useCurrency } from './currency';
import { CurrencyProvider } from './currency-provider';

function Sonda() {
  const { moneda, setMoneda } = useCurrency();
  return (
    <>
      <output>{moneda}</output>
      <button onClick={() => setMoneda('EUR')}>EUR</button>
      <button onClick={() => setMoneda('JPY')}>JPY</button>
    </>
  );
}

describe('CurrencyProvider', () => {
  it('usa PEN por defecto', () => {
    render(
      <CurrencyProvider>
        <Sonda />
      </CurrencyProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('PEN');
  });

  it('recupera la moneda guardada en localStorage', () => {
    window.localStorage.setItem(CLAVE_MONEDA, 'USD');
    render(
      <CurrencyProvider>
        <Sonda />
      </CurrencyProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('USD');
  });

  it('persiste el cambio e ignora monedas no soportadas', () => {
    render(
      <CurrencyProvider>
        <Sonda />
      </CurrencyProvider>,
    );
    act(() => screen.getByText('EUR').click());
    expect(screen.getByRole('status')).toHaveTextContent('EUR');
    expect(window.localStorage.getItem(CLAVE_MONEDA)).toBe('EUR');

    act(() => screen.getByText('JPY').click());
    expect(screen.getByRole('status')).toHaveTextContent('EUR');
  });
});
