/**
 * Contrato del envío de correos: enviar({ para, asunto, texto }) → Promise<void>.
 * Un proveedor real (Resend, SES, SMTP) implementaría la misma interfaz.
 */
export class EmailSender {
  async enviar(_correo) {
    throw new Error('EmailSender.enviar no está implementado');
  }
}
