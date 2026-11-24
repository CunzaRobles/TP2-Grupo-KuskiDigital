import {
  correo,
  DIAS_DEVOLUCION,
  EMPRESA,
  fichaEmpresa,
  filasEnvio,
  RUTA_LIBRO_RECLAMACIONES,
} from './comun';

export default {
  resumen:
    'Terms of use and purchase for Kuski Digital, the online store of Kuski Agroindustria S.A., under the Peruvian Consumer Protection and Defense Code (Law 29571) and other Peruvian regulations.',
  secciones: [
    {
      id: 'identificacion',
      titulo: 'Seller identification',
      bloques: [
        `${EMPRESA.sitio} is the online store of **${EMPRESA.razonSocial}**, an agro-industrial company from Cusco, Peru, that sells products of Andean biodiversity made by identified producer communities.`,
        {
          lista: fichaEmpresa({
            razonSocial: 'Company name',
            ruc: 'Tax ID (RUC)',
            domicilio: 'Registered address',
            ubicacion: { etiqueta: 'Based in', valor: 'Cusco, Peru' },
            atencion: 'Customer service',
            privacidad: 'Privacy and personal data',
          }),
        },
      ],
    },
    {
      id: 'objeto',
      titulo: 'Purpose and acceptance',
      bloques: [
        'These Terms govern the use of the store and the purchase of its products: coffee, superfoods, alpaca textiles and handicrafts.',
        'By creating an account or placing an order, you confirm that you have read and accepted them, together with the [Privacy Policy](/privacidad). The version published on this page, with its last-updated date, applies; later changes do not affect orders already confirmed.',
      ],
    },
    {
      id: 'cuenta',
      titulo: 'Registration and account',
      bloques: [
        'To buy, you need an account with accurate details: first name, last name, email, country and a password. You must be of legal age or have the permission of a parent or guardian.',
        `You are responsible for keeping your password confidential. If you suspect someone else is using your account, write to us immediately at ${correo(EMPRESA.correoAtencion)}.`,
        'We may suspend an account used fraudulently or against these Terms; we will tell you why.',
      ],
    },
    {
      id: 'precios',
      titulo: 'Prices, currencies and taxes',
      bloques: [
        'Prices are set in Peruvian soles (PEN). While you browse, amounts in US dollars (USD) or euros (EUR) are a reference conversion at the store’s current exchange rate. When you confirm the order, the exchange rate is recorded and the total in your chosen currency is the amount charged. Your bank or payment provider may apply its own fees or exchange rate.',
        '**IGV (18 % Peruvian sales tax)** applies only to orders shipped within Peru and is shown separately in the summary. International orders carry no IGV; any import taxes or duties in the destination country are paid by the recipient.',
        'Before paying you will see the full breakdown: subtotal, shipping, IGV where applicable, and total. There are no hidden charges.',
        'Prices and availability may change; your order keeps the price in force when you confirmed it. If a price is published with an obvious error, we will let you know and you can confirm the order at the correct price or cancel it with a full refund.',
      ],
    },
    {
      id: 'pagos',
      titulo: 'Payment methods',
      bloques: [
        {
          lista: [
            '**Credit or debit card** (Visa and Mastercard).',
            '**PayPal.**',
            '**Yape and Plin**, digital wallets available in Peru.',
          ],
        },
        'Payments are processed through the gateway of the chosen method. Kuski does not store your full card number or its security code: only the last 4 digits and the transaction number, as a receipt.',
        'The order is confirmed when the payment is approved. If it is declined, nothing is charged and you can try another method.',
      ],
    },
    {
      id: 'envios',
      titulo: 'Shipping',
      bloques: [
        'We ship throughout Peru and abroad with two methods, **standard** and **express**. The cost depends on the destination country, the order weight and the method, and is calculated at checkout before you pay.',
        {
          tabla: {
            leyenda: 'Estimated delivery times by zone, in days from payment confirmation',
            columnas: ['Destination zone', 'Standard', 'Express'],
            filas: filasEnvio(
              {
                nacional: 'Peru',
                latam: 'Latin America',
                norteamerica: 'North America',
                europa: 'Europe',
                resto_mundo: 'Rest of the world',
              },
              (min, max) => `${min} to ${max} days`,
            ),
          },
        },
      ],
    },
    {
      id: 'plazos',
      titulo: 'Delivery times and tracking',
      bloques: [
        'Delivery times are estimates and are also shown at checkout and in the order confirmation. You can follow each stage (confirmed, preparing, in transit and delivered) from My account.',
        'If the order does not arrive within the stated time for reasons attributable to Kuski, you can choose to wait for delivery at no extra cost or cancel the order with a full refund. We will let you know as soon as we learn of a customs or carrier delay.',
      ],
    },
    {
      id: 'devoluciones',
      titulo: 'Exchanges and returns',
      bloques: [
        `You have **${DIAS_DEVOLUCION} calendar days from delivery** to request an exchange or return without giving a reason, as long as the product is unused and in its original packaging.`,
        'For health and hygiene reasons, food products whose packaging has been opened or whose seal has been broken cannot be returned.',
        'If the product arrives damaged, defective or not as described, you are entitled to a replacement, an equivalent product or a refund, at your choice, under Law 29571. In that case Kuski covers the return shipping.',
        `To request it, write to ${correo(EMPRESA.correoAtencion)} with your order number. For returns without a reason, return shipping is at your expense. We refund to the original payment method within ${DIAS_DEVOLUCION} days of receiving the product.`,
      ],
    },
    {
      id: 'reclamaciones',
      titulo: 'Complaints Book',
      bloques: [
        `Under the Consumer Protection and Defense Code, we provide a [virtual Complaints Book](${RUTA_LIBRO_RECLAMACIONES}) (Libro de Reclamaciones). A **claim** (reclamo) expresses dissatisfaction with a product or service; a **complaint** (queja), dissatisfaction with the service you received.`,
        'We will reply within the period set by current regulations (15 business days). Filing a claim does not prevent you from using other dispute resolution channels or going to INDECOPI, the Peruvian consumer protection authority.',
      ],
    },
    {
      id: 'propiedad-intelectual',
      titulo: 'Intellectual property',
      bloques: [
        'The Kuski brand, its logo, the texts, the store design and other original content belong to Kuski Agroindustria S.A. or are used with permission. Third-party photographs are used under their licenses.',
        'You may not reproduce, distribute or modify them for commercial purposes without written permission.',
      ],
    },
    {
      id: 'ley-aplicable',
      titulo: 'Governing law and jurisdiction',
      bloques: [
        'These Terms are governed by the laws of the Republic of Peru. Disputes will be submitted to the courts of Cusco, without prejudice to your right to go to INDECOPI.',
        'If you live in the European Union, you also keep the protection granted by the mandatory consumer laws of your country of residence.',
      ],
    },
  ],
};
