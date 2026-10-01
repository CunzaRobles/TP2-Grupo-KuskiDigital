import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireRol } from '../../src/middleware/auth.js';
import { AppError } from '../../src/utils/app-error.js';

let req;
let res;
let next;

beforeEach(() => {
  vi.clearAllMocks();
  req = { usuario: { id: 10, rol: 'cliente' } };
  res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  next = vi.fn();
});

describe('middleware requireRol', () => {
  it('UT-20: requireRol("admin_gerente") con usuario cliente → 403 y no pasa al controlador', () => {
    requireRol('admin_gerente')(req, res, next);

    // Express: next(error) delega en el manejador de errores; next() sin argumentos no se llama.
    expect(next).toHaveBeenCalledOnce();
    const [error] = next.mock.calls[0];
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ status: 403, code: 'SIN_PERMISO' });
    expect(next).not.toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });
});
