import { correo, EMPRESA, fichaEmpresa } from './comun';

export default {
  resumen:
    'Wie wir deine personenbezogenen Daten bei Kuski Digital verarbeiten, gemäß dem peruanischen Datenschutzgesetz (Gesetz 29733) und seiner Durchführungsverordnung (Oberster Erlass 016-2024-JUS). Wenn du in der Europäischen Union wohnst, gilt außerdem die Datenschutz-Grundverordnung (DSGVO).',
  secciones: [
    {
      id: 'responsable',
      titulo: 'Verantwortlicher',
      bloques: [
        `Verantwortlich für die in diesem Shop erhobenen personenbezogenen Daten ist die **${EMPRESA.razonSocial}** mit Sitz in Cusco, Peru.`,
        {
          lista: fichaEmpresa({
            razonSocial: 'Firma',
            ruc: 'Steuernummer (RUC)',
            domicilio: 'Geschäftsadresse',
            ubicacion: { etiqueta: 'Sitz', valor: 'Cusco, Peru' },
            privacidad: 'Kontakt Datenschutz',
          }),
        },
      ],
    },
    {
      id: 'datos',
      titulo: 'Welche Daten wir erheben',
      bloques: [
        'Wir speichern nur, was dein Konto und deine Bestellungen erfordern:',
        {
          lista: [
            '**Konto:** Vorname, Nachname, E-Mail, Land, bevorzugte Sprache und Währung sowie dein mit bcrypt verschlüsseltes Passwort (nie im Klartext).',
            '**Telefonnummer**, wenn du sie in deinem Konto oder bei einer Adresse angibst.',
            '**Lieferadressen:** Empfänger, Land, Stadt, Adresse, Postleitzahl und Telefonnummer.',
            '**Bestellungen:** Produkte, Beträge, Währung und Wechselkurs, Versandart und -status sowie eine Kopie der Lieferadresse.',
            '**Zahlungen:** Zahlungsart, Status und Transaktionsnummer. Bei Kartenzahlung nur die letzten 4 Ziffern: nie die vollständige Nummer oder den Sicherheitscode.',
            '**Bewertungen**, die du veröffentlichst: Sterne und Kommentar.',
          ],
        },
        'Wir nutzen keine Analyse- oder Werbewerkzeuge und erstellen keine Profile.',
      ],
    },
    {
      id: 'finalidades',
      titulo: 'Wofür wir sie verwenden',
      bloques: [
        {
          lista: [
            'Erstellung und Verwaltung deines Kontos.',
            'Abwicklung deiner Bestellungen, Zahlungen und Sendungen sowie deren Sendungsverfolgung.',
            'Bearbeitung von Umtausch, Rückgaben, Reklamationen und Anfragen.',
            'E-Mails zu deinem Konto und deinen Bestellungen. Werbung senden wir nur mit deiner Einwilligung.',
            'Erfüllung gesetzlicher, buchhalterischer und steuerlicher Pflichten.',
            'Schutz des Shops vor Betrug und unbefugtem Zugriff.',
          ],
        },
      ],
    },
    {
      id: 'base-legal',
      titulo: 'Rechtsgrundlage',
      bloques: [
        {
          lista: [
            '**Vertragserfüllung:** dein Konto, Bestellungen, Zahlungen, Versand und Kundendienst nach dem Kauf.',
            '**Einwilligung:** die du bei der Registrierung mit der Annahme dieser Erklärung erteilst. Du kannst sie jederzeit mit Wirkung für die Zukunft widerrufen.',
            '**Rechtliche Verpflichtung:** Aufbewahrung von Belegen und Aufzeichnungen nach Steuer- und Verbraucherschutzrecht.',
            '**Berechtigtes Interesse:** Sicherheit des Shops und Betrugsprävention.',
          ],
        },
        'Für Kundinnen und Kunden in der Europäischen Union entsprechen diese Grundlagen Art. 6 Abs. 1 lit. b, a, c und f DSGVO.',
      ],
    },
    {
      id: 'transferencias',
      titulo: 'Empfänger und internationale Übermittlung',
      bloques: [
        'Die Datenbank des Shops wird bei **Supabase** und seine API bei **Vercel** betrieben, beide auf Servern in **São Paulo, Brasilien**. Dies ist eine grenzüberschreitende Übermittlung personenbezogener Daten, die wir nur zur Erbringung des Dienstes und mit Anbietern vornehmen, die vertragliche Datenschutzgarantien bieten.',
        'Wir geben nur das Nötigste weiter: Der Versanddienst erhält Name, Adresse und Telefonnummer für die Zustellung, das Zahlungssystem die Daten der Transaktion.',
        'Beim Surfen lädt dein Browser Schriften von Google Fonts, Fotos von Unsplash und auf Karten Bilder von Stadia Maps. Diese Anbieter erhalten dafür deine IP-Adresse.',
        'Wir verkaufen deine Daten nicht und geben sie nicht zu kommerziellen Zwecken weiter.',
      ],
    },
    {
      id: 'conservacion',
      titulo: 'Speicherdauer',
      bloques: [
        {
          lista: [
            '**Kontodaten:** solange du dein Konto behältst. Verlangst du die Löschung, löschen oder anonymisieren wir sie, außer den Daten, die wir gesetzlich aufbewahren müssen.',
            '**Bestellungen, Zahlungen und Belege:** für die Fristen des Steuer- und Verbraucherschutzrechts.',
            '**Sitzung:** Das Sitzungscookie läuft nach 7 Tagen oder beim Abmelden ab.',
            '**Einstellungen in deinem Browser:** bis du sie löschst.',
          ],
        },
      ],
    },
    {
      id: 'seguridad',
      titulo: 'Sicherheitsmaßnahmen',
      bloques: [
        {
          lista: [
            'Mit bcrypt verschlüsselte Passwörter.',
            'Verschlüsselte Verbindung (HTTPS) im gesamten Shop.',
            'Sitzung in einem httpOnly-Cookie, das der Code der Seite nicht lesen kann.',
            'Rollenbasierte Zugriffskontrolle: Mitarbeitende sehen nur die Informationen, die sie für ihre Aufgabe brauchen.',
            'Kein direkter öffentlicher Zugriff auf die Datenbank: Nur die API des Shops kann sie abfragen.',
            'Begrenzte Anmelde- und Registrierungsversuche gegen Brute-Force-Angriffe.',
          ],
        },
      ],
    },
    {
      id: 'derechos',
      titulo: 'Deine Rechte (ARCO)',
      bloques: [
        'Nach peruanischem Recht kannst du jederzeit folgende Rechte ausüben:',
        {
          lista: [
            '**Auskunft:** erfahren, welche deiner Daten wir wie verarbeiten.',
            '**Berichtigung:** unrichtige oder unvollständige Daten korrigieren lassen.',
            '**Löschung:** verlangen, dass wir deine Daten löschen, wenn sie nicht mehr erforderlich sind.',
            '**Widerspruch:** einer Verarbeitung aus berechtigten Gründen widersprechen.',
          ],
        },
        `Schreib dazu von der E-Mail-Adresse deines Kontos an ${correo(EMPRESA.correoPrivacidad)}, nenne das Recht, das du ausübst, und füge eine Kopie deines Ausweises bei (oder der deiner Vertretung mit entsprechender Vollmacht). Wir antworten innerhalb der Fristen der Durchführungsverordnung zum Gesetz 29733. Deine Adressen kannst du direkt unter Mein Konto korrigieren.`,
        'Bist du mit unserer Antwort nicht einverstanden, kannst du dich bei der peruanischen Nationalen Datenschutzbehörde (Ministerium für Justiz und Menschenrechte) beschweren.',
        { subtitulo: 'Kundinnen und Kunden in der Europäischen Union' },
        'Die DSGVO gewährt dir außerdem das Recht auf Einschränkung der Verarbeitung und auf Datenübertragbarkeit sowie das Recht, dich bei der Datenschutzaufsichtsbehörde deines Landes zu beschweren.',
      ],
    },
    {
      id: 'cookies',
      titulo: 'Cookies und lokaler Speicher',
      bloques: [
        'Wir verwenden ein einziges, für den Betrieb des Shops unbedingt erforderliches Cookie und speichern deine Einstellungen im lokalen Speicher deines Browsers:',
        {
          tabla: {
            leyenda: 'Cookie und Daten, die der Shop in deinem Browser speichert',
            columnas: ['Name', 'Art', 'Zweck', 'Dauer'],
            filas: [
              [
                'kuski_token',
                'httpOnly-Cookie',
                'Dich angemeldet halten',
                '7 Tage oder bis zur Abmeldung',
              ],
              ['kuski.idioma', 'Lokaler Speicher', 'Deine Sprache merken', 'Bis du sie löschst'],
              ['kuski.moneda', 'Lokaler Speicher', 'Deine Währung merken', 'Bis du sie löschst'],
              [
                'kuski.carrito',
                'Lokaler Speicher',
                'Deinen Warenkorb speichern, wenn du ohne Anmeldung einkaufst',
                'Bis du sie löschst',
              ],
            ],
          },
        },
        'Der lokale Speicher bleibt in deinem Browser. Nur der Inhalt des Warenkorbs wird an den Shop gesendet, um die Preise zu berechnen und ihn bei der Anmeldung mit dem Warenkorb deines Kontos zusammenzuführen.',
        'Wir verwenden keine Analyse-, Werbe- oder Drittanbieter-Cookies; deshalb bitten wir nicht um eine gesonderte Cookie-Einwilligung.',
      ],
    },
    {
      id: 'cambios',
      titulo: 'Änderungen dieser Erklärung',
      bloques: [
        'Wenn wir diese Erklärung ändern, veröffentlichen wir die neue Fassung mit ihrem Aktualisierungsdatum auf dieser Seite und informieren dich bei wesentlichen Änderungen per E-Mail.',
      ],
    },
  ],
};
