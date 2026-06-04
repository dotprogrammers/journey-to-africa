import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { emailService } from "@/lib/email";
import { invoiceService } from "@/lib/invoice";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * GET /api/admin/invoices - List all invoices
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        include: {
          booking: {
            select: {
              bookingReference: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.invoice.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/invoices/[id]/resend - Resend invoice via email
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("id");

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        booking: {
          include: {
            pricingTier: true,
            user: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    const pdfBuffer = await invoiceService.generatePDF({
      invoiceNo: invoice.invoiceNumber,
      date: invoice.issuedAt
        ? new Date(invoice.issuedAt).toLocaleDateString()
        : new Date().toLocaleDateString(),
      dueDate: invoice.dueAt
        ? new Date(invoice.dueAt).toLocaleDateString()
        : new Date(new Date().setDate(new Date().getDate() + 30)).toLocaleDateString(),
      customer: {
        name: invoice.billingName,
        email: invoice.billingEmail,
        phone: invoice.booking.user.phone || undefined,
      },
      items: invoice.lineItems ? JSON.parse(invoice.lineItems) : [
        {
          description: `${invoice.booking.pricingTier.name} - Travel Package`,
          quantity: invoice.booking.numberOfTravelers,
          unitPrice: invoice.booking.pricingTier.price,
          total: invoice.subtotal,
        },
      ],
      subtotal: invoice.subtotal,
      tax: 0,
      total: invoice.totalAmount,
      currency: invoice.currency,
      status: "Paid",
      notes: `Booking Reference: ${invoice.booking.bookingReference}`,
    });

    await emailService.sendEmail({
      to: invoice.billingEmail,
      subject: `Invoice ${invoice.invoiceNumber} - Journey to Africa`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Invoice ${escapeHtml(invoice.invoiceNumber)}</h2>
          <p>Dear ${escapeHtml(invoice.billingName)},</p>
          <p>Please find attached your invoice for the Journey to Africa experience.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Amount:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(invoice.currency)} ${invoice.totalAmount.toLocaleString()}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Booking Reference:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(invoice.booking.bookingReference)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Tier:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(invoice.booking.pricingTier.name)}</td></tr>
          </table>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br/>Journey to Africa Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      data: { message: `Invoice resent to ${invoice.billingEmail}` },
    });
  } catch (error) {
    console.error("Error resending invoice:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resend invoice" },
      { status: 500 }
    );
  }
}
