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
  const value = ((cents || 0) / 100).toFixed(2).replace(".", ",");
  return `EUR ${value}`;
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

function nonEmpty(line: string | undefined | null | false): line is string {
  return Boolean(line && String(line).trim());
}

function sellerLines(seller: typeof DEFAULT_SELLER & Partial<PdfParty> & { legalName?: string }): string[] {
  return [
    seller.legalName || seller.company || "Tres Amigos",
    seller.address,
    seller.email,
    seller.phone,
    seller.vatId ? `BTW: ${seller.vatId}` : "",
    seller.kvk ? `KvK: ${seller.kvk}` : ""
  ].filter(nonEmpty);
}

function customerLines(party: PdfParty): string[] {
  return [
    party.company || party.name || "Klant",
    party.company && party.name && party.company !== party.name ? `t.a.v. ${party.name}` : "",
    party.locationLabel,
    party.address,
    party.email,
    party.phone,
    party.vatId ? `BTW: ${party.vatId}` : "",
    party.kvk ? `KvK: ${party.kvk}` : ""
  ].filter(nonEmpty);
}

function drawCheckbox(doc: InstanceType<typeof PDFDocument>, x: number, y: number, size = 10) {
  doc.rect(x, y + 1, size, size).strokeColor("#333333").lineWidth(1).stroke();
  doc.strokeColor("#000000");
}

function writeColumn(
  doc: InstanceType<typeof PDFDocument>,
  lines: string[],
  x: number,
  startY: number,
  width: number,
  lineHeight = 13
) {
  let y = startY;
  for (const line of lines) {
    doc.text(line, x, y, { width, lineBreak: false });
    y += lineHeight;
  }
  return y;
}

export async function buildOrderPdf(input: PdfOrderDocumentInput): Promise<Buffer> {
  const seller = { ...DEFAULT_SELLER, ...input.seller };
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    info: { Title: input.title, Author: seller.legalName || "Tres Amigos" }
  });
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const leftX = doc.page.margins.left;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colGap = 24;
    const colWidth = (pageWidth - colGap) / 2;
    const rightX = leftX + colWidth + colGap;
    let y = doc.page.margins.top;

    doc.font("Helvetica-Bold").fontSize(20).fillColor("#111111").text(input.title, leftX, y, {
      width: pageWidth,
      lineBreak: false
    });
    y += 26;
    doc.font("Helvetica").fontSize(10).fillColor("#666666").text(
      input.channel === "franchise" ? "Franchise shop" : "Catering",
      leftX,
      y,
      { width: pageWidth, lineBreak: false }
    );
    y += 22;
    doc.fillColor("#111111");

    doc.font("Helvetica-Bold").fontSize(10).text("Van", leftX, y, { width: colWidth, lineBreak: false });
    doc.text("Aan", rightX, y, { width: colWidth, lineBreak: false });
    y += 16;

    doc.font("Helvetica").fontSize(9);
    const leftEnd = writeColumn(doc, sellerLines(seller), leftX, y, colWidth);
    const rightEnd = writeColumn(doc, customerLines(input.customer), rightX, y, colWidth);
    y = Math.max(leftEnd, rightEnd) + 14;

    doc
      .moveTo(leftX, y)
      .lineTo(leftX + pageWidth, y)
      .strokeColor("#dddddd")
      .lineWidth(1)
      .stroke();
    y += 14;
    doc.strokeColor("#000000");

    const meta: Array<{ label: string; value: string }> = [
      { label: "Ordernummer", value: input.orderNumber },
      ...(input.kind === "invoice" && input.invoiceNumber
        ? [{ label: "Factuurnummer", value: input.invoiceNumber }]
        : []),
      { label: "Datum", value: formatDate(input.createdAt) },
      ...(input.statusLabel ? [{ label: "Status", value: input.statusLabel }] : []),
      ...(input.meta || [])
    ];

    for (const row of meta) {
      doc.font("Helvetica-Bold").fontSize(9).text(`${row.label}:`, leftX, y, {
        continued: true,
        lineBreak: false
      });
      doc.font("Helvetica").text(` ${row.value}`, { lineBreak: false });
      y += 14;
    }

    y += 10;
    const showMoney = input.kind === "invoice";
    const colNameW = showMoney ? pageWidth * 0.46 : pageWidth * 0.62;
    const colQtyX = leftX + colNameW + 8;
    const colQtyW = 48;
    const colCheckX = colQtyX + colQtyW + 16;
    const colUnitX = leftX + pageWidth * 0.62;
    const colTotalX = leftX + pageWidth * 0.8;

    doc.font("Helvetica-Bold").fontSize(9);
    doc.text("Product / omschrijving", leftX, y, { width: colNameW, lineBreak: false });
    doc.text("Aantal", colQtyX, y, { width: colQtyW, lineBreak: false });
    if (showMoney) {
      doc.text("Prijs", colUnitX, y, { width: 70, lineBreak: false });
      doc.text("Totaal", colTotalX, y, { width: 70, lineBreak: false });
    } else {
      doc.text("Geleverd", colCheckX, y, { width: 70, lineBreak: false });
    }
    y += 16;

    doc
      .moveTo(leftX, y)
      .lineTo(leftX + pageWidth, y)
      .strokeColor("#dddddd")
      .stroke();
    y += 10;
    doc.strokeColor("#000000").font("Helvetica").fontSize(9);

    for (const line of input.lines) {
      const nameHeight = doc.heightOfString(line.name, { width: colNameW });
      const detailHeight = line.detail ? doc.heightOfString(line.detail, { width: colNameW }) : 0;
      const rowHeight = Math.max(18, nameHeight + detailHeight + 6);
      if (y + rowHeight > doc.page.height - 90) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      const rowTop = y;
      doc.fillColor("#111111").text(line.name, leftX, rowTop, { width: colNameW });
      if (line.detail) {
        doc.fillColor("#666666").text(line.detail, leftX, rowTop + nameHeight + 1, { width: colNameW });
        doc.fillColor("#111111");
      }
      doc.text(String(line.quantity), colQtyX, rowTop, { width: colQtyW, lineBreak: false });
      if (showMoney) {
        doc.text(euro(line.unitPriceCents || 0), colUnitX, rowTop, { width: 70, lineBreak: false });
        doc.text(euro(line.lineTotalCents || 0), colTotalX, rowTop, { width: 70, lineBreak: false });
      } else {
        drawCheckbox(doc, colCheckX, rowTop, 11);
      }
      y = rowTop + rowHeight;
    }

    y += 8;
    doc
      .moveTo(leftX, y)
      .lineTo(leftX + pageWidth, y)
      .strokeColor("#dddddd")
      .stroke();
    y += 14;
    doc.strokeColor("#000000");

    if (showMoney && input.subtotalCents != null) {
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#111111").text(`Totaal: ${euro(input.subtotalCents)}`, leftX, y, {
        align: "right",
        width: pageWidth,
        lineBreak: false
      });
      y += 18;
      doc.font("Helvetica").fontSize(8).fillColor("#666666").text(
        "Bedragen in EUR. BTW volgens geldende tarieven / afspraken.",
        leftX,
        y,
        { width: pageWidth }
      );
      doc.fillColor("#111111");
      y = doc.y + 10;
    }

    if (input.notes) {
      doc.font("Helvetica-Bold").fontSize(9).text("Opmerking", leftX, y, { lineBreak: false });
      y += 14;
      doc.font("Helvetica").fontSize(9).text(input.notes, leftX, y, { width: pageWidth });
      y = doc.y + 12;
    }

    if (input.kind === "packing-slip") {
      y = Math.max(y + 20, doc.page.height - 110);
      doc.font("Helvetica").fontSize(9).fillColor("#111111");
      doc.text("Handtekening ontvanger: ________________________________", leftX, y, {
        lineBreak: false
      });
      doc.text("Datum: ____________________", leftX, y + 22, { lineBreak: false });
    }

    doc.end();
  });
}

export function pdfFilename(kind: PdfDocKind, number: string) {
  const safe = String(number || "document").replace(/[^\w.-]+/g, "_");
  return kind === "invoice" ? `factuur-${safe}.pdf` : `pakbon-${safe}.pdf`;
}
