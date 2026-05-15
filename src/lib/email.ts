import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { decrypt } from "./encryption";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  userId?: string;
  bookingId?: string;
  templateId?: string;
}

interface TemplateData {
  [key: string]: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private async getConfig() {
    const configs = await db.systemConfiguration.findMany({
      where: {
        key: {
          in: ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "email_from"]
        }
      }
    });

    const get = (key: string) => {
      const c = configs.find(x => x.key === key);
      if (!c) return process.env[key.toUpperCase()] || "";
      return decrypt(c.value);
    };

    return {
      host: get("smtp_host"),
      port: Number(get("smtp_port")) || 587,
      user: get("smtp_user"),
      pass: get("smtp_pass"),
      from: get("email_from")
    };
  }

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (!this.transporter) {
      const config = await this.getConfig();
      
      if (!config.host) {
        // Dev mode fallback if no host configured
        this.transporter = nodemailer.createTransport({
          streamTransport: true,
          newline: "unix",
          buffer: true,
        });
      } else {
        this.transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.port === 465,
          auth: {
            user: config.user,
            pass: config.pass,
          },
        });
      }
    }
    return this.transporter;
  }

  /**
   * Send an email and log it to the database
   */
  async sendEmail(params: SendEmailParams): Promise<boolean> {
    const config = await this.getConfig();
    const from =
      params.from || config.from || process.env.EMAIL_FROM || "noreply@journeytoafrica.com";

    try {
      if (!config.host) {
        // Dev mode: just log to console
        console.log("📧 [DEV EMAIL] ────────────────────────────");
        console.log(`  From: ${from}`);
        console.log(`  To: ${params.to}`);
        console.log(`  Subject: ${params.subject}`);
        console.log(`  Text Body: ${params.text || '(no text body)'}`);
        console.log(`  HTML Body:`);
        console.log(params.html);
        console.log("─────────────────────────────────────────");

        // Log as sent in dev mode
        await db.emailLog.create({
          data: {
            recipientEmail: params.to,
            subject: params.subject,
            body: params.html,
            status: "sent",
            sentAt: new Date(),
            userId: params.userId,
            bookingId: params.bookingId,
            templateId: params.templateId,
          },
        });

        return true;
      }

      const transporter = await this.getTransporter();
      await transporter.sendMail({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      // Log successful email
      await db.emailLog.create({
        data: {
          recipientEmail: params.to,
          subject: params.subject,
          body: params.html,
          status: "sent",
          sentAt: new Date(),
          userId: params.userId,
          bookingId: params.bookingId,
          templateId: params.templateId,
        },
      });

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Log failed email
      try {
        await db.emailLog.create({
          data: {
            recipientEmail: params.to,
            subject: params.subject,
            body: params.html,
            status: "failed",
            errorMessage,
            userId: params.userId,
            bookingId: params.bookingId,
            templateId: params.templateId,
          },
        });
      } catch (logError) {
        console.error("Failed to log email error:", logError);
      }

      console.error("Email send failed:", errorMessage);
      return false;
    }
  }

  /**
   * Send an email using a template from the database
   * 1. Looks up the template by slug
   * 2. Replaces {{variable}} placeholders in subject and body
   * 3. Sends the email
   * 4. Logs to EmailLog table
   */
  async sendTemplateEmail(
    templateSlug: string,
    recipientEmail: string,
    data: TemplateData,
    options?: { userId?: string; bookingId?: string }
  ): Promise<boolean> {
    try {
      const template = await db.emailTemplate.findUnique({
        where: { slug: templateSlug },
      });

      if (!template) {
        console.error(`Email template "${templateSlug}" not found`);
        return false;
      }

      if (!template.isActive) {
        console.error(`Email template "${templateSlug}" is not active`);
        return false;
      }

      // Replace {{variable}} placeholders in subject
      let subject = template.subject;
      for (const [key, value] of Object.entries(data)) {
        subject = subject.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
      }

      // Replace {{variable}} placeholders in HTML body
      let html = template.bodyHtml;
      for (const [key, value] of Object.entries(data)) {
        html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
      }

      // Replace placeholders in text body if available
      let text: string | undefined;
      if (template.bodyText) {
        text = template.bodyText;
        for (const [key, value] of Object.entries(data)) {
          text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
        }
      }

      return this.sendEmail({
        to: recipientEmail,
        subject,
        html,
        text,
        templateId: template.id,
        userId: options?.userId,
        bookingId: options?.bookingId,
      });
    } catch (error) {
      console.error("sendTemplateEmail error:", error);
      return false;
    }
  }

  /**
   * Send booking received email (fire and forget)
   */
  async sendBookingReceived(
    email: string,
    name: string,
    bookingReference: string,
    tierName: string,
    totalAmount: number,
    currency: string,
    numberOfTravelers: number,
    options?: { userId?: string; bookingId?: string }
  ): Promise<void> {
    // Fire and forget - don't block the caller
    this.sendTemplateEmail("booking_received", email, {
      name,
      bookingReference,
      tierName,
      totalAmount: totalAmount.toLocaleString(),
      currency,
      numberOfTravelers: numberOfTravelers.toString(),
    }, options).catch((err) => {
      console.error("Failed to send booking_received email:", err);
    });
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(
    email: string,
    name: string,
    bookingReference: string,
    tierName: string,
    totalAmount: number,
    currency: string,
    options?: { userId?: string; bookingId?: string }
  ): Promise<void> {
    this.sendTemplateEmail("booking_confirmed", email, {
      name,
      bookingReference,
      tierName,
      totalAmount: totalAmount.toLocaleString(),
      currency,
    }, options).catch((err) => {
      console.error("Failed to send booking_confirmed email:", err);
    });
  }

  /**
   * Send payment successful email
   */
  async sendPaymentSuccessful(
    email: string,
    name: string,
    bookingReference: string,
    amount: number,
    currency: string,
    paymentReference: string,
    options?: { userId?: string; bookingId?: string }
  ): Promise<void> {
    this.sendTemplateEmail("payment_successful", email, {
      name,
      bookingReference,
      amountPaid: amount.toLocaleString(),
      currency,
      paymentReference,
      paymentDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    }, options).catch((err) => {
      console.error("Failed to send payment_successful email:", err);
    });
  }

  /**
   * Send booking cancellation email
   */
  async sendBookingCancellation(
    email: string,
    name: string,
    bookingReference: string,
    reason: string,
    options?: { userId?: string; bookingId?: string; refundInfo?: string }
  ): Promise<void> {
    this.sendTemplateEmail("booking_cancelled", email, {
      name,
      bookingReference,
      cancellationDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      cancellationReason: reason,
      refundInfo: options?.refundInfo || "If a refund is applicable, it will be processed within 5\u201310 business days to your original payment method.",
    }, options).catch((err) => {
      console.error("Failed to send booking_cancelled email:", err);
    });
  }

  /**
   * Send booking completion email
   */
  async sendBookingCompletion(
    email: string,
    name: string,
    bookingReference: string,
    invoiceNumber: string,
    totalAmount: number,
    currency: string,
    invoiceUrl: string,
    options?: { userId?: string; bookingId?: string }
  ): Promise<void> {
    this.sendTemplateEmail("booking_completed_with_invoice", email, {
      name,
      bookingReference,
      invoiceNumber,
      totalAmount: totalAmount.toLocaleString(),
      currency,
      invoiceUrl,
    }, options).catch((err) => {
      console.error("Failed to send booking_completed_with_invoice email:", err);
    });
  }
}

export const emailService = new EmailService();
