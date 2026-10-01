import multer from 'multer';
import { AppError } from '../utils/app-error.js';

// 4 MB: Vercel corta las peticiones de más de 4,5 MB antes de llegar a la función.
export const TAMANO_MAX_IMAGEN = 4 * 1024 * 1024;
export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];

// La imagen queda en memoria (req.file.buffer) y el servicio la sube al storage:
// nunca se escribe en el disco del servidor.
const subida = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAX_IMAGEN, files: 1, fields: 5 },
  fileFilter: (_req, file, cb) => {
    if (TIPOS_IMAGEN.includes(file.mimetype)) return cb(null, true);
    cb(new AppError(415, 'TIPO_ARCHIVO_INVALIDO', 'Solo se aceptan imágenes JPG, PNG o WebP'));
  },
});

const ERRORES_MULTER = {
  LIMIT_FILE_SIZE: [413, 'ARCHIVO_DEMASIADO_GRANDE', 'La imagen supera el máximo de 4 MB'],
  LIMIT_FILE_COUNT: [400, 'DEMASIADOS_ARCHIVOS', 'Sube una imagen por petición'],
  LIMIT_UNEXPECTED_FILE: [400, 'CAMPO_ARCHIVO_INVALIDO', 'La imagen debe ir en el campo "imagen"'],
};

// Un archivo en el campo `campo` (multipart/form-data). Traduce los errores de multer
// al formato de la API.
export const subirImagen =
  (campo = 'imagen') =>
  (req, res, next) =>
    subida.single(campo)(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        const [status, code, message] = ERRORES_MULTER[err.code] ?? [
          400,
          'SUBIDA_INVALIDA',
          err.message,
        ];
        return next(new AppError(status, code, message));
      }
      next(err);
    });
