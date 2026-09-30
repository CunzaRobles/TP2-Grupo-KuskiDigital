import { Router } from 'express';
import * as pedidoController from '../controllers/pedido.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { codigoPedidoParams, crearPedidoBody } from '../schemas/checkout.schema.js';
import { paginacionQuery } from '../schemas/comun.schema.js';

const router = Router();

router.use(requireAuth);

router.post('/', validate({ body: crearPedidoBody }), pedidoController.crear);
router.get('/', validate({ query: paginacionQuery }), pedidoController.listar);
router.get('/:codigo', validate({ params: codigoPedidoParams }), pedidoController.detalle);

export default router;
