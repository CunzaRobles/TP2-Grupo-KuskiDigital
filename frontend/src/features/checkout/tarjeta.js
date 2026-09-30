// Utilidades del formulario de tarjeta (pago simulado, pero con el comportamiento de uno real).

export const soloDigitos = (texto = '') => String(texto).replace(/\D/g, '');

// Marca según los primeros dígitos (rangos IIN públicos).
export function detectarMarca(numero) {
  const d = soloDigitos(numero);
  if (/^4/.test(d)) return 'visa';
  if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(d)) return 'mastercard';
  if (/^3[47]/.test(d)) return 'amex';
  return null;
}

const LARGO_MAXIMO = { amex: 15, visa: 19, mastercard: 16 };
export const largoMaximo = (marca) => LARGO_MAXIMO[marca] ?? 19;
export const largoCvv = (marca) => (marca === 'amex' ? 4 : 3);

/** "4111111111111111" → "4111 1111 1111 1111" (American Express: 4-6-5). */
export function formatearNumero(numero) {
  const marca = detectarMarca(numero);
  const d = soloDigitos(numero).slice(0, largoMaximo(marca));
  if (marca === 'amex') {
    return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(' ');
  }
  return d.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** Solo los 4 últimos dígitos visibles: "•••• •••• •••• 1111". */
export function enmascarar(numero) {
  const d = soloDigitos(numero);
  if (d.length < 4) return '•••• •••• •••• ••••';
  return `•••• •••• •••• ${d.slice(-4)}`;
}

// Algoritmo de Luhn: detecta errores de tipeo en el número.
export function luhnValido(numero) {
  const d = soloDigitos(numero);
  if (d.length < 13) return false;
  let suma = 0;
  for (let i = 0; i < d.length; i += 1) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    suma += n;
  }
  return suma % 10 === 0;
}

/** Vencimiento mientras se escribe: "12" → "12/", "1230" → "12/30". */
export function formatearVencimiento(texto, anterior = '') {
  const d = soloDigitos(texto).slice(0, 4);
  // Al borrar la barra no se vuelve a insertar
  if (texto.length < anterior.length && d.length === 2) return d;
  if (d.length === 1 && Number(d) > 1) return `0${d}/`;
  if (d.length >= 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return d;
}

// MM/AA válido hasta el último día del mes indicado (misma regla que el backend).
export function vencimientoValido(texto, hoy = new Date()) {
  const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(texto);
  if (!m) return false;
  const fin = new Date(Date.UTC(2000 + Number(m[2]), Number(m[1]), 1));
  return fin > hoy;
}
