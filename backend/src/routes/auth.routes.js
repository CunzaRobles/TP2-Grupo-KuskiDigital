import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import { loginBody, registroBody } from '../schemas/auth.schema.js';

const router = Router();

router.post('/registro', authLimiter, validate({ body: registroBody }), authController.registro);
router.post('/login', authLimiter, validate({ body: loginBody }), authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

export default router;
