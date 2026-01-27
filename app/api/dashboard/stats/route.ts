import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, isErrorResponse } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all stats in parallel
    const [
      totalProducts,
      lowStockProducts,
      totalVendors,
      totalCustomers,
      vendorBalanceResult,
      customerBalanceResult,
      todaySalesResult,
      todayPurchasesResult,
    ] = await Promise.all([
      // Total active products
      prisma.product.count({
        where: { isActive: true },
      }),

      // Low stock products
      prisma.product.count({
        where: {
          isActive: true,
          stockQuantity: {
            lt: prisma.product.fields.minimumStockLevel,
          },
        },
      }),

      // Total active vendors
      prisma.vendor.count({
        where: { isActive: true },
      }),

      // Total active customers
      prisma.customer.count({
        where: { isActive: true },
      }),

      // Total vendor payables
      prisma.vendor.aggregate({
        _sum: {
          balance: true,
        },
        where: { isActive: true },
      }),

      // Total customer receivables
      prisma.customer.aggregate({
        _sum: {
          balance: true,
        },
        where: { isActive: true },
      }),

      // Today's sales
      prisma.sale.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          saleDate: {
            gte: today,
          },
        },
      }),

      // Today's purchases
      prisma.purchase.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          purchaseDate: {
            gte: today,
          },
        },
      }),
    ]);

    const stats = {
      totalProducts,
      lowStockProducts,
      totalVendors,
      totalCustomers,
      vendorBalance: Number(vendorBalanceResult._sum.balance || 0),
      customerBalance: Number(customerBalanceResult._sum.balance || 0),
      todaySales: Number(todaySalesResult._sum.totalAmount || 0),
      todayPurchases: Number(todayPurchasesResult._sum.totalAmount || 0),
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
