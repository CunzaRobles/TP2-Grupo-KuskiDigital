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
      aceptaTerminos: true,
    };
    // Act
    const resultado = registroBody.safeParse(datos);
    // Assert
    expect(resultado.success).toBe(false);
    expect(resultado.error.issues.map((i) => i.path.join('.'))).toEqual(['correo']);
  });

  it('exige aceptar los Términos y la Política de Privacidad, y no pasa la aceptación al servicio', () => {
    const datos = {
      nombre: 'Anna',
      apellido: 'Becker',
      correo: 'anna@example.com',
      password: 'Kastanie2026',
    };

    for (const aceptaTerminos of [undefined, false, 'true']) {
      const resultado = registroBody.safeParse({ ...datos, aceptaTerminos });
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues.map((i) => i.path.join('.'))).toEqual(['aceptaTerminos']);
    }

    const valido = registroBody.parse({ ...datos, aceptaTerminos: true });
    expect(valido).not.toHaveProperty('aceptaTerminos');
  });
});
