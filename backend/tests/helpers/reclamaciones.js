// Hoja de reclamación válida (cuerpo de POST /reclamaciones) para las pruebas.
export const HOJA_VALIDA = {
  tipo: 'reclamo',
  nombre: 'María Quispe Huamán',
  tipoDocumento: 'DNI',
  numeroDocumento: '45678912',
  domicilio: 'Av. El Sol 123, Cusco',
  telefono: '+51 984 123 456',
  correo: 'maria.quispe@example.com',
  bienContratado: 'producto',
  pedidoCodigo: 'KD-000123',
  montoReclamado: 65,
  descripcion: 'Café Geisha de Quillabamba, 250 g',
  detalle: 'El paquete llegó abierto y con el café derramado.',
  pedidoConsumidor: 'Que me envíen un paquete nuevo.',
};

// Fila de la tabla reclamaciones tal como la devuelve el repositorio.
export const filaReclamacion = (cambios = {}) => ({
  id: 8,
  codigo: 'LR-2026-000008',
  estado: 'recibido',
  ...HOJA_VALIDA,
  menorDeEdad: false,
  apoderadoNombre: null,
  montoReclamado: '65.00',
  respuesta: null,
  respondidoPor: null,
  fechaRespuesta: null,
  fechaLimite: '2026-12-14',
  creadoEn: new Date('2026-11-23T15:00:00Z'),
  actualizadoEn: new Date('2026-11-23T15:00:00Z'),
  ...cambios,
});
