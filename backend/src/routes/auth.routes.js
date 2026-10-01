import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { optionalAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import { loginBody, registroBody } from '../schemas/auth.schema.js';

const router = Router();

router.post('/registro', authLimiter, validate({ body: registroBody }), authController.registro);
router.post('/login', authLimiter, validate({ body: loginBody }), authController.login);
router.post('/logout', authController.logout);
// Sin sesión responde usuario null (la tienda lo consulta en cada carga)
router.get('/me', optionalAuth, authController.me);

export default router;
