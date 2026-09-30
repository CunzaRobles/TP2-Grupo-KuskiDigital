import { Router } from 'express';
import * as carritoController from '../controllers/carrito.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  actualizarItemBody,
  agregarItemBody,
  fusionarBody,
  invitadoBody,
} from '../schemas/carrito.schema.js';
import { idParams, monedaQuery } from '../schemas/comun.schema.js';

// ?moneda= define la moneda de los precios de la respuesta.
const router = Router();

// Público: precios del carrito de invitado (no se guarda nada).
router.post(
  '/invitado',
  validate({ query: monedaQuery, body: invitadoBody }),
  carritoController.preciosInvitado,
);

// El resto es el carrito del usuario autenticado.
router.use(requireAuth);

router.get('/', validate({ query: monedaQuery }), carritoController.obtener);
router.post(
  '/items',
  validate({ query: monedaQuery, body: agregarItemBody }),
  carritoController.agregarItem,
);
router.patch(
  '/items/:id',
  validate({ params: idParams, query: monedaQuery, body: actualizarItemBody }),
  carritoController.actualizarItem,
);
router.delete(
  '/items/:id',
  validate({ params: idParams, query: monedaQuery }),
  carritoController.eliminarItem,
);
router.post(
  '/fusionar',
  validate({ query: monedaQuery, body: fusionarBody }),
  carritoController.fusionar,
);

export default router;
