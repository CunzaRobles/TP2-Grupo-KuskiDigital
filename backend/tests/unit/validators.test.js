import { describe, expect, it } from 'vitest';
import { registroBody } from '../../src/schemas/auth.schema.js';

describe('registroBody (Zod)', () => {
  it('UT-09: rechaza el correo incompleto "maria@"', () => {
    // Arrange: el resto de campos es válido, solo falla el correo
    const datos = {
      nombre: 'María',
      apellido: 'Quispe',
      correo: 'maria@',
      password: 'Cusco2026',
    };
    // Act
    const resultado = registroBody.safeParse(datos);
    // Assert
    expect(resultado.success).toBe(false);
    expect(resultado.error.issues.map((i) => i.path.join('.'))).toEqual(['correo']);
  });
});
