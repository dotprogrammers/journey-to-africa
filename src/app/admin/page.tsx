"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { StatsCard } from "@/components/admin/stats-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, Clock, DollarSign, Tag, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface DashboardStats {
  totalBookings: number;
  bookingsByStatus: Record<string, number>;
  totalRevenue: number;
  totalTravelers: number;
  pricingTierStats: Array<{
    id: string;
    name: string;
    maxCapacity: number;
    currentBookings: number;
    price: number;
  }>;
  upcomingTrips: Array<{
    id: string;
    bookingReference: string;
    user: { name: string; email: string };
    pricingTier: { name: string; price: number };
    status: string;
    numberOfTravelers: number;
    totalAmount: number;
    createdAt: string;
  }>;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-sky-500",
  paid: "bg-emerald-500",
  completed: "bg-violet-500",
  cancelled: "bg-red-500",
};

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data.data);
        } else {
          console.error("Failed to fetch stats");
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const totalBookings = stats?.totalBookings || 0;
  const bookingsByStatus = stats?.bookingsByStatus || {};
  const totalRevenue = stats?.totalRevenue || 0;
  const activeTiers = stats?.pricingTierStats?.length || 0;
  const upcomingTrips = stats?.upcomingTrips || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name || "Admin"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatsCard
              title="Total Bookings"
              value={totalBookings}
              icon={CalendarCheck}
              color="green"
            />
            <StatsCard
              title="Pending Bookings"
              value={bookingsByStatus.pending || 0}
              icon={Clock}
              color="yellow"
              subtitle="Awaiting confirmation"
            />
            <StatsCard
              title="Total Revenue"
              value={`$${totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              color="blue"
            />
            <StatsCard
              title="Active Tiers"
              value={activeTiers}
              icon={Tag}
              color="purple"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Bookings Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>Latest booking activity</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/bookings">
                  View All <ArrowRight className="size-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : upcomingTrips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarCheck className="size-10 mx-auto mb-2 opacity-50" />
                <p>No bookings yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingTrips.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-sm">
                        {booking.bookingReference}
                      </TableCell>
                      <TableCell>{booking.user.name}</TableCell>
                      <TableCell>{booking.pricingTier.name}</TableCell>
                      <TableCell>
                        <StatusBadge status={booking.status as "pending" | "confirmed" | "paid" | "completed" | "cancelled"} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(booking.createdAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Booking Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : totalBookings === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No booking data yet
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(bookingsByStatus)
                  .filter(([, count]) => count > 0)
                  .map(([status, count]) => {
                    const percentage = totalBookings > 0 ? (count / totalBookings) * 100 : 0;
                    return (
                      <div key={status} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize">{status}</span>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${statusColors[status] || "bg-slate-500"}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-6 pt-4 border-t space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-3">Quick Actions</p>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/admin/bookings?status=pending">
                  <CheckCircle2 className="size-4 mr-2" />
                  Confirm Next Pending
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/admin/bookings">
                  <ArrowRight className="size-4 mr-2" />
                  View All Bookings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
