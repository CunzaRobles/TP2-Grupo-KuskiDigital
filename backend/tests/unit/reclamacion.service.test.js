import { describe, expect, it, vi } from 'vitest';
import { emailSender } from '../../src/adapters/email/index.js';
import { reclamacionBody } from '../../src/schemas/reclamacion.schema.js';
import { diasHabilesEntre, sumarDiasHabiles } from '../../src/utils/dias-habiles.js';
import {
  formatearCodigoReclamacion,
  siguienteCodigoReclamacion,
} from '../../src/utils/reclamaciones.js';
import { HOJA_VALIDA } from '../helpers/reclamaciones.js';

const reclamacionRepository = await import('../../src/repositories/reclamacion.repository.js');
const { withTransaction } = await import('../../src/repositories/transaction.repository.js');
const reclamacionService = await import('../../src/services/reclamacion.service.js');

// Lunes 23 de noviembre de 2026, 10:00 en Lima
const LUNES = new Date('2026-11-23T15:00:00Z');

describe('código correlativo', () => {
  it('tiene el formato LR-<año>-<6 dígitos>', () => {
    expect(formatearCodigoReclamacion(2026, 1)).toBe('LR-2026-000001');
    expect(formatearCodigoReclamacion(2026, 123456)).toBe('LR-2026-123456');
  });

  it('continúa la numeración del año y la reinicia con el año nuevo', () => {
    expect(siguienteCodigoReclamacion(2026, null)).toBe('LR-2026-000001');
    expect(siguienteCodigoReclamacion(2026, 'LR-2026-000041')).toBe('LR-2026-000042');
    expect(siguienteCodigoReclamacion(2026, 'LR-2026-000999')).toBe('LR-2026-001000');
    expect(siguienteCodigoReclamacion(2027, 'LR-2026-000041')).toBe('LR-2027-000001');
  });

  it('al registrar, toma el último código del año bajo bloqueo y dentro de la transacción', async () => {
    reclamacionRepository.findUltimoCodigo.mockResolvedValue('LR-2026-000007');
    reclamacionRepository.create.mockImplementation(async (datos) => ({
      id: 8,
      ...datos,
      menorDeEdad: false,
      creadoEn: LUNES,
    }));
    const enviar = vi.spyOn(emailSender, 'enviar');

    const hoja = await reclamacionService.registrar(HOJA_VALIDA, LUNES);

    expect(withTransaction).toHaveBeenCalledOnce();
    expect(reclamacionRepository.bloquearCorrelativo).toHaveBeenCalledWith({ tx: 'mock' });
    expect(reclamacionRepository.findUltimoCodigo).toHaveBeenCalledWith(2026, { tx: 'mock' });
    // El bloqueo va antes de leer el último código
    expect(reclamacionRepository.bloquearCorrelativo.mock.invocationCallOrder[0]).toBeLessThan(
      reclamacionRepository.findUltimoCodigo.mock.invocationCallOrder[0],
    );
    expect(reclamacionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo: 'LR-2026-000008',
        estado: 'recibido',
        fechaLimite: '2026-12-14',
      }),
      { tx: 'mock' },
    );
    expect(hoja).toMatchObject({ codigo: 'LR-2026-000008', diasRestantes: 15 });

    // Constancia al consumidor con el código y la copia de la hoja
    const [correo] = enviar.mock.calls[0];
    expect(correo.para).toBe('maria.quispe@example.com');
    expect(correo.asunto).toContain('LR-2026-000008');
    expect(correo.texto).toContain('El paquete llegó abierto');
    expect(correo.texto).toContain('Que me envíen un paquete nuevo.');
    expect(correo.texto).toContain('requisito previo para interponer una denuncia ante INDECOPI');
  });
});

describe('plazo de 15 días hábiles', () => {
  it('excluye sábados y domingos, y empieza a contar el día hábil siguiente', () => {
    expect(sumarDiasHabiles('2026-11-23', 15)).toBe('2026-12-14'); // lunes → lunes
    expect(sumarDiasHabiles('2026-11-27', 15)).toBe('2026-12-18'); // viernes → viernes
    expect(sumarDiasHabiles('2026-11-28', 15)).toBe('2026-12-18'); // sábado: cuenta desde el lunes
    expect(sumarDiasHabiles('2026-11-29', 15)).toBe('2026-12-18'); // domingo
    expect(sumarDiasHabiles('2026-12-31', 15)).toBe('2027-01-21'); // cruza de año
  });

  it('cuenta los días hábiles que faltan (negativo si venció)', () => {
    expect(diasHabilesEntre('2026-11-23', '2026-12-14')).toBe(15);
    expect(diasHabilesEntre('2026-12-11', '2026-12-14')).toBe(1); // viernes → lunes
    expect(diasHabilesEntre('2026-12-14', '2026-12-14')).toBe(0);
    expect(diasHabilesEntre('2026-12-15', '2026-12-14')).toBe(-1);
  });
});

describe('validación de la hoja (Zod)', () => {
  const errores = (datos) => {
    const resultado = reclamacionBody.safeParse(datos);
    return resultado.success ? [] : resultado.error.issues.map((i) => i.path.join('.'));
  };

  it('acepta una hoja completa y normaliza los campos opcionales vacíos', () => {
    expect(errores(HOJA_VALIDA)).toEqual([]);
    const datos = reclamacionBody.parse({
      ...HOJA_VALIDA,
      pedidoCodigo: '',
      montoReclamado: null,
      apoderadoNombre: 'No debería guardarse',
    });
    expect(datos.pedidoCodigo).toBeUndefined();
    expect(datos.montoReclamado).toBeUndefined();
    expect(datos.apoderadoNombre).toBeUndefined(); // solo con menor de edad
  });

  it('rechaza datos inválidos en su campo', () => {
    expect(errores({ ...HOJA_VALIDA, numeroDocumento: '1234567' })).toEqual(['numeroDocumento']);
    expect(
      errores({ ...HOJA_VALIDA, tipoDocumento: 'PASAPORTE', numeroDocumento: 'AB12' }),
    ).toEqual(['numeroDocumento']);
    expect(errores({ ...HOJA_VALIDA, correo: 'maria@' })).toEqual(['correo']);
    expect(errores({ ...HOJA_VALIDA, pedidoCodigo: 'PED-1' })).toEqual(['pedidoCodigo']);
    expect(errores({ ...HOJA_VALIDA, montoReclamado: 0 })).toEqual(['montoReclamado']);
    expect(errores({ ...HOJA_VALIDA, montoReclamado: 10.555 })).toEqual(['montoReclamado']);
    expect(errores({ ...HOJA_VALIDA, tipo: 'sugerencia' })).toEqual(['tipo']);
    expect(errores({ ...HOJA_VALIDA, detalle: 'Corto' })).toEqual(['detalle']);
    expect(errores({ ...HOJA_VALIDA, menorDeEdad: true })).toEqual(['apoderadoNombre']);
    expect(errores({})).toEqual(
      expect.arrayContaining(['tipo', 'nombre', 'correo', 'detalle', 'pedidoConsumidor']),
    );
  });
});

describe('respuesta del proveedor', () => {
  const hojaDb = (estado) => ({
    id: 8,
    codigo: 'LR-2026-000008',
    estado,
    tipo: 'queja',
    nombre: 'María',
    correo: 'maria.quispe@example.com',
    fechaLimite: '2026-12-14',
  });

  it('una hoja respondida ya no cambia', async () => {
    reclamacionRepository.findById.mockResolvedValue(hojaDb('respondido'));
    await expect(
      reclamacionService.responder(8, { estado: 'en_atencion' }, 1, LUNES),
    ).rejects.toMatchObject({ status: 409, code: 'RECLAMACION_TRANSICION_INVALIDA' });
    expect(reclamacionRepository.update).not.toHaveBeenCalled();
  });

  it('al responder guarda quién y cuándo, y avisa al consumidor', async () => {
    reclamacionRepository.findById
      .mockResolvedValueOnce(hojaDb('en_atencion'))
      .mockResolvedValueOnce({
        ...hojaDb('respondido'),
        respuesta: 'Te enviamos un paquete nuevo.',
      });
    const enviar = vi.spyOn(emailSender, 'enviar');

    const hoja = await reclamacionService.responder(
      8,
      { estado: 'respondido', respuesta: 'Te enviamos un paquete nuevo.' },
      2,
      LUNES,
    );

    expect(reclamacionRepository.update).toHaveBeenCalledWith(8, {
      estado: 'respondido',
      respuesta: 'Te enviamos un paquete nuevo.',
      respondidoPor: 2,
      fechaRespuesta: LUNES,
    });
    expect(enviar.mock.calls[0][0]).toMatchObject({ para: 'maria.quispe@example.com' });
    expect(hoja.diasRestantes).toBeNull();
  });
});
