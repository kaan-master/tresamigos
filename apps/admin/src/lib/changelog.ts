/** Admin-app versie + changelog (zichtbaar rechtsonder in de zijbalk). */

/** Gelijk houden aan `apps/admin/package.json` → version. */
export const ADMIN_APP_VERSION = "0.3.26";

export type ChangelogEntry = {
  version: string;
  date: string;
  current?: boolean;
  changes: string[];
};

export const ADMIN_CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.3.26",
    date: "24 november 2026",
    current: true,
    changes: [
      "Mollie: met alleen een test-sleutel kun je testmodus aanzetten; live blijft geblokkeerd zonder live_… sleutel."
    ]
  },
  {
    version: "0.3.25",
    date: "24 november 2026",
    changes: [
      "Franchise-bestelling: factuur- en pakbon-PDF als bijlage in de bevestigingsmail (klant + franchise-mailbox).",
      "Franchise-tab: badge met aantal bestellingen die op actie wachten (in afwachting / onvolledig)."
    ]
  },
  {
    version: "0.3.24",
    date: "24 november 2026",
    changes: [
      "Franchise-geschiedenis: status met kleur/label; klik opent de werkwijze met die stap gemarkeerd."
    ]
  },
  {
    version: "0.3.23",
    date: "24 november 2026",
    changes: [
      "Alle uitgaande mails in Tres Amigos-huisstijl met logo (HTML), inclusief franchise-/statusmails en testmails."
    ]
  },
  {
    version: "0.3.22",
    date: "24 november 2026",
    changes: [
      "Franchise-werkwijze: klik op een andere status in het hoofdproces → popup met verplichte reden (bijv. menselijke fout)."
    ]
  },
  {
    version: "0.3.21",
    date: "24 november 2026",
    changes: [
      "Franchise-shop: bestellen op factuur/iDEAL stabieler (duidelijke fouten i.p.v. Internal Server Error).",
      "Shop-layout: volle breedte, grotere productfoto’s, horizontale aantallen, bevestiging bij factuur."
    ]
  },
  {
    version: "0.3.20",
    date: "24 november 2026",
    changes: [
      "Handmatige franchise-registratie: WhatsApp-nummer verplicht zonder account, account optioneel, euro-prijsveld per productregel."
    ]
  },
  {
    version: "0.3.19",
    date: "24 november 2026",
    changes: [
      "Franchise-werkwijze: ‘Voorraad/prognose’ hernoemd naar duidelijke checklist ‘Tellingen bijgewerkt’ (geen automatische voorraad)."
    ]
  },
  {
    version: "0.3.18",
    date: "24 november 2026",
    changes: [
      "Franchise-tab: highlight ‘Nieuw’ bij eerste login, ‘Update’ bij nieuwe features; tooltip bij hover, verdwijnt na openen."
    ]
  },
  {
    version: "0.3.17",
    date: "24 november 2026",
    changes: [
      "Franchise-werkwijze: statusmails naar de vestiging bij elke stap (en bij plaatsen).",
      "Bestelling bevestigen met vinkje; knop ? opent de werkwijze.",
      "Status één stap terugzetten; tekstveld alleen bij acties die toelichting vereisen."
    ]
  },
  {
    version: "0.3.16",
    date: "24 november 2026",
    changes: [
      "Mollie-koppeling: test- en live-sleutelvelden laden weer correct (formulier was leeg)."
    ]
  },
  {
    version: "0.3.15",
    date: "24 november 2026",
    changes: [
      "Vestiging aanmaken: unieke ids/codes en duidelijke fout bij gekoppelde franchise/tellingen.",
      "Franchise-rechten: Koppelingen/Franchise dekt nu ook de shop-API (accounts, orders, PDF).",
      "Franchise-accounts: schakelaar ‘mag op factuur’ — uit = alleen iDEAL.",
      "Mollie iDEAL voor franchise-orders: test/live, webhook, status (paid/open/pending/failed/canceled/expired).",
      "Na factuur of geslaagde iDEAL: factuur- en pakbon-PDF voor admin én franchise-portaal."
    ]
  },
  {
    version: "0.3.14",
    date: "14 november 2026",
    changes: [
      "Overzicht: bezoekerskalender als heatmap (donkerder bij meer bezoekers dan gebruikelijk).",
      "Rechts onder Uniek: 24-uurs grafiek met piekuren van een gemiddelde drukke dag."
    ]
  },
  {
    version: "0.3.13",
    date: "14 november 2026",
    changes: [
      "Franchise-bestellingen volgen de werkwijze: registreren via WhatsApp/e-mail, ja/nee-stappen, afwijking/nalevering en afronden.",
      "Ontbrekende gegevens en ‘onderweg’ kunnen naar de vestiging gemaild worden. Voorraad blijft bij Tellingen."
    ]
  },
  {
    version: "0.3.12",
    date: "14 november 2026",
    changes: [
      "Franchise-bestellingen: statussen uit de werkwijze, elk met eigen kleur en bolletje zoals bij sollicitaties."
    ]
  },
  {
    version: "0.3.11",
    date: "11 november 2026",
    changes: [
      "Google-mail: verlopen koppeling vraagt om opnieuw inloggen; mail gaat via Gmail API in plaats van SMTP."
    ]
  },
  {
    version: "0.3.10",
    date: "8 november 2026",
    changes: [
      "Media: video's met # of emoji in de bestandsnaam laden weer; ongebruikte brand-video's kun je verwijderen zonder wachtcursor."
    ]
  },
  {
    version: "0.3.9",
    date: "8 november 2026",
    changes: [
      "Media: vinkje selecteert alleen, de pagina slaat niet meer automatisch op en ververst niet."
    ]
  },
  {
    version: "0.3.8",
    date: "8 november 2026",
    changes: [
      "Media: selectievak linksboven bij hover, boven de overlay, ook op video's."
    ]
  },
  {
    version: "0.3.7",
    date: "8 november 2026",
    changes: [
      "Sollicitatiestatus: zoekbare dropdown, typen om te filteren, gekleurde statusdot per status."
    ]
  },
  {
    version: "0.3.6",
    date: "8 november 2026",
    changes: [
      "Media: afbeeldingen selecteren en permanent van de server verwijderen (bibliotheek en mediakiezer).",
      "Vacatures tonen de functiefoto die je in Sollicitaties instelt, niet meer alleen het logo.",
      "E-mail: Google SMTP als aanbevolen Workspace-route; OAuth-redirect-URI duidelijker bij mismatch."
    ]
  },
  {
    version: "0.3.5",
    date: "7 november 2026",
    changes: [
      "E-mail Google: mailbox-eigenaren zien alleen Inloggen met Google. Technische OAuth-velden staan ingeklapt; bij een bestaande sleutel zie je een echo, geen bevestig-ritueel.",
      "Sollicitaties hebben statussen: nieuw, contact opgenomen, in gesprek, aangenomen, afgewezen en ingetrokken.",
      "Testmail per e-mailcategorie in Integraties."
    ]
  },
  {
    version: "0.3.4",
    date: "27 oktober 2026",
    changes: [
      "Loyalty: Registreren opent het Leat-formulier. Inloggen opent het Leat-portaal.",
      "E-mail: Google SMTP met app-wachtwoord als tijdelijke optie naast OAuth. Presets voor Google Workspace, Outlook en eigen SMTP, met host, poort, SSL en inlog."
    ]
  },
  {
    version: "0.3.3",
    date: "18 oktober 2026",
    changes: [
      "Gewoon naar tresamigos.nl gaan haalt de pagina vers op, niet meer uit de oude cache. De loyalty-link blijft het nieuwe formulier, ook zonder harde refresh."
    ]
  },
  {
    version: "0.3.2",
    date: "18 oktober 2026",
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
