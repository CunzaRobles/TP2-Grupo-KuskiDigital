import { correo, EMPRESA, fichaEmpresa } from './comun';

export default {
  resumen:
    'How we process your personal data at Kuski Digital, under Peru’s Personal Data Protection Law (Law 29733) and its Regulations (Supreme Decree 016-2024-JUS). If you live in the European Union, the General Data Protection Regulation (GDPR) also applies.',
  secciones: [
    {
      id: 'responsable',
      titulo: 'Data controller',
      bloques: [
        `**${EMPRESA.razonSocial}**, based in Cusco, Peru, is the controller of the personal data collected in this store.`,
        {
          lista: fichaEmpresa({
            razonSocial: 'Company name',
            ruc: 'Tax ID (RUC)',
            domicilio: 'Registered address',
            ubicacion: { etiqueta: 'Based in', valor: 'Cusco, Peru' },
            privacidad: 'Privacy contact',
          }),
        },
      ],
    },
    {
      id: 'datos',
      titulo: 'Data we collect',
      bloques: [
        'We only store what your account and orders need:',
        {
          lista: [
            '**Account:** first name, last name, email, country, preferred language and currency, and your password hashed with bcrypt (never in plain text).',
            '**Phone number**, if you add one to your account or an address.',
            '**Shipping addresses:** recipient, country, city, address, postal code and phone number.',
            '**Orders:** products, amounts, currency and exchange rate, shipping method and status, and a copy of the delivery address.',
            '**Payments:** method, status and transaction number. If you pay by card, only the last 4 digits: never the full number or the security code.',
            '**Reviews** you publish: rating and comment.',
          ],
        },
        'We do not use analytics or advertising tools, and we do not build profiles.',
      ],
    },
    {
      id: 'finalidades',
      titulo: 'What we use them for',
      bloques: [
        {
          lista: [
            'Creating and managing your account.',
            'Processing your orders, payments and shipments, and showing you their tracking.',
            'Handling exchanges, returns, claims and questions.',
            'Sending you emails about your account and orders. We do not send advertising without your consent.',
            'Meeting legal, accounting and tax obligations.',
            'Protecting the store against fraud and unauthorized access.',
          ],
        },
      ],
    },
    {
      id: 'base-legal',
      titulo: 'Legal basis',
      bloques: [
        {
          lista: [
            '**Performance of a contract:** your account, orders, payments, shipping and after-sales service.',
            '**Consent:** given when you register and accept this Policy. You can withdraw it at any time, without retroactive effect.',
            '**Legal obligation:** keeping the receipts and records required by tax and consumer protection rules.',
            '**Legitimate interest:** store security and fraud prevention.',
          ],
        },
        'For customers in the European Union, these bases correspond to Article 6(1)(b), (a), (c) and (f) of the GDPR.',
      ],
    },
    {
      id: 'transferencias',
      titulo: 'Recipients and international transfers',
      bloques: [
        'The store’s database is hosted by **Supabase** and its API by **Vercel**, both on servers in **São Paulo, Brazil**. This is a cross-border transfer of personal data, which we make only to provide the service and with providers that offer contractual data protection safeguards.',
        'We share only what is essential: the carrier receives the delivery name, address and phone number, and the payment gateway receives the transaction details.',
        'While you browse, your browser downloads fonts from Google Fonts, photographs from Unsplash and, on maps, images from Stadia Maps. These providers receive your IP address in order to deliver them.',
        'We do not sell or hand over your data for commercial purposes.',
      ],
    },
    {
      id: 'conservacion',
      titulo: 'Retention period',
      bloques: [
        {
          lista: [
            '**Account data:** for as long as you keep your account. If you ask us to delete it, we erase or anonymize it, except for what the law requires us to keep.',
            '**Orders, payments and receipts:** for the periods required by tax and consumer protection rules.',
            '**Session:** the session cookie expires after 7 days or when you sign out.',
            '**Preferences in your browser:** until you delete them.',
          ],
        },
      ],
    },
    {
      id: 'seguridad',
      titulo: 'Security measures',
      bloques: [
        {
          lista: [
            'Passwords hashed with bcrypt.',
            'Encrypted connection (HTTPS) across the whole store.',
            'Session kept in an httpOnly cookie that the page’s code cannot read.',
            'Role-based access control: staff only see the information their job requires.',
            'No direct public access to the database: only the store’s API can query it.',
            'Rate limits on sign-in and registration attempts against brute-force attacks.',
          ],
        },
      ],
    },
    {
      id: 'derechos',
      titulo: 'Your rights (ARCO)',
      bloques: [
        'Under Peruvian law you can exercise at any time your rights of:',
        {
          lista: [
            '**Access:** knowing which of your data we process and how.',
            '**Rectification:** correcting inaccurate or incomplete data.',
            '**Cancellation:** asking us to delete your data when it is no longer needed.',
            '**Objection:** objecting to processing on legitimate grounds.',
          ],
        },
        `To exercise them, write to ${correo(EMPRESA.correoPrivacidad)} from your account email, stating the right you are exercising and attaching a copy of your ID (or your representative’s, with the corresponding power of attorney). We will reply within the periods set by the Regulations of Law 29733. You can correct your addresses directly in My account.`,
        'If you are not satisfied with our reply, you can file a complaint with Peru’s National Personal Data Protection Authority (Ministry of Justice and Human Rights).',
        { subtitulo: 'Customers in the European Union' },
        'The GDPR also gives you the rights to restriction of processing and to data portability, and to lodge a complaint with the data protection authority of your country.',
      ],
    },
    {
      id: 'cookies',
      titulo: 'Cookies and local storage',
      bloques: [
        'We use a single cookie, essential for the store to work, and keep your preferences in your browser’s local storage:',
        {
          tabla: {
            leyenda: 'Cookie and data the store keeps in your browser',
            columnas: ['Name', 'Type', 'Purpose', 'Duration'],
            filas: [
              [
                'kuski_token',
                'httpOnly cookie',
                'Keep you signed in',
                '7 days or until you sign out',
              ],
              ['kuski.idioma', 'Local storage', 'Remember your language', 'Until you delete it'],
              ['kuski.moneda', 'Local storage', 'Remember your currency', 'Until you delete it'],
              [
                'kuski.carrito',
                'Local storage',
                'Keep your cart if you shop without signing in',
                'Until you delete it',
              ],
            ],
          },
        },
        'Local storage stays in your browser. Only the cart contents are sent to the store, to price them and merge them with your account’s cart when you sign in.',
        'We do not use analytics, advertising or third-party cookies, which is why we do not ask for separate cookie consent.',
      ],
    },
    {
      id: 'cambios',
      titulo: 'Changes to this Policy',
      bloques: [
        'If we change this Policy, we will publish the new version on this page with its update date and, if the change is significant, let you know by email.',
      ],
    },
  ],
};
