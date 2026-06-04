import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

/**
 * GET /api/admin/stats - Dashboard statistics
 */
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      );
    }

    // Get total bookings by status
    const bookingsByStatus = await db.booking.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    const totalBookings = await db.booking.count();

    // Calculate total revenue from successful payments
    const successfulPayments = await db.payment.findMany({
      where: { status: "success" },
      select: { amount: true, currency: true },
    });

    const totalRevenue = successfulPayments.reduce(
      (sum: number, payment: { amount: number | null; currency: string }) => sum + (payment.amount || 0),
      0
    );

    // Get recent bookings count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBookings = await db.booking.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get upcoming trips (confirmed bookings)
    const upcomingTrips = await db.booking.findMany({
      where: {
        status: { in: ["confirmed", "paid"] },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        pricingTier: {
          select: {
            name: true,
            price: true,
            currency: true,
          },
        },
        travelers: true,
      },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    // Total travelers across confirmed/paid bookings
    const totalTravelersResult = await db.booking.aggregate({
      where: {
        status: { in: ["confirmed", "paid"] },
      },
      _sum: {
        numberOfTravelers: true,
      },
    });

    // Get pricing tier stats
    const pricingTierStats = await db.pricingTier.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        maxCapacity: true,
        currentBookings: true,
        price: true,
        currency: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    // Format bookings by status
    const statusCounts: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      paid: 0,
      completed: 0,
      cancelled: 0,
      refunded: 0,
    };

    bookingsByStatus.forEach((item) => {
      statusCounts[item.status] = item._count.id;
    });

    return NextResponse.json({
      success: true,
      data: {
        totalBookings,
        bookingsByStatus: statusCounts,
        totalRevenue,
        revenueCurrency: "USD",
        recentBookings,
        totalTravelers: totalTravelersResult._sum.numberOfTravelers || 0,
        upcomingTrips,
        pricingTierStats,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
