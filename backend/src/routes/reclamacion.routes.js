import { Router } from 'express';
import * as reclamacion from '../controllers/reclamacion.controller.js';
import { reclamacionLimiter } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import { reclamacionBody } from '../schemas/reclamacion.schema.js';

// Libro de Reclamaciones virtual (/api/v1/reclamaciones): público, sin sesión.
// La gestión (listar y responder) vive en admin.routes.js.
const router = Router();

router.post('/', reclamacionLimiter, validate({ body: reclamacionBody }), reclamacion.registrar);

export default router;
