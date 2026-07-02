export function CateringGuideView() {
  return (
    <div className="catering-admin-guide">
      <article className="catering-admin-guide-card">
        <h3>Dagelijkse workflow</h3>
        <ol>
          <li>
            <strong>Nieuw</strong> — order binnen. Bel of mail de klant en klik op <em>Bevestigen</em>.
          </li>
          <li>
            <strong>Bevestigd</strong> — akkoord met datum en samenstelling. Zet op <em>Start voorbereiding</em> wanneer de keuken begint.
          </li>
          <li>
            <strong>In voorbereiding</strong> — wordt klaargemaakt. Na aflevering: <em>Markeer afgerond</em>.
          </li>
          <li>
            <strong>Geannuleerd</strong> — alleen als de order niet doorgaat.
          </li>
        </ol>
      </article>

      <article className="catering-admin-guide-card">
        <h3>Producten beheren</h3>
        <ul>
          <li>Ga naar <strong>Producten & prijzen</strong> om items toe te voegen, te verbergen of prijzen aan te passen.</li>
          <li>Bij configureerbare pakketten stel je per aantal personen (10–30) de meerprijs in.</li>
          <li>Max. personen online bepaalt wanneer klanten doorgestuurd worden naar e-mail voor grote groepen.</li>
        </ul>
      </article>

      <article className="catering-admin-guide-card">
        <h3>Handige tips</h3>
        <ul>
          <li>Filter bestellingen standaard op <strong>komende events</strong> — dat is het meest relevant voor planning.</li>
          <li>Gebruik interne notities voor telefoongesprekken, allergieën of wijzigingen.</li>
          <li>Print bon voor in de keuken of bij afhalen.</li>
        </ul>
      </article>
    </div>
  );
}
