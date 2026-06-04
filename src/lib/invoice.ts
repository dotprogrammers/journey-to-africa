import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

interface InvoiceData {
  invoiceNo: string;
  date: string;
  dueDate: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  notes?: string;
}

class InvoiceService {
  /**
   * Generate a PDF invoice and return as Buffer
   */
  async generatePDF(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const passThrough = new PassThrough();
      const chunks: Buffer[] = [];

      passThrough.on("data", (chunk: Buffer) => chunks.push(chunk));
      passThrough.on("end", () => resolve(Buffer.concat(chunks)));
      passThrough.on("error", reject);

      doc.pipe(passThrough);

      // Header
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("JOURNEY TO AFRICA", 50, 50, { align: "left" });

      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Premium Diaspora Travel Experience", 50, 80, { align: "left" });

      doc
        .fontSize(10)
        .text("Ghana 2026", 50, 95, { align: "left" });

      // Invoice details (right side)
      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .text("INVOICE", 400, 50, { align: "right" });

      doc
        .fontSize(9)
        .font("Helvetica")
        .text(`Invoice #: ${data.invoiceNo}`, 400, 75, { align: "right" })
        .text(`Date: ${data.date}`, 400, 88, { align: "right" })
        .text(`Due Date: ${data.dueDate}`, 400, 101, { align: "right" })
        .text(`Status: ${data.status.toUpperCase()}`, 400, 114, { align: "right" });

      // Divider line
      doc
        .moveTo(50, 140)
        .lineTo(545, 140)
        .strokeColor("#000000")
        .lineWidth(1)
        .stroke();

      // Customer info
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Bill To:", 50, 160)
        .font("Helvetica")
        .text(data.customer.name, 50, 178)
        .text(data.customer.email, 50, 193);

      if (data.customer.phone) {
        doc.text(data.customer.phone, 50, 208);
      }

      // Table header
      const tableTop = 250;
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("Description", 50, tableTop)
        .text("Qty", 350, tableTop)
        .text("Unit Price", 400, tableTop)
        .text("Total", 490, tableTop);

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(545, tableTop + 15)
        .strokeColor("#000000")
        .lineWidth(0.5)
        .stroke();

      // Table rows
      let currentY = tableTop + 25;
      for (const item of data.items) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .text(item.description, 50, currentY, { width: 290 })
          .text(item.quantity.toString(), 350, currentY)
          .text(`${data.currency} ${item.unitPrice.toLocaleString()}`, 400, currentY)
          .text(`${data.currency} ${item.total.toLocaleString()}`, 490, currentY);

        currentY += 25;
      }

      // Totals section
      const totalsY = currentY + 20;

      doc
        .moveTo(50, totalsY - 5)
        .lineTo(545, totalsY - 5)
        .strokeColor("#000000")
        .lineWidth(0.5)
        .stroke();

      doc
        .font("Helvetica")
        .fontSize(9)
        .text("Subtotal:", 400, totalsY)
        .text(`${data.currency} ${data.subtotal.toLocaleString()}`, 490, totalsY);

      if (data.tax > 0) {
        doc
          .text("Tax:", 400, totalsY + 15)
          .text(`${data.currency} ${data.tax.toLocaleString()}`, 490, totalsY + 15);
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("Total:", 400, totalsY + 35)
        .text(`${data.currency} ${data.total.toLocaleString()}`, 490, totalsY + 35);

      // Notes
      if (data.notes) {
        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .text("Notes:", 50, totalsY + 70)
          .font("Helvetica")
          .fontSize(8)
          .text(data.notes, 50, totalsY + 85, { width: 400 });
      }

      // Footer
      doc
        .fontSize(8)
        .font("Helvetica")
        .text(
          "Journey to Africa | Juneteenth Legacy & Investment Experience Ghana 2026",
          50,
          760,
          { align: "center", width: 495 }
        );

      doc.end();
    });
  }

  /**
   * Generate a simple invoice number
   */
  generateInvoiceNo(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const crypto = require("crypto");
    const random = crypto.randomBytes(2).readUInt16BE(0).toString().padStart(4, "0");
    return `INV-${year}${month}-${random}`;
  }
}

export const invoiceService = new InvoiceService();
export type { InvoiceData };
