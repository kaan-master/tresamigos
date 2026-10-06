import { Link } from "react-router-dom";
import type { SiteContent } from "@tresamigos/types";
import { Helmet } from "../components/Helmet";
import { useLanguage } from "../i18n/LanguageProvider";
import { pageSeo } from "../lib/seo";

type Section = { title: string; body: string[] };

function LegalArticle({
  title,
  updated,
  intro,
  sections,
  sibling
}: {
  title: string;
  updated: string;
  intro: string;
  sections: Section[];
  sibling: { to: string; label: string };
}) {
  return (
    <>
      <header className="page-head compact">
        <div className="shell">
          <h1>{title}</h1>
          <p>{intro}</p>
          <p className="legal-updated">{updated}</p>
        </div>
      </header>
      <main className="section legal-page">
        <div className="shell legal-article">
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </section>
          ))}
          <p className="legal-sibling">
            <Link to={sibling.to}>{sibling.label}</Link>
          </p>
        </div>
      </main>
    </>
  );
}

export function PrivacyPage({ content }: { content: SiteContent }) {
  const { lang, t } = useLanguage();
  const seo = pageSeo(content, "privacy");
  const email = content.site.footer.email || "info@tresamigos.nl";
  const nl = lang === "nl";

  const sections: Section[] = nl
    ? [
        {
          title: "1. Wie zijn wij",
          body: [
            "Tres Amigos is een Mexican street food-formule met vestigingen in Amsterdam. Voor persoonsgegevens op tresamigos.nl is Tres Amigos verwerkingsverantwoordelijke.",
            `Vragen over privacy: ${email}.`
          ]
        },
        {
          title: "2. Welke gegevens we verwerken",
          body: [
            "Contactformulier: naam, e-mailadres, onderwerp en bericht.",
            "Cateringbestellingen: naam, contactgegevens, afhaal- of bezorggegevens, bestelinhoud en betaal- of orderstatus waar van toepassing.",
            "Franchise-aanvragen: naam, contactgegevens, adres, gewenste locatie, functie, bedrijf, investering en financiering.",
            "Sollicitaties: naam, contactgegevens, cv en overige bijlagen die je meestuurt.",
            "Nieuwsbrief: naam en e-mailadres.",
            "Franchise-shop: inloggegevens en bestellingen van materialen voor bestaande franchisenemers.",
            "Websitegebruik: technische gegevens zoals IP-adres, apparaat/browser, pagina’s en (indien ingeschakeld) statistieken of advertentieconversies via Google."
          ]
        },
        {
          title: "3. Waarom we gegevens gebruiken",
          body: [
            "Om je vraag, bestelling, aanvraag of sollicitatie te behandelen.",
            "Om de nieuwsbrief te sturen als je je hebt ingeschreven.",
            "Om de website te beveiligen, te verbeteren en (indien ingeschakeld) advertenties te meten.",
            "Om te voldoen aan wettelijke plichten, zoals administratie en fiscale bewaarplicht.",
            "Grondslagen: uitvoering van een overeenkomst of precontractuele stappen, gerechtvaardigd belang (bedrijfsvoering en beveiliging), toestemming (nieuwsbrief, optionele cookies/tracking) of wettelijke plicht."
          ]
        },
        {
          title: "4. Delen met anderen",
          body: [
            "We delen gegevens alleen als dat nodig is: hosting en IT, e-mailverzending (waaronder Google/Gmail als die koppeling actief is), bezorg- of bestelplatforms die jij zelf gebruikt, loyalty (Leat) als je El Club gebruikt, en overheden als de wet dat eist.",
            "We verkopen je gegevens niet."
          ]
        },
        {
          title: "5. Bewaartermijn",
          body: [
            "Contactberichten bewaren we zolang nodig is om te reageren, daarna beperkt voor administratie.",
            "Catering- en shoporders bewaren we zolang de administratie en garantie dat vragen, en daarna volgens fiscale termijnen.",
            "Sollicitaties bewaren we tot de procedure is afgerond, of langer met jouw toestemming.",
            "Nieuwsbriefgegevens tot je je uitschrijft."
          ]
        },
        {
          title: "6. Cookies en tracking",
          body: [
            "Noodzakelijke cookies laten de site werken (taal, sessie, winkelwagen).",
            "Statistieken en Google Ads-conversies gebruiken we alleen als die in de website-instellingen aan staan. Je kunt tracking in je browser beperken."
          ]
        },
        {
          title: "7. Jouw rechten",
          body: [
            "Je kunt inzage, correctie, verwijdering, beperking, overdracht of bezwaar vragen, en toestemming intrekken. Mail daarvoor naar het adres hierboven. Je mag ook een klacht indienen bij de Autoriteit Persoonsgegevens."
          ]
        },
        {
          title: "8. Beveiliging",
          body: [
            "We treffen passende technische en organisatorische maatregelen. Geen systeem is 100% veilig; meld een incident via het contactadres."
          ]
        }
      ]
    : [
        {
          title: "1. Who we are",
          body: [
            "Tres Amigos is a Mexican street-food brand with locations in Amsterdam. Tres Amigos is the controller for personal data processed through tresamigos.nl.",
            `Privacy questions: ${email}.`
          ]
        },
        {
          title: "2. Data we process",
          body: [
            "Contact form: name, email, subject and message.",
            "Catering orders: name, contact details, pickup or delivery details, order contents and order status where applicable.",
            "Franchise applications: name, contact details, address, desired location, role, company, investment and financing.",
            "Job applications: name, contact details, CV and other files you upload.",
            "Newsletter: name and email address.",
            "Franchise shop: login details and supply orders for existing franchisees.",
            "Website use: technical data such as IP address, device/browser, pages viewed and (if enabled) analytics or ad conversions via Google."
          ]
        },
        {
          title: "3. Why we use data",
          body: [
            "To handle your question, order, application or job application.",
            "To send the newsletter if you subscribed.",
            "To secure and improve the website and, if enabled, measure advertising.",
            "To meet legal duties such as accounting.",
            "Legal bases: contract or pre-contract steps, legitimate interest (operations and security), consent (newsletter, optional cookies/tracking) or legal obligation."
          ]
        },
        {
          title: "4. Sharing",
          body: [
            "We share data only when needed: hosting and IT, email sending (including Google/Gmail if that integration is active), delivery or ordering platforms you use yourself, loyalty (Leat) if you use El Club, and authorities when the law requires it.",
            "We do not sell your data."
          ]
        },
        {
          title: "5. Retention",
          body: [
            "Contact messages are kept as long as needed to reply, then limited for administration.",
            "Catering and shop orders are kept for operations and then according to tax rules.",
            "Job applications are kept until the process ends, or longer with your consent.",
            "Newsletter data until you unsubscribe."
          ]
        },
        {
          title: "6. Cookies and tracking",
          body: [
            "Essential cookies make the site work (language, session, cart).",
            "Analytics and Google Ads conversions run only if those settings are enabled. You can limit tracking in your browser."
          ]
        },
        {
          title: "7. Your rights",
          body: [
            "You may request access, correction, deletion, restriction, portability or object, and withdraw consent. Email the address above. You may also complain to the Dutch Data Protection Authority (Autoriteit Persoonsgegevens)."
          ]
        },
        {
          title: "8. Security",
          body: [
            "We take appropriate technical and organisational measures. No system is fully secure; report an incident via the contact address."
          ]
        }
      ];

  return (
    <>
      <Helmet title={seo.title} description={seo.description} />
      <LegalArticle
        title={t("legal.privacyTitle")}
        updated={t("legal.updated")}
        intro={t("legal.privacyIntro")}
        sections={sections}
        sibling={{ to: "/terms", label: t("legal.viewTerms") }}
      />
    </>
  );
}

export function TermsPage({ content }: { content: SiteContent }) {
  const { lang, t } = useLanguage();
  const seo = pageSeo(content, "terms");
  const email = content.site.footer.email || "info@tresamigos.nl";
  const nl = lang === "nl";

  const sections: Section[] = nl
    ? [
        {
          title: "1. Wie en wat",
          body: [
            "Deze voorwaarden gelden voor tresamigos.nl, inclusief catering, franchise-aanvragen, sollicitaties en de franchise-shop. Door de site te gebruiken ga je hiermee akkoord.",
            `Contact: ${email}.`
          ]
        },
        {
          title: "2. De website",
          body: [
            "Teksten, prijzen, openingstijden en beschikbaarheid kunnen wijzigen. Foto’s zijn sfeerimpressies. Bestellen bij een vestiging via Take Away, Thuisbezorgd of Uber Eats loopt via die partij; hun voorwaarden gelden daar."
          ]
        },
        {
          title: "3. Catering",
          body: [
            "Een cateringbestelling is pas definitief als wij die bevestigen. Levering of afhaal hangt af van de gekozen optie, openingstijden en beschikbaarheid.",
            "Annuleren of wijzigen: neem zo snel mogelijk contact op. Afhankelijk van bereiding en timing kunnen kosten in rekening worden gebracht.",
            "Allergenen: vermeld die duidelijk bij de bestelling. We werken zorgvuldig, maar kruisbesmetting in de keuken is niet uit te sluiten."
          ]
        },
        {
          title: "4. Franchise en vacatures",
          body: [
            "Een franchise-aanvraag of sollicitatie is geen overeenkomst. We beslissen vrij of we verder gaan. Inloggen in de franchise-shop is alleen voor bestaande houders met een account."
          ]
        },
        {
          title: "5. Intellectueel eigendom",
          body: [
            "Merk, logo, foto’s, video’s en teksten zijn van Tres Amigos of haar licentiegevers. Je mag ze niet kopiëren of commercieel gebruiken zonder toestemming."
          ]
        },
        {
          title: "6. Aansprakelijkheid",
          body: [
            "We streven naar een beschikbare en juiste website, maar zijn niet aansprakelijk voor storingen, typefouten of handelingen van derde platforms. Onze aansprakelijkheid is beperkt tot directe schade en tot het bedrag van de betreffende bestelling, voor zover de wet dat toestaat."
          ]
        },
        {
          title: "7. Recht",
          body: [
            "Nederlands recht is van toepassing. Geschillen bij de bevoegde rechter in Amsterdam, tenzij dwingend recht anders voorschrijft."
          ]
        }
      ]
    : [
        {
          title: "1. Who and what",
          body: [
            "These terms apply to tresamigos.nl, including catering, franchise applications, job applications and the franchise shop. By using the site you agree to them.",
            `Contact: ${email}.`
          ]
        },
        {
          title: "2. The website",
          body: [
            "Copy, prices, opening hours and availability can change. Photos are illustrative. Ordering from a shop via Take Away, Thuisbezorgd or Uber Eats is handled by that party; their terms apply there."
          ]
        },
        {
          title: "3. Catering",
          body: [
            "A catering order is confirmed only when we accept it. Delivery or pickup depends on the option you choose, opening hours and availability.",
            "To cancel or change, contact us as soon as possible. Costs may apply depending on preparation and timing.",
            "Allergens: state them clearly with the order. We work carefully, but cross-contact in the kitchen cannot be fully excluded."
          ]
        },
        {
          title: "4. Franchise and jobs",
          body: [
            "A franchise or job application is not a contract. We decide freely whether to continue. Franchise shop login is only for existing franchisees with an account."
          ]
        },
        {
          title: "5. Intellectual property",
          body: [
            "Brand, logo, photos, video and text belong to Tres Amigos or its licensors. Do not copy or use them commercially without permission."
          ]
        },
        {
          title: "6. Liability",
          body: [
            "We aim for an available, accurate site but are not liable for outages, typos or third-party platforms. Liability is limited to direct damage and to the amount of the relevant order, as far as the law allows."
          ]
        },
        {
          title: "7. Law",
          body: [
            "Dutch law applies. Disputes go to the competent court in Amsterdam unless mandatory law says otherwise."
          ]
        }
      ];

  return (
    <>
      <Helmet title={seo.title} description={seo.description} />
      <LegalArticle
        title={t("legal.termsTitle")}
        updated={t("legal.updated")}
        intro={t("legal.termsIntro")}
        sections={sections}
        sibling={{ to: "/privacy", label: t("legal.viewPrivacy") }}
      />
    </>
  );
}
