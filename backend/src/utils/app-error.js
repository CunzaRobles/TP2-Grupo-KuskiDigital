// Error de negocio con código HTTP y código legible por el frontend.
// El middleware de errores lo convierte en { error: { code, message, details? } }.
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}
