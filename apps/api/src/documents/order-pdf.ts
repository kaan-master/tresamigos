import PDFDocument from "pdfkit";

export type PdfDocKind = "invoice" | "packing-slip";

export type PdfLineItem = {
  name: string;
  quantity: number;
  unitPriceCents?: number;
  lineTotalCents?: number;
  detail?: string;
};

export type PdfParty = {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  vatId?: string;
  kvk?: string;
  address?: string;
  locationLabel?: string;
};

export type PdfOrderDocumentInput = {
  kind: PdfDocKind;
  channel: "franchise" | "catering";
  title: string;
  orderNumber: string;
  invoiceNumber?: string;
  createdAt: string | Date;
  statusLabel?: string;
  notes?: string;
  seller?: Partial<PdfParty> & { legalName?: string };
  customer: PdfParty;
  lines: PdfLineItem[];
  subtotalCents?: number;
  meta?: Array<{ label: string; value: string }>;
};

const DEFAULT_SELLER = {
  legalName: process.env.COMPANY_LEGAL_NAME || "Tres Amigos",
  company: process.env.COMPANY_TRADE_NAME || "Tres Amigos",
  address: process.env.COMPANY_ADDRESS || "",
  vatId: process.env.COMPANY_VAT_ID || "",
  kvk: process.env.COMPANY_KVK || "",
  email: process.env.COMPANY_INVOICE_EMAIL || "info@tresamigos.nl",
  phone: process.env.COMPANY_PHONE || ""
};

function euro(cents: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format((cents || 0) / 100);
}

function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || "");
  return date.toLocaleString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function partyBlock(party: PdfParty, fallbackName: string) {
  const lines = [
    party.company || party.name || fallbackName,
    party.company && party.name && party.company !== party.name ? `t.a.v. ${party.name}` : "",
    party.locationLabel || "",
    party.address || "",
    party.email || "",
    party.phone || "",
    party.vatId ? `BTW: ${party.vatId}` : "",
    party.kvk ? `KvK: ${party.kvk}` : ""
  ].filter(Boolean);
  return lines;
}

export async function buildOrderPdf(input: PdfOrderDocumentInput): Promise<Buffer> {
  const seller = { ...DEFAULT_SELLER, ...input.seller };
  const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: input.title, Author: seller.legalName } });
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    let y = doc.page.margins.top;

    doc.font("Helvetica-Bold").fontSize(18).text(input.title, doc.page.margins.left, y);
    y = doc.y + 6;
    doc.font("Helvetica").fontSize(10).fillColor("#555555").text(
      input.channel === "franchise" ? "Franchise shop" : "Catering",
      doc.page.margins.left,
      y
    );
    y = doc.y + 16;
    doc.fillColor("#111111");

    const leftX = doc.page.margins.left;
    const rightX = doc.page.margins.left + pageWidth / 2 + 8;

    doc.font("Helvetica-Bold").fontSize(10).text("Van", leftX, y);
    doc.text("Aan", rightX, y);
    y += 14;
    doc.font("Helvetica").fontSize(9);
    const sellerLines = [
      seller.legalName || seller.company || "Tres Amigos",
      seller.address,
      seller.email,
      seller.phone,
      seller.vatId ? `BTW: ${seller.vatId}` : "",
      seller.kvk ? `KvK: ${seller.kvk}` : ""
    ].filter(Boolean);
    const customerLines = partyBlock(input.customer, "Klant");
    const blockLines = Math.max(sellerLines.length, customerLines.length, 1);
    for (let i = 0; i < blockLines; i += 1) {
      doc.text(sellerLines[i] || " ", leftX, y, { width: pageWidth / 2 - 12 });
      doc.text(customerLines[i] || " ", rightX, y, { width: pageWidth / 2 - 12 });
      y += 12;
    }

    y += 10;
    doc.moveTo(leftX, y).lineTo(leftX + pageWidth, y).strokeColor("#dddddd").stroke();
    y += 12;
    doc.strokeColor("#000000");

    const meta: Array<{ label: string; value: string }> = [
      { label: "Ordernummer", value: input.orderNumber },
      ...(input.invoiceNumber ? [{ label: "Factuurnummer", value: input.invoiceNumber }] : []),
      { label: "Datum", value: formatDate(input.createdAt) },
      ...(input.statusLabel ? [{ label: "Status", value: input.statusLabel }] : []),
      ...(input.meta || [])
    ];

    doc.fontSize(9);
    for (const row of meta) {
      doc.font("Helvetica-Bold").text(`${row.label}:`, leftX, y, { continued: true });
      doc.font("Helvetica").text(` ${row.value}`);
      y = doc.y + 2;
    }

    y += 12;
    const showMoney = input.kind === "invoice";
    const colQty = leftX + (showMoney ? pageWidth * 0.48 : pageWidth * 0.72);
    const colUnit = leftX + pageWidth * 0.62;
    const colTotal = leftX + pageWidth * 0.8;

    doc.font("Helvetica-Bold").fontSize(9);
    doc.text("Product / omschrijving", leftX, y, { width: colQty - leftX - 8 });
    doc.text("Aantal", colQty, y, { width: 50 });
    if (showMoney) {
      doc.text("Prijs", colUnit, y, { width: 70 });
      doc.text("Totaal", colTotal, y, { width: 70 });
    } else {
      doc.text("Geleverd", colQty + 56, y, { width: 70 });
    }
    y += 14;
    doc.moveTo(leftX, y).lineTo(leftX + pageWidth, y).strokeColor("#dddddd").stroke();
    y += 8;
    doc.strokeColor("#000000").font("Helvetica").fontSize(9);

    for (const line of input.lines) {
      const nameHeight = doc.heightOfString(line.name, { width: colQty - leftX - 8 });
      const detailHeight = line.detail ? doc.heightOfString(line.detail, { width: colQty - leftX - 8 }) : 0;
      const rowHeight = Math.max(14, nameHeight + detailHeight + 4);
      if (y + rowHeight > doc.page.height - 72) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      doc.text(line.name, leftX, y, { width: colQty - leftX - 8 });
      if (line.detail) {
        doc.fillColor("#666666").text(line.detail, leftX, y + nameHeight, { width: colQty - leftX - 8 });
        doc.fillColor("#111111");
      }
      doc.text(String(line.quantity), colQty, y, { width: 50 });
      if (showMoney) {
        doc.text(euro(line.unitPriceCents || 0), colUnit, y, { width: 70 });
        doc.text(euro(line.lineTotalCents || 0), colTotal, y, { width: 70 });
      } else {
        doc.text("□", colQty + 56, y, { width: 70 });
      }
      y += rowHeight + 4;
    }

    y += 8;
    doc.moveTo(leftX, y).lineTo(leftX + pageWidth, y).strokeColor("#dddddd").stroke();
    y += 12;
    doc.strokeColor("#000000");

    if (showMoney && input.subtotalCents != null) {
      doc.font("Helvetica-Bold").fontSize(11).text(`Totaal: ${euro(input.subtotalCents)}`, leftX, y, {
        align: "right",
        width: pageWidth
      });
      y = doc.y + 8;
      doc.font("Helvetica").fontSize(8).fillColor("#666666").text(
        "Bedragen in EUR. BTW volgens geldende tarieven / afspraken.",
        leftX,
        y,
        { width: pageWidth }
      );
      doc.fillColor("#111111");
      y = doc.y + 8;
    }

    if (input.notes) {
      doc.font("Helvetica-Bold").fontSize(9).text("Opmerking", leftX, y);
      y = doc.y + 2;
      doc.font("Helvetica").fontSize(9).text(input.notes, leftX, y, { width: pageWidth });
    }

    if (input.kind === "packing-slip") {
      y = Math.max(doc.y + 24, doc.page.height - 120);
      doc.font("Helvetica").fontSize(9).text("Handtekening ontvanger: ____________________________", leftX, y);
      doc.text("Datum: ______________", leftX, y + 18);
    }

    doc.end();
  });
}

export function pdfFilename(kind: PdfDocKind, number: string) {
  const safe = String(number || "document").replace(/[^\w.-]+/g, "_");
  return kind === "invoice" ? `factuur-${safe}.pdf` : `pakbon-${safe}.pdf`;
}
