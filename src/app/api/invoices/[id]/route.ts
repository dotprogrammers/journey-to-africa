import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, isAdminRole } from "@/lib/api-auth";
import { invoiceService } from "@/lib/invoice";

/**
 * GET /api/invoices/[id] - Get invoice details, generate PDF if not exists
 * Supports ?download=true query param to download PDF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const download = searchParams.get("download") === "true";

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            pricingTier: true,
            travelers: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                country: true,
              },
            },
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

    // Users can only see their own invoices (unless admin)
    if (invoice.booking.userId !== user.id && !isAdminRole(user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // If download requested, generate and return PDF
    if (download) {
      const pdfBuffer = await generateInvoicePDF(invoice);

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
        },
      });
    }

    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

/**
 * Generate PDF for an invoice
 */
async function generateInvoicePDF(invoice: {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  lineItems: string;
  billingName: string;
  billingEmail: string;
  billingAddress?: string | null;
  issuedAt?: Date | null;
  booking: {
    bookingReference: string;
    numberOfTravelers: number;
    pricingTier: { name: string; price: number; currency: string };
    user: { name: string; email: string; phone?: string | null };
  };
}): Promise<Buffer> {
  const lineItems = invoice.lineItems ? JSON.parse(invoice.lineItems) : [
    {
      description: `${invoice.booking.pricingTier.name} - Travel Package`,
      quantity: invoice.booking.numberOfTravelers,
      unitPrice: invoice.booking.pricingTier.price,
      total: invoice.subtotal,
    },
  ];

  const invoiceData = {
    invoiceNo: invoice.invoiceNumber,
    date: invoice.issuedAt
      ? new Date(invoice.issuedAt).toLocaleDateString()
      : new Date().toLocaleDateString(),
    dueDate: new Date(
      new Date().setDate(new Date().getDate() + 30)
    ).toLocaleDateString(),
    customer: {
      name: invoice.billingName,
      email: invoice.billingEmail,
      phone: invoice.booking.user.phone || undefined,
    },
    items: lineItems,
    subtotal: invoice.subtotal,
    tax: 0,
    total: invoice.totalAmount,
    currency: invoice.currency,
    status: "Paid",
    notes: `Booking Reference: ${invoice.booking.bookingReference}`,
  };

  return invoiceService.generatePDF(invoiceData);
}
