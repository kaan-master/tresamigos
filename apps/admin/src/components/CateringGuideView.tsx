export function CateringGuideView() {
  return (
    <div className="catering-admin-guide">
      <article className="catering-admin-guide-card">
        <h3>Bestelproces (webshop)</h3>
        <ol>
          <li>Klant kiest afhalen of bezorgen</li>
          <li>Kiest categorie → pakket → configureert eiwit, toppings, sauzen, tortilla en cream</li>
          <li>Voegt toe aan winkelwagen (geel icoon in navbar)</li>
          <li>Vult gegevens in en plaatst bestelling</li>
          <li>Keuken ontvangt order → voorbereiding → afhalen of bezorgen</li>
        </ol>
      </article>
      <article className="catering-admin-guide-card">
        <h3>Pakketregels</h3>
        <ul>
          <li><strong>Budget:</strong> 1 eiwit, 1 topping, 1 saus, 1 tortilla</li>
          <li><strong>Single:</strong> 1 eiwit, 2 toppings, 2 sauzen, guacamole óf sour cream</li>
          <li><strong>Double:</strong> 2 eiwitten, 2 toppings, 2 sauzen, guacamole óf sour cream</li>
          <li><strong>Triple:</strong> 3 eiwitten, 3 toppings, 3 sauzen, guacamole én sour cream</li>
        </ul>
      </article>
      <article className="catering-admin-guide-card">
        <h3>Bestellingen beheren</h3>
        <ol>
          <li>Open <strong>Bestellingen</strong> — gebruik zoeken en optionele filters</li>
          <li>Selecteer een order — statusbalk toont waar je bent in het proces</li>
          <li>Klik <strong>Bevestigen → Start voorbereiding → Afgerond</strong></li>
          <li>Print bon voor keuken of afhalen</li>
        </ol>
      </article>
      <article className="catering-admin-guide-card">
        <h3>Producten & instellingen</h3>
        <ul>
          <li><strong>Producten:</strong> prijzen, NL/EN teksten, min/max personen</li>
          <li><strong>Categorieën:</strong> zichtbaarheid en volgorde in de shop</li>
          <li><strong>Formulier & meldingen:</strong> velden en e-mail bij nieuwe orders</li>
        </ul>
      </article>
    </div>
  );
}
