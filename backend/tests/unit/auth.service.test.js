import { beforeEach, describe, expect, it, vi } from 'vitest';

// bcryptjs simulado: la prueba no calcula hashes reales.
vi.mock('bcryptjs', () => ({ default: { compare: vi.fn(), hash: vi.fn() } }));

const { default: bcrypt } = await import('bcryptjs');
const usuarioRepository = await import('../../src/repositories/usuario.repository.js');
const { login } = await import('../../src/services/auth.service.js');

let usuario;

beforeEach(() => {
  vi.clearAllMocks();
  usuario = {
    id: 10,
    nombre: 'María',
    apellido: 'Quispe',
    correo: 'maria.quispe@example.com',
    rol: 'cliente',
    activo: true,
    passwordHash: '$2b$10$hashDePrueba',
  };
  usuarioRepository.findByCorreoConPassword.mockResolvedValue(usuario);
  bcrypt.compare.mockResolvedValue(false);
});

describe('AuthService.login', () => {
  it('UT-21: contraseña incorrecta → error CREDENCIALES_INVALIDAS', async () => {
    await expect(
      login({ correo: usuario.correo, password: 'incorrecta123' }),
    ).rejects.toMatchObject({ status: 401, code: 'CREDENCIALES_INVALIDAS' });
    expect(usuarioRepository.findByCorreoConPassword).toHaveBeenCalledWith(usuario.correo);
    expect(bcrypt.compare).toHaveBeenCalledWith('incorrecta123', usuario.passwordHash);
  });
});
