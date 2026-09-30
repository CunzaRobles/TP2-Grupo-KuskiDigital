import { EmailSender } from './email-sender.js';

// Correo simulado: se imprime en la consola del servidor.
export class ConsoleEmailSender extends EmailSender {
  constructor({ logger = console } = {}) {
    super();
    this.logger = logger;
  }

  async enviar({ para, asunto, texto }) {
    this.logger.info(
      [
        '──────── Correo simulado ────────',
        `Para:   ${para}`,
        `Asunto: ${asunto}`,
        '',
        texto,
        '────────────────────────────────',
      ].join('\n'),
    );
  }
}
