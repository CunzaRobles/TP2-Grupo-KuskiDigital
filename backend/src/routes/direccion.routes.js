import { Router } from 'express';
import * as direccionController from '../controllers/direccion.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../schemas/comun.schema.js';
import { actualizarDireccionBody, crearDireccionBody } from '../schemas/direccion.schema.js';

// Libreta de direcciones del usuario autenticado.
const router = Router();

router.use(requireAuth);

router.get('/', direccionController.listar);
router.post('/', validate({ body: crearDireccionBody }), direccionController.crear);
router.patch(
  '/:id',
  validate({ params: idParams, body: actualizarDireccionBody }),
  direccionController.actualizar,
);
router.delete('/:id', validate({ params: idParams }), direccionController.eliminar);

export default router;
