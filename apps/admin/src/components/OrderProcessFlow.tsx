import { useEffect, type ReactNode } from "react";
import {
  FRANCHISE_SHOP_ORDER_STATUS_COLORS,
  FRANCHISE_SHOP_ORDER_STATUS_LABELS,
  type FranchiseShopOrderStatus
} from "@tresamigos/types";

type Tone = "kanaal" | "proces" | "beslissing" | "afwijking" | "afgerond";

function Step({
  tone,
  status,
  highlight,
  children
}: {
  tone: Tone;
  status?: FranchiseShopOrderStatus;
  highlight?: FranchiseShopOrderStatus | null;
  children: ReactNode;
}) {
  const active = Boolean(status && highlight && status === highlight);
  const color = status ? FRANCHISE_SHOP_ORDER_STATUS_COLORS[status] : undefined;
  return (
    <div
      className={`order-flow-step order-flow-${tone}${active ? " is-highlight" : ""}`}
      data-flow-status={status || undefined}
      style={
        active && color
          ? {
              borderColor: color,
              boxShadow: `0 0 0 3px ${color}33, 0 10px 28px rgba(0,0,0,0.08)`,
              background: `${color}14`
            }
          : undefined
      }
    >
      {active && status ? (
        <span className="order-flow-you-are-here" style={{ color, borderColor: color, background: "#fff" }}>
          Je bent hier · {FRANCHISE_SHOP_ORDER_STATUS_LABELS[status]}
        </span>
      ) : null}
      {children}
    </div>
  );
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

export function OrderProcessFlow({ highlightStatus }: { highlightStatus?: FranchiseShopOrderStatus | null }) {
  useEffect(() => {
    if (!highlightStatus) return;
    const frame = window.requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-flow-status="${highlightStatus}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [highlightStatus]);

  return (
    <figure className="order-flow">
      <figcaption className="order-flow-legend">
        <span className="order-flow-step order-flow-kanaal">Kanaal</span>
        <span className="order-flow-step order-flow-proces">Proces</span>
        <span className="order-flow-step order-flow-beslissing">Beslissing</span>
        <span className="order-flow-step order-flow-afwijking">Afwijking</span>
        <span className="order-flow-step order-flow-afgerond">Afgerond</span>
      </figcaption>

      {highlightStatus ? (
        <p className="order-flow-highlight-banner">
          Gemarkeerd in de werkwijze:{" "}
          <strong style={{ color: FRANCHISE_SHOP_ORDER_STATUS_COLORS[highlightStatus] }}>
            {FRANCHISE_SHOP_ORDER_STATUS_LABELS[highlightStatus]}
          </strong>
        </p>
      ) : null}

      <div className="order-flow-track">
        <Step tone="kanaal">Bestelling ingediend via portaal, WhatsApp of e-mail</Step>
        <Down />
        <Step tone="proces">Registreer bestelling in centraal overzicht</Step>
        <Down />
        <Step tone="beslissing">Is bestelling volledig geregistreerd?</Step>
        <div className="order-flow-fork">
          <Branch label="Nee" tone="no" back="Terug naar registratie">
            <Step tone="afwijking" status="registratie_onvolledig" highlight={highlightStatus}>
              Status: Registratie onvolledig
            </Step>
            <Down />
            <Step tone="afwijking">Vraag ontbrekende gegevens op</Step>
          </Branch>
          <Branch label="Ja" tone="yes">
            <Step tone="proces" status="in_afwachting" highlight={highlightStatus}>
              Status: In afwachting van bevestiging
            </Step>
          </Branch>
        </div>
        <p className="order-flow-continue">Ja-pad gaat verder</p>
        <Step tone="proces">Productiekeuken controleert bestelling</Step>
        <Down />
        <Step tone="beslissing">Bestelling bevestigd?</Step>
        <div className="order-flow-fork">
          <Branch label="Nee" tone="no" back="Terug naar controle door de productiekeuken">
            <Step tone="afwijking" status="actie_vereist" highlight={highlightStatus}>
              Status: Actie vereist
            </Step>
            <Down />
            <Step tone="afwijking">Stem wijziging, tekort of alternatief af</Step>
          </Branch>
          <Branch label="Ja" tone="yes">
            <Step tone="proces" status="bevestigd" highlight={highlightStatus}>
              Status: Bevestigd
            </Step>
          </Branch>
        </div>
        <p className="order-flow-continue">Ja-pad gaat verder</p>
        <Step tone="proces" status="in_behandeling" highlight={highlightStatus}>
          Status: In behandeling
        </Step>
        <Down />
        <Step tone="proces">Producten produceren of verzamelen</Step>
        <Down />
        <Step tone="proces" status="gereed_voor_verzending" highlight={highlightStatus}>
          Status: Gereed voor verzending
        </Step>
        <Down />
        <Step tone="proces" status="onderweg" highlight={highlightStatus}>
          Status: Onderweg
        </Step>
        <Down />
        <Step tone="proces">Vestiging ontvangt levering</Step>
        <Down />
        <Step tone="proces" status="controle_bij_ontvangst" highlight={highlightStatus}>
          Status: Controle bij ontvangst
        </Step>
        <Down />
        <Step tone="beslissing">Levering compleet en correct?</Step>
        <div className="order-flow-fork">
          <Branch label="Nee" tone="no">
            <Step tone="afwijking" status="afwijking" highlight={highlightStatus}>
              Status: Afwijking
            </Step>
            <Down />
            <Step tone="afwijking">Registreer tekort, schade of fout</Step>
            <Down />
            <Step tone="afwijking">Plan correctie of nalevering</Step>
            <Down />
            <Step tone="beslissing">Is nalevering nodig?</Step>
            <div className="order-flow-fork order-flow-fork-nested">
              <Branch label="Ja" tone="yes" back="Terug naar ontvangst op de vestiging">
                <Step tone="afwijking" status="nalevering_gepland" highlight={highlightStatus}>
                  Status: Nalevering gepland
                </Step>
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
        <Step tone="afgerond" status="afgerond" highlight={highlightStatus}>
          Status: Afgerond
        </Step>
        <Down />
        <Step tone="proces">Werk voorraad bij in Tellingen (handmatig)</Step>
        <Down />
        <Step tone="afgerond">Vink af: tellingen gedaan</Step>
        <Down />
        <Step tone="afgerond">Einde proces</Step>
      </div>
    </figure>
  );
}
