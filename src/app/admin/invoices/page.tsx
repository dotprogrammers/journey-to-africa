"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { gooeyToast } from "@/components/admin/gooey-toast";
import { FileText, Download, Send, MoreHorizontal, RefreshCw, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  currency: string;
  billingName: string;
  billingEmail: string;
  issuedAt: string | null;
  dueAt: string | null;
  createdAt: string;
  booking: {
    bookingReference: string;
  };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status && status !== "all") params.set("status", status);

      const res = await fetch(`/api/admin/invoices?${params}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleDownload = (invoiceId: string) => {
    window.open(`/api/invoices/${invoiceId}?download=true`, "_blank");
  };

  const handleResend = async (invoice: Invoice) => {
    setResendingId(invoice.id);
    try {
      const res = await fetch(`/api/admin/invoices/resend?id=${invoice.id}`, {
        method: "POST",
      });

      if (res.ok) {
        gooeyToast.success(`Invoice ${invoice.invoiceNumber} resent to ${invoice.billingEmail}`);
      } else {
        const data = await res.json();
        gooeyToast.error(data.error || "Failed to resend invoice");
      }
    } catch {
      gooeyToast.error("Failed to resend invoice");
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Manage and download invoices</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInvoices} disabled={refreshing}>
          {refreshing ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="size-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-45">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Invoices</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="void">Void</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            All Invoices
          </CardTitle>
          <CardDescription>{invoices.length} total invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="size-10 mx-auto mb-2 opacity-50" />
              <p>No invoices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead>Billed To</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="hidden md:table-cell">Issued</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/bookings/${invoice.booking?.bookingReference}`}
                          className="text-primary hover:underline"
                        >
                          {invoice.booking?.bookingReference || "N/A"}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{invoice.billingName}</p>
                          <p className="text-xs text-muted-foreground">{invoice.billingEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${invoice.totalAmount.toLocaleString()} {invoice.currency}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {invoice.issuedAt
                          ? format(new Date(invoice.issuedAt), "MMM d, yyyy")
                          : "Not issued"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownload(invoice.id)}>
                              <Download className="mr-2 size-4" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleResend(invoice)}
                              disabled={resendingId === invoice.id}
                            >
                              {resendingId === invoice.id ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                              ) : (
                                <Send className="mr-2 size-4" />
                              )}
                              {resendingId === invoice.id ? "Sending..." : "Resend Email"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
