/** Admin-app versie + changelog (zichtbaar rechtsonder in de zijbalk). */

export const ADMIN_APP_VERSION = "0.3.2";

export type ChangelogEntry = {
  version: string;
  date: string;
  current?: boolean;
  changes: string[];
};

export const ADMIN_CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.3.2",
    date: "18 oktober 2026",
    current: true,
    changes: [
      "Loyalty opent het nieuwe Leat-formulier. Een refresh haalt versie 0.3.2 op, zodat de oude link niet in de cache blijft staan."
    ]
  },
  {
    version: "0.3.1",
    date: "18 oktober 2026",
    changes: [
      "De opmaak van de admin laadde niet op een computer. Dat is hersteld, zodat menu, To do en de versiepagina weer normaal zichtbaar zijn.",
      "Toegang tot een medewerker is een lijst per onderdeel, gelijk aan het menu.",
      "Per medewerker kun je een profielfoto uploaden. Die foto staat op het kanbanbord."
    ]
  },
  {
    version: "0.3.0",
    date: "17 oktober 2026",
    changes: [
      "Het versienummer onder in de zijbalk opent deze pagina met alle wijzigingen.",
      "Franchise-pagina: inloggen naar de shop voor bestaande houders (hero + apart blok).",
      "Homepage gasten-foto is een eigen slot onder Pagina-foto’s (niet meer vast aan SEO-afbeelding).",
      "Privacy (/privacy) en voorwaarden (/terms) staan in de footer, ook voor Google OAuth.",
      "Database-seed overschrijft admin-content en pagina-foto’s niet meer bij elke deploy."
    ]
  },
  {
    version: "0.2.0",
    date: "6 oktober 2026",
    changes: [
      "Google-mail: inloggen toont de accountkiezer; geen forceren van een vooraf ingevuld adres.",
      "Redirect-URI voor Gmail OAuth wordt genormaliseerd naar https://tresamigos.nl/…/callback.",
      "In Koppelingen → E-mail staat de redirect-URI om te kopiëren naar Google Cloud."
    ]
  },
  {
    version: "0.1.0",
    date: "28 september 2026",
    changes: [
      "Franchise shop: catalogus met prijzen per vestiging, bestellingen, factuur- en pakbon-PDF.",
      "Catering: factuur- en pakbon-PDF; B2B-velden bedrijf, BTW en KvK.",
      "Productmodal op het menu: knop naar Vind je Tres Amigos (/locations), niet naar catering.",
      "Tellingen: PIN-login, ochtend/avond, concept en verzonden.",
      "Admin tabletmodus en website-instellingen (home-tekst, pagina-foto’s, koppelingen)."
    ]
  }
];

export function formatAdminVersionLabel(version = ADMIN_APP_VERSION) {
  return `v${version}`;
}
