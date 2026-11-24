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
    'Nutzungs- und Kaufbedingungen von Kuski Digital, dem Onlineshop der Kuski Agroindustria S.A., gemäß dem peruanischen Verbraucherschutzgesetzbuch (Gesetz 29571) und weiteren peruanischen Vorschriften.',
  secciones: [
    {
      id: 'identificacion',
      titulo: 'Angaben zum Anbieter',
      bloques: [
        `${EMPRESA.sitio} ist der Onlineshop der **${EMPRESA.razonSocial}**, eines Agrarindustrieunternehmens aus Cusco, Peru, das Produkte der Andenbiodiversität von namentlich bekannten Erzeugergemeinschaften verkauft.`,
        {
          lista: fichaEmpresa({
            razonSocial: 'Firma',
            ruc: 'Steuernummer (RUC)',
            domicilio: 'Geschäftsadresse',
            ubicacion: { etiqueta: 'Sitz', valor: 'Cusco, Peru' },
            atencion: 'Kundenservice',
            privacidad: 'Datenschutz',
          }),
        },
      ],
    },
    {
      id: 'objeto',
      titulo: 'Gegenstand und Annahme',
      bloques: [
        'Diese Bedingungen regeln die Nutzung des Shops und den Kauf seiner Produkte: Kaffee, Superfoods, Alpaka-Textilien und Kunsthandwerk.',
        'Mit der Erstellung eines Kontos oder einer Bestellung bestätigst du, dass du sie zusammen mit der [Datenschutzerklärung](/privacidad) gelesen und akzeptiert hast. Es gilt die auf dieser Seite veröffentlichte Fassung mit ihrem Aktualisierungsdatum; spätere Änderungen betreffen bereits bestätigte Bestellungen nicht.',
      ],
    },
    {
      id: 'cuenta',
      titulo: 'Registrierung und Konto',
      bloques: [
        'Zum Einkaufen brauchst du ein Konto mit wahrheitsgemäßen Angaben: Vorname, Nachname, E-Mail, Land und ein Passwort. Du musst volljährig sein oder die Erlaubnis eines Elternteils oder Vormunds haben.',
        `Du bist dafür verantwortlich, dein Passwort geheim zu halten. Wenn du vermutest, dass jemand anderes dein Konto nutzt, schreib uns sofort an ${correo(EMPRESA.correoAtencion)}.`,
        'Wir können ein Konto sperren, das betrügerisch oder entgegen diesen Bedingungen genutzt wird; den Grund teilen wir dir mit.',
      ],
    },
    {
      id: 'precios',
      titulo: 'Preise, Währungen und Steuern',
      bloques: [
        'Die Preise werden in Peruanischen Soles (PEN) festgelegt. Beim Stöbern sind Beträge in US-Dollar (USD) oder Euro (EUR) eine unverbindliche Umrechnung zum aktuellen Wechselkurs des Shops. Bei der Bestätigung der Bestellung wird der Wechselkurs festgehalten, und der Gesamtbetrag in der gewählten Währung wird belastet. Deine Bank oder dein Zahlungsanbieter kann eigene Gebühren oder Wechselkurse berechnen.',
        'Die **IGV (18 % peruanische Umsatzsteuer)** fällt nur bei Lieferungen innerhalb Perus an und wird in der Übersicht gesondert ausgewiesen. Auslandssendungen enthalten keine IGV; etwaige Einfuhrsteuern oder Zölle im Zielland trägt der Empfänger.',
        'Vor der Zahlung siehst du die vollständige Aufstellung: Zwischensumme, Versand, gegebenenfalls IGV und Gesamtbetrag. Es gibt keine versteckten Kosten.',
        'Preise und Verfügbarkeit können sich ändern; deine Bestellung behält den Preis zum Zeitpunkt der Bestätigung. Wird ein Preis mit einem offensichtlichen Fehler veröffentlicht, informieren wir dich, und du kannst die Bestellung zum richtigen Preis bestätigen oder sie mit voller Erstattung stornieren.',
      ],
    },
    {
      id: 'pagos',
      titulo: 'Zahlungsarten',
      bloques: [
        {
          lista: [
            '**Kredit- oder Debitkarte** (Visa und Mastercard).',
            '**PayPal.**',
            '**Yape und Plin**, in Peru verfügbare digitale Geldbörsen.',
          ],
        },
        'Die Zahlung wird über das Zahlungssystem der gewählten Zahlungsart abgewickelt. Kuski speichert weder deine vollständige Kartennummer noch den Sicherheitscode: nur die letzten 4 Ziffern und die Transaktionsnummer als Beleg.',
        'Die Bestellung ist bestätigt, sobald die Zahlung genehmigt ist. Wird sie abgelehnt, wird nichts belastet, und du kannst eine andere Zahlungsart wählen.',
      ],
    },
    {
      id: 'envios',
      titulo: 'Versand',
      bloques: [
        'Wir liefern in ganz Peru und ins Ausland, per **Standard**- oder **Expressversand**. Die Kosten hängen vom Zielland, vom Gewicht der Bestellung und von der Versandart ab und werden vor der Zahlung im Checkout berechnet.',
        {
          tabla: {
            leyenda: 'Voraussichtliche Lieferzeiten nach Zone, in Tagen ab Zahlungsbestätigung',
            columnas: ['Zielzone', 'Standard', 'Express'],
            filas: filasEnvio(
              {
                nacional: 'Peru',
                latam: 'Lateinamerika',
                norteamerica: 'Nordamerika',
                europa: 'Europa',
                resto_mundo: 'Übrige Welt',
              },
              (min, max) => `${min} bis ${max} Tage`,
            ),
          },
        },
      ],
    },
    {
      id: 'plazos',
      titulo: 'Lieferzeiten und Sendungsverfolgung',
      bloques: [
        'Die Lieferzeiten sind Schätzungen und werden auch im Checkout und in der Bestellbestätigung angezeigt. Jede Etappe (bestätigt, in Vorbereitung, unterwegs und zugestellt) kannst du unter Mein Konto verfolgen.',
        'Kommt die Bestellung aus Gründen, die Kuski zu vertreten hat, nicht innerhalb der angegebenen Frist an, kannst du ohne Mehrkosten auf die Lieferung warten oder die Bestellung mit voller Erstattung stornieren. Über Verzögerungen beim Zoll oder beim Versanddienst informieren wir dich, sobald wir davon erfahren.',
      ],
    },
    {
      id: 'devoluciones',
      titulo: 'Umtausch und Rückgabe',
      bloques: [
        `Du hast **${DIAS_DEVOLUCION} Kalendertage ab Lieferung**, um ein Produkt ohne Angabe von Gründen umzutauschen oder zurückzugeben, sofern es unbenutzt und in der Originalverpackung ist.`,
        'Aus Gründen des Gesundheitsschutzes und der Hygiene sind Lebensmittel, deren Verpackung geöffnet oder deren Versiegelung entfernt wurde, von der Rückgabe ausgeschlossen.',
        'Kommt das Produkt beschädigt, mangelhaft oder nicht wie beschrieben an, hast du nach Gesetz 29571 nach deiner Wahl Anspruch auf Ersatz, ein gleichwertiges Produkt oder die Erstattung des Kaufpreises. In diesem Fall trägt Kuski die Rücksendekosten.',
        `Schreib uns dazu an ${correo(EMPRESA.correoAtencion)} mit deiner Bestellnummer. Bei Rückgaben ohne Angabe von Gründen trägst du die Rücksendekosten. Wir erstatten den Betrag über die ursprüngliche Zahlungsart innerhalb von ${DIAS_DEVOLUCION} Tagen nach Eingang des Produkts.`,
      ],
    },
    {
      id: 'reclamaciones',
      titulo: 'Beschwerdebuch',
      bloques: [
        `Gemäß dem Verbraucherschutzgesetzbuch stellen wir ein [virtuelles Beschwerdebuch](${RUTA_LIBRO_RECLAMACIONES}) (Libro de Reclamaciones) bereit. Eine **Reklamation** (reclamo) betrifft deine Unzufriedenheit mit einem Produkt oder einer Leistung, eine **Beschwerde** (queja) deine Unzufriedenheit mit dem Service.`,
        'Wir antworten innerhalb der gesetzlichen Frist (15 Werktage). Eine Reklamation schließt andere Wege der Streitbeilegung oder den Gang zu INDECOPI, der peruanischen Verbraucherschutzbehörde, nicht aus.',
      ],
    },
    {
      id: 'propiedad-intelectual',
      titulo: 'Geistiges Eigentum',
      bloques: [
        'Die Marke Kuski, ihr Logo, die Texte, das Design des Shops und die übrigen eigenen Inhalte gehören der Kuski Agroindustria S.A. oder werden mit Genehmigung verwendet. Fotos Dritter werden gemäß ihren Lizenzen verwendet.',
        'Ohne schriftliche Genehmigung dürfen sie nicht zu gewerblichen Zwecken vervielfältigt, verbreitet oder verändert werden.',
      ],
    },
    {
      id: 'ley-aplicable',
      titulo: 'Anwendbares Recht und Gerichtsstand',
      bloques: [
        'Diese Bedingungen unterliegen dem Recht der Republik Peru. Gerichtsstand sind die Gerichte von Cusco; dein Recht, dich an INDECOPI zu wenden, bleibt unberührt.',
        'Wenn du in der Europäischen Union wohnst, behältst du zusätzlich den Schutz der zwingenden Verbraucherschutzvorschriften deines Wohnsitzlandes.',
      ],
    },
  ],
};
