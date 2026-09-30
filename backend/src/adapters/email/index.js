import { env } from '../../config/env.js';
import { ConsoleEmailSender } from './console-email-sender.js';

// En pruebas se silencia el log para no ensuciar la salida de Vitest.
const silencioso = { info: () => {} };

export const emailSender = new ConsoleEmailSender({
  logger: env.NODE_ENV === 'test' ? silencioso : console,
});
