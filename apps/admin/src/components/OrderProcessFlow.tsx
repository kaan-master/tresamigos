import type { ReactNode } from "react";

type Tone = "kanaal" | "proces" | "beslissing" | "afwijking" | "afgerond";

function Step({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <div className={`order-flow-step order-flow-${tone}`}>{children}</div>;
}

function Down({ label }: { label?: string }) {
  return (
    <div className={`order-flow-down${label ? " has-label" : ""}`} aria-hidden="true">
      {label ? <span>{label}</span> : null}
    </div>
  );
}

function Branch({
  label,
  tone,
  back,
  children
}: {
  label: string;
  tone: "no" | "yes";
  back?: string;
  children: ReactNode;
}) {
  return (
    <div className={`order-flow-branch order-flow-branch-${tone}`}>
      <span className={`order-flow-tag order-flow-tag-${tone}`}>{label}</span>
      {children}
      {back ? <p className="order-flow-back">{back}</p> : null}
    </div>
  );
}

export function OrderProcessFlow() {
  return (
    <figure className="order-flow">
      <figcaption className="order-flow-legend">
        <span className="order-flow-step order-flow-kanaal">Kanaal</span>
        <span className="order-flow-step order-flow-proces">Proces</span>
        <span className="order-flow-step order-flow-beslissing">Beslissing</span>
        <span className="order-flow-step order-flow-afwijking">Afwijking</span>
        <span className="order-flow-step order-flow-afgerond">Afgerond</span>
      </figcaption>

      <div className="order-flow-track">
        <Step tone="kanaal">Bestelling ingediend via portaal, WhatsApp of e-mail</Step>
        <Down />
        <Step tone="proces">Registreer bestelling in centraal overzicht</Step>
        <Down />
        <Step tone="beslissing">Is bestelling volledig geregistreerd?</Step>
        <div className="order-flow-fork">
          <Branch label="Nee" tone="no" back="Terug naar registratie">
            <Step tone="afwijking">Status: Registratie onvolledig</Step>
            <Down />
            <Step tone="afwijking">Vraag ontbrekende gegevens op</Step>
          </Branch>
          <Branch label="Ja" tone="yes">
            <Step tone="proces">Status: In afwachting van bevestiging</Step>
          </Branch>
        </div>
        <p className="order-flow-continue">Ja-pad gaat verder</p>
        <Step tone="proces">Productiekeuken controleert bestelling</Step>
        <Down />
        <Step tone="beslissing">Bestelling bevestigd?</Step>
        <div className="order-flow-fork">
          <Branch label="Nee" tone="no" back="Terug naar controle door de productiekeuken">
            <Step tone="afwijking">Status: Actie vereist</Step>
            <Down />
            <Step tone="afwijking">Stem wijziging, tekort of alternatief af</Step>
          </Branch>
          <Branch label="Ja" tone="yes">
            <Step tone="proces">Status: Bevestigd</Step>
          </Branch>
        </div>
        <p className="order-flow-continue">Ja-pad gaat verder</p>
        <Step tone="proces">Status: In behandeling</Step>
        <Down />
        <Step tone="proces">Producten produceren of verzamelen</Step>
        <Down />
        <Step tone="proces">Status: Gereed voor verzending</Step>
        <Down />
        <Step tone="proces">Status: Onderweg</Step>
        <Down />
        <Step tone="proces">Vestiging ontvangt levering</Step>
        <Down />
        <Step tone="proces">Status: Controle bij ontvangst</Step>
        <Down />
        <Step tone="beslissing">Levering compleet en correct?</Step>
        <div className="order-flow-fork">
          <Branch label="Nee" tone="no">
            <Step tone="afwijking">Status: Afwijking</Step>
            <Down />
            <Step tone="afwijking">Registreer tekort, schade of fout</Step>
            <Down />
            <Step tone="afwijking">Plan correctie of nalevering</Step>
            <Down />
            <Step tone="beslissing">Is nalevering nodig?</Step>
            <div className="order-flow-fork order-flow-fork-nested">
              <Branch label="Ja" tone="yes" back="Terug naar ontvangst op de vestiging">
                <Step tone="afwijking">Status: Nalevering gepland</Step>
                <Down />
                <Step tone="afwijking">Verwerk nalevering</Step>
              </Branch>
              <Branch label="Nee" tone="no">
                <Step tone="afwijking">Bevestig ontvangst met afwijking</Step>
              </Branch>
            </div>
          </Branch>
          <Branch label="Ja" tone="yes">
            <Step tone="proces">Bevestig volledige ontvangst</Step>
          </Branch>
        </div>
        <p className="order-flow-continue">Volledige ontvangst en ontvangst met afwijking komen hier samen</p>
        <Step tone="afgerond">Werk voorraad en bestelling bij</Step>
        <Down />
        <Step tone="afgerond">Status: Afgerond</Step>
        <Down />
        <Step tone="proces">Actualiseer voorraad en prognose</Step>
        <Down />
        <Step tone="afgerond">Einde proces</Step>
      </div>
    </figure>
  );
}
