"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/admin/status-badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  CircleCheckBig,
  XCircle,
  Mail,
  User,
  MapPin,
  Phone,
  Users,
  CreditCard,
  FileText,
  Send,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface Traveler {
  id: string;
  isPrimary: boolean;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  nationality: string | null;
  dietaryRequirements: string | null;
  specialNeeds: string | null;
}

interface Payment {
  id: string;
  paystackReference: string | null;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface BookingDetail {
  id: string;
  bookingReference: string;
  status: string;
  numberOfTravelers: number;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  specialRequests: string | null;
  dietaryRequirements: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  passportNumber: string | null;
  nationality: string | null;
  confirmedAt: string | null;
  paidAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    country: string | null;
    city: string | null;
  };
  pricingTier: {
    id: string;
    name: string;
    price: number;
    currency: string;
  };
  travelers: Traveler[];
  payments: Payment[];
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    currency: string;
    issuedAt: string | null;
  }>;
  emailLogs: Array<{
    id: string;
    recipientEmail: string;
    subject: string;
    status: string;
    sentAt: string | null;
    createdAt: string;
  }>;
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/admin/bookings/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            setBooking(data.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch booking:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(newStatus);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Booking ${newStatus} successfully`);
        // Refresh data
        const refreshRes = await fetch(`/api/admin/bookings/${id}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.data) setBooking(refreshData.data);
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update booking");
      }
    } catch {
      toast.error("Failed to update booking");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Booking not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/bookings">Back to Bookings</Link>
        </Button>
      </div>
    );
  }

  const statusActions = (() => {
    switch (booking.status) {
      case "pending":
        return [
          { label: "Confirm Booking", status: "confirmed", icon: CheckCircle2, color: "default" as const },
          { label: "Cancel Booking", status: "cancelled", icon: XCircle, color: "destructive" as const },
        ];
      case "confirmed":
        return [
          { label: "Mark as Paid", status: "paid", icon: DollarSign, color: "default" as const },
          { label: "Cancel Booking", status: "cancelled", icon: XCircle, color: "destructive" as const },
        ];
      case "paid":
        return [
          { label: "Complete Booking", status: "completed", icon: CircleCheckBig, color: "default" as const },
          { label: "Cancel Booking", status: "cancelled", icon: XCircle, color: "destructive" as const },
        ];
      default:
        return [];
    }
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/bookings">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Booking {booking.bookingReference}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={booking.status as "pending" | "confirmed" | "paid" | "completed" | "cancelled"} />
              <span className="text-sm text-muted-foreground">
                Created {format(new Date(booking.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusActions.map((action) => (
            <Button
              key={action.status}
              variant={action.color}
              size="sm"
              disabled={actionLoading === action.status}
              onClick={() => handleStatusChange(action.status)}
            >
              <action.icon className="size-4 mr-1" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5" />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Reference</p>
                  <p className="font-mono font-medium">{booking.bookingReference}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pricing Tier</p>
                  <p className="font-medium">{booking.pricingTier.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Travelers</p>
                  <p className="font-medium">{booking.numberOfTravelers}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-xl font-bold">${booking.totalAmount.toLocaleString()} {booking.currency}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <p>${booking.subtotal.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Discount</p>
                  <p>${booking.discountAmount.toLocaleString()}</p>
                </div>
                {booking.confirmedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Confirmed</p>
                    <p>{format(new Date(booking.confirmedAt), "MMM d, yyyy")}</p>
                  </div>
                )}
                {booking.paidAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Paid</p>
                    <p>{format(new Date(booking.paidAt), "MMM d, yyyy")}</p>
                  </div>
                )}
                {booking.completedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p>{format(new Date(booking.completedAt), "MMM d, yyyy")}</p>
                  </div>
                )}
                {booking.cancelledAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cancelled</p>
                    <p>{format(new Date(booking.cancelledAt), "MMM d, yyyy")}</p>
                  </div>
                )}
              </div>

              {booking.specialRequests && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Special Requests</p>
                  <p className="text-sm mt-1">{booking.specialRequests}</p>
                </div>
              )}
              {booking.dietaryRequirements && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">Dietary Requirements</p>
                  <p className="text-sm mt-1">{booking.dietaryRequirements}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Travelers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" />
                Travelers ({booking.travelers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {booking.travelers.length === 0 ? (
                <p className="text-muted-foreground text-sm">No traveler details recorded</p>
              ) : (
                <div className="space-y-3">
                  {booking.travelers.map((traveler, i) => (
                    <div
                      key={traveler.id}
                      className="flex items-start gap-3 p-3 rounded-lg border"
                    >
                      <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {traveler.firstName} {traveler.lastName}
                          </p>
                          {traveler.isPrimary && (
                            <Badge variant="secondary" className="text-xs">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {traveler.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="size-3" /> {traveler.email}
                            </span>
                          )}
                          {traveler.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="size-3" /> {traveler.phone}
                            </span>
                          )}
                          {traveler.nationality && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3" /> {traveler.nationality}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="size-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {booking.payments.length === 0 ? (
                <p className="text-muted-foreground text-sm">No payments recorded</p>
              ) : (
                <div className="space-y-3">
                  {booking.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">${payment.amount.toLocaleString()} {payment.currency}</p>
                        {payment.paystackReference && (
                          <p className="text-xs text-muted-foreground font-mono">
                            Ref: {payment.paystackReference}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <StatusBadge status={payment.status as "initialized" | "pending" | "success" | "failed"} />
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(payment.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Guest Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" />
                Guest Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{booking.user.name}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4" />
                  {booking.user.email}
                </div>
                {booking.user.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-4" />
                    {booking.user.phone}
                  </div>
                )}
                {booking.user.country && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="size-4" />
                    {booking.user.city && `${booking.user.city}, `}
                    {booking.user.country}
                  </div>
                )}
              </div>

              {(booking.emergencyContactName || booking.emergencyContactPhone) && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1">Emergency Contact</p>
                    {booking.emergencyContactName && (
                      <p className="text-sm text-muted-foreground">{booking.emergencyContactName}</p>
                    )}
                    {booking.emergencyContactPhone && (
                      <p className="text-sm text-muted-foreground">{booking.emergencyContactPhone}</p>
                    )}
                  </div>
                </>
              )}

              {(booking.passportNumber || booking.nationality) && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1">Travel Documents</p>
                    {booking.passportNumber && (
                      <p className="text-sm text-muted-foreground">
                        Passport: {booking.passportNumber}
                      </p>
                    )}
                    {booking.nationality && (
                      <p className="text-sm text-muted-foreground">
                        Nationality: {booking.nationality}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5" />
                Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {booking.invoices.length === 0 ? (
                <p className="text-muted-foreground text-sm">No invoices generated yet</p>
              ) : (
                <div className="space-y-2">
                  {booking.invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <p className="text-sm font-mono">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          ${invoice.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/api/invoices/${invoice.id}?download=true`} target="_blank">
                          <Send className="size-3.5 mr-1" />
                          Download
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="size-5" />
                Email History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {booking.emailLogs?.length === 0 ? (
                <p className="text-muted-foreground text-sm">No emails sent</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(booking.emailLogs || []).map((log) => (
                    <div key={log.id} className="p-2 rounded border">
                      <p className="text-sm font-medium truncate">{log.subject}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={log.status as "sent" | "failed" | "queued"} />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
