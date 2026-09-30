import { Router } from 'express';
import * as checkoutController from '../controllers/checkout.controller.js';
import { optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { cotizarBody } from '../schemas/checkout.schema.js';

const router = Router();

// Público: un invitado cotiza enviando sus ítems; con sesión, puede usar su carrito.
router.post('/cotizar', optionalAuth, validate({ body: cotizarBody }), checkoutController.cotizar);

export default router;
