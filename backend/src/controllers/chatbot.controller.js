import * as chatbotService from '../services/chatbot.service.js';

// Asistente virtual: la sesión es opcional (sin ella no se consulta ningún pedido).
export const mensaje = async (req, res) => {
  res.json({ data: await chatbotService.responder(req.validated.body, req.usuario) });
};
