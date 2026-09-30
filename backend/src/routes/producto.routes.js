import { Router } from 'express';
import * as productoController from '../controllers/producto.controller.js';
import { validate } from '../middleware/validate.js';
import { monedaQuery } from '../schemas/comun.schema.js';
import {
  destacadosQuery,
  listarProductosQuery,
  relacionadosQuery,
  slugParams,
} from '../schemas/producto.schema.js';

const router = Router();

router.get('/', validate({ query: listarProductosQuery }), productoController.listar);
// Antes de /:slug para que "destacados" no se interprete como slug.
router.get('/destacados', validate({ query: destacadosQuery }), productoController.destacados);
router.get(
  '/:slug',
  validate({ params: slugParams, query: monedaQuery }),
  productoController.detalle,
);
router.get(
  '/:slug/relacionados',
  validate({ params: slugParams, query: relacionadosQuery }),
  productoController.relacionados,
);

export default router;
