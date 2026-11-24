/** Tres Amigos huisstijl voor uitgaande e-mails (HTML + plain text). */

const BRAND = {
  corn: "#FCB92A",
  cherry: "#F34238",
  mole: "#593805",
  paper: "#fffdf8",
  soft: "#faf6ed",
  softYellow: "#fff4d8",
  text: "#21170c",
  muted: "#655b50",
  line: "#eadcc8",
  white: "#ffffff"
} as const;

export function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function resolvePublicWebUrl() {
  return String(process.env.FRONTEND_URL || process.env.PUBLIC_WEB_URL || "https://tresamigos.nl")
    .trim()
    .replace(/\/$/, "");
}

export function resolveBrandLogoUrl() {
  const fromEnv = String(process.env.MAIL_LOGO_URL || "").trim();
  if (fromEnv) return fromEnv;
  return `${resolvePublicWebUrl()}/assets/site/tres-amigos-logo-new.png`;
}

function textBodyToHtml(text: string) {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    return `<p style="margin:0;color:${BRAND.muted};font-size:15px;line-height:1.55;">—</p>`;
  }
  return trimmed
    .split(/\n{2,}/)
    .map((block) => {
      const html = escapeHtml(block).replace(/\n/g, "<br/>");
      return `<p style="margin:0 0 14px;color:${BRAND.text};font-size:15px;line-height:1.55;">${html}</p>`;
    })
    .join("");
}

export function buildBrandedEmailHtml(input: {
  subject: string;
  text: string;
  preheader?: string;
}) {
  const logoUrl = resolveBrandLogoUrl();
  const siteUrl = resolvePublicWebUrl();
  const title = escapeHtml(input.subject || "Tres Amigos");
  const preheader = escapeHtml(input.preheader || input.text.slice(0, 120).replace(/\s+/g, " "));
  const bodyHtml = textBodyToHtml(input.text);

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.soft};color:${BRAND.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.soft};padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;border-collapse:separate;">
          <tr>
            <td style="padding:0 0 14px;text-align:center;">
              <a href="${escapeHtml(siteUrl)}" style="text-decoration:none;">
                <img src="${escapeHtml(logoUrl)}" width="168" alt="Tres Amigos" style="display:block;margin:0 auto;width:168px;max-width:70%;height:auto;border:0;"/>
              </a>
            </td>
          </tr>
          <tr>
            <td style="background:${BRAND.white};border:1px solid ${BRAND.line};border-radius:18px;overflow:hidden;box-shadow:0 12px 36px rgba(33,23,12,0.08);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:6px;line-height:6px;font-size:0;background:linear-gradient(90deg,${BRAND.corn},${BRAND.cherry});">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:22px 24px 8px;background:${BRAND.paper};">
                    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;font-weight:800;color:${BRAND.cherry};font-family:Arial,Helvetica,sans-serif;">Tres Amigos</p>
                    <h1 style="margin:0;font-size:22px;line-height:1.25;letter-spacing:-0.02em;color:${BRAND.text};font-family:Arial,Helvetica,sans-serif;font-weight:800;">${title}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 24px 24px;background:${BRAND.white};font-family:Arial,Helvetica,sans-serif;">
                    ${bodyHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;background:${BRAND.softYellow};border-top:1px solid ${BRAND.line};font-family:Arial,Helvetica,sans-serif;">
                    <p style="margin:0;font-size:12px;line-height:1.5;color:${BRAND.mole};">
                      Streetfood met smaak · <a href="${escapeHtml(siteUrl)}" style="color:${BRAND.mole};font-weight:700;">tresamigos.nl</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 8px 0;text-align:center;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0;font-size:11px;line-height:1.45;color:${BRAND.muted};">
                Deze mail is verstuurd door Tres Amigos. Antwoorden op dit bericht kunnen afhankelijk van het adres gelezen worden.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
