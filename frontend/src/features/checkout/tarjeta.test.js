import { describe, expect, it } from 'vitest';
import { validar } from '@/lib/formulario';
import { celularSchema, direccionSchema, tarjetaSchema } from './schemas';
import {
  detectarMarca,
  enmascarar,
  formatearNumero,
  formatearVencimiento,
  luhnValido,
  vencimientoValido,
} from './tarjeta';

describe('tarjeta', () => {
  it('detecta Visa, Mastercard (incluida la serie 2) y American Express', () => {
    expect(detectarMarca('4111 1111')).toBe('visa');
    expect(detectarMarca('5500')).toBe('mastercard');
    expect(detectarMarca('2221 00')).toBe('mastercard');
    expect(detectarMarca('3782')).toBe('amex');
    expect(detectarMarca('6011')).toBeNull();
  });

  it('formatea el número en grupos y lo enmascara', () => {
    expect(formatearNumero('4111111111111111999')).toBe('4111 1111 1111 1111 999');
    expect(formatearNumero('5500-0000-0000-00049')).toBe('5500 0000 0000 0004'); // 16 máx.
    expect(formatearNumero('378282246310005')).toBe('3782 822463 10005');
    expect(enmascarar('4000 0000 0000 0002')).toBe('•••• •••• •••• 0002');
  });

  it('valida con Luhn (las tarjetas de prueba de la demo son válidas)', () => {
    expect(luhnValido('4111 1111 1111 1111')).toBe(true);
    expect(luhnValido('4000 0000 0000 0002')).toBe(true);
    expect(luhnValido('4111 1111 1111 1112')).toBe(false);
  });

  it('formatea y valida el vencimiento', () => {
    expect(formatearVencimiento('1')).toBe('1');
    expect(formatearVencimiento('4')).toBe('04/');
    expect(formatearVencimiento('1230')).toBe('12/30');
    expect(formatearVencimiento('12', '12/')).toBe('12'); // borrando la barra
    const hoy = new Date('2026-09-30T12:00:00Z');
    expect(vencimientoValido('09/26', hoy)).toBe(true);
    expect(vencimientoValido('08/26', hoy)).toBe(false);
    expect(vencimientoValido('13/30', hoy)).toBe(false);
  });
});

describe('esquemas del checkout', () => {
  it('valida la tarjeta completa y el CVV según la marca', () => {
    const base = { numero: '4111 1111 1111 1111', titular: 'Anna Becker', vencimiento: '12/30' };
    expect(validar(tarjetaSchema, { ...base, cvv: '123' }).datos.numero).toBe('4111111111111111');
    expect(validar(tarjetaSchema, { ...base, cvv: '1234' }).errores).toEqual({
      cvv: 'validacion.cvv',
    });
    expect(
      validar(tarjetaSchema, { ...base, numero: '4111 1111 1111 1112', cvv: '123' }).errores,
    ).toEqual({ numero: 'validacion.tarjetaNumero' });
  });

  it('normaliza el celular peruano y la dirección opcional', () => {
    expect(validar(celularSchema, { telefono: '+51 987 654 321' }).datos.telefono).toBe(
      '987654321',
    );
    expect(validar(celularSchema, { telefono: '812345678' }).errores.telefono).toBe(
      'validacion.celular',
    );
    const { datos } = validar(direccionSchema, {
      nombreDestinatario: 'María Quispe',
      paisCodigo: 'PE',
      ciudad: 'Cusco',
      direccion: 'Av. de la Cultura 1520',
      codigoPostal: '  ',
      telefono: '',
    });
    expect(datos.codigoPostal).toBeUndefined();
    expect(datos.telefono).toBeUndefined();
  });
});
