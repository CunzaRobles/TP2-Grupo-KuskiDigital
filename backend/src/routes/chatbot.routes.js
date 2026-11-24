import { Router } from 'express';
import * as chatbot from '../controllers/chatbot.controller.js';
import { optionalAuth } from '../middleware/auth.js';
import { chatbotLimiter } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import { mensajeChatbotBody } from '../schemas/chatbot.schema.js';

// Asistente virtual (/api/v1/chatbot): público, con sesión opcional y límite propio.
const router = Router();

router.post(
  '/mensaje',
  chatbotLimiter,
  optionalAuth,
  validate({ body: mensajeChatbotBody }),
  chatbot.mensaje,
);

export default router;
