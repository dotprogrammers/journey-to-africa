import type { Booking, Payment, PricingTier, Invoice, AdminUser } from "@prisma/client";

// Booking status types
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type PaymentStatus = "pending" | "processing" | "success" | "failed" | "refunded";
export type InvoiceStatus = "draft" | "sent" | "paid" | "void";
export type AdminRole = "admin" | "editor";

// Booking with relations
export type BookingWithRelations = Booking & {
  tier: PricingTier;
  payments: Payment[];
  invoices: Invoice[];
};

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Create booking input
export interface CreateBookingInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  tierId: string;
  travelers: number;
  specialRequests?: string;
}

// Section item types for CMS
export interface SectionItemData {
  [key: string]: string | number | boolean | string[];
}

// Navigation item with children
export interface NavigationItemWithChildren {
  id: string;
  label: string;
  url: string;
  order: number;
  isActive: boolean;
  children: NavigationItemWithChildren[];
}

// Paystack webhook event
export interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at: string;
    channel: string;
    metadata: Record<string, unknown>;
    customer: {
      email: string;
      first_name: string;
      last_name: string;
    };
  };
}

// Admin session user
export interface AdminSessionUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}
