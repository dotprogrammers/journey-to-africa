"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import {
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  DollarSign,
  CircleCheckBig,
  XCircle,
  CalendarCheck,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

interface Booking {
  id: string;
  bookingReference: string;
  status: string;
  numberOfTravelers: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
  pricingTier: {
    name: string;
    price: number;
    currency: string;
  };
  travelers: Array<{ id: string }>;
  payments: Array<{ status: string }>;
}

export default function BookingsPage() {
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status && status !== "all") params.set("status", status);
      if (search) params.set("search", search);
      params.set("page", pagination.page.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/admin/bookings?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.data);
        setPagination((prev) => ({
          ...prev,
          totalPages: data.pagination?.totalPages || 1,
          total: data.pagination?.total || 0,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoading(false);
    }
  }, [status, search, pagination.page]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Booking ${newStatus} successfully`);
        fetchBookings();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update booking");
      }
    } catch {
      toast.error("Failed to update booking");
    }
  };

  const getAvailableActions = (booking: Booking) => {
    const actions: Array<{ label: string; status: string; icon: React.ReactNode; variant?: "destructive" }> = [];
    switch (booking.status) {
      case "pending":
        actions.push({ label: "Confirm", status: "confirmed", icon: <CheckCircle2 className="size-4" /> });
        actions.push({ label: "Cancel", status: "cancelled", icon: <XCircle className="size-4" />, variant: "destructive" });
        break;
      case "confirmed":
        actions.push({ label: "Mark Paid", status: "paid", icon: <DollarSign className="size-4" /> });
        actions.push({ label: "Cancel", status: "cancelled", icon: <XCircle className="size-4" />, variant: "destructive" });
        break;
      case "paid":
        actions.push({ label: "Complete", status: "completed", icon: <CircleCheckBig className="size-4" /> });
        actions.push({ label: "Cancel", status: "cancelled", icon: <XCircle className="size-4" />, variant: "destructive" });
        break;
    }
    return actions;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">Manage all booking requests</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchBookings}>
          <RefreshCw className="size-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference, name, or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="size-5" />
                All Bookings
              </CardTitle>
              <CardDescription>{pagination.total} total bookings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarCheck className="size-10 mx-auto mb-2 opacity-50" />
              <p>No bookings found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Guest Name</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead className="hidden sm:table-cell">Travelers</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="font-mono text-sm text-primary hover:underline"
                          >
                            {booking.bookingReference}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">
                          {booking.user.name}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                          {booking.user.email}
                        </TableCell>
                        <TableCell className="text-sm">{booking.pricingTier.name}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {booking.numberOfTravelers}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${booking.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={booking.status as "pending" | "confirmed" | "paid" | "completed" | "cancelled"} />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                          {format(new Date(booking.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/bookings/${booking.id}`}>
                                  <Eye className="mr-2 size-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {getAvailableActions(booking).map((action) => (
                                <DropdownMenuItem
                                  key={action.status}
                                  variant={action.variant}
                                  onClick={() => handleStatusChange(booking.id, action.status)}
                                >
                                  {action.icon}
                                  {action.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                      }
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
