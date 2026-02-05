import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

/* -------------------- Utils -------------------- */

function buildDateFilter(startDate?: string | null, endDate?: string | null) {
  const filter: any = {};
  if (startDate) filter.gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.lte = end;
  }
  return Object.keys(filter).length ? filter : undefined;
}

/* -------------------- API -------------------- */

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter = buildDateFilter(startDate, endDate);

    switch (type) {
      case "profit-loss":
        return profitLoss(dateFilter);

      case "product-profit":
        return productProfit(dateFilter);

      case "sales-by-customer":
        return salesByCustomer(dateFilter);

      case "purchase-by-vendor":
        return purchaseByVendor(dateFilter);

      case "sales-vs-purchase":
        return salesVsPurchase(dateFilter);

      case "top-products":
        return topProducts(dateFilter);

      case "top-customers":
        return topCustomers(dateFilter);

      case "stock-value":
        return stockValue();

      case "sales-details-by-customer": {
        const customerId = searchParams.get("customerId");
        if (!customerId) {
          return NextResponse.json(
            { error: "customerId required" },
            { status: 400 },
          );
        }
        return salesDetailsByCustomer(customerId, dateFilter);
      }

      case "purchase-details-by-vendor": {
        const vendorId = searchParams.get("vendorId");
        if (!vendorId) {
          return NextResponse.json(
            { error: "vendorId required" },
            { status: 400 },
          );
        }
        return purchaseDetailsByVendor(vendorId, dateFilter);
      }

      // ✅ NEW: Walk-in Sales Report
      case "walk-in-sales":
        return walkInSales(dateFilter);

      // ✅ NEW: Sales Comparison (Walk-in vs Registered)
      case "sales-comparison":
        return salesComparison(dateFilter);

      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 },
        );
    }
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: "Report failed", details: e.message },
      { status: 500 },
    );
  }
}

/* ======================================================
   PROFIT & LOSS (COGS BASED – SCHEMA SAFE)
====================================================== */

async function profitLoss(dateFilter?: any) {
  const saleItems = await prisma.saleItem.findMany({
    where: dateFilter ? { sale: { saleDate: dateFilter } } : {},
    select: {
      quantity: true,
      totalPrice: true,
      productId: true,
      saleId: true,
    },
  });

  const purchaseItems = await prisma.purchaseItem.findMany({
    select: { productId: true, quantity: true, unitPrice: true },
  });

  const costMap: Record<string, { qty: number; total: number }> = {};

  for (const p of purchaseItems) {
    if (!costMap[p.productId]) costMap[p.productId] = { qty: 0, total: 0 };
    costMap[p.productId].qty += p.quantity;
    costMap[p.productId].total += p.quantity * p.unitPrice;
  }

  let revenue = 0;
  let cost = 0;

  for (const s of saleItems) {
    revenue += s.totalPrice;
    const avgCost = costMap[s.productId]?.qty
      ? costMap[s.productId].total / costMap[s.productId].qty
      : 0;
    cost += s.quantity * avgCost;
  }

  const profit = revenue - cost;

  return NextResponse.json({
    totalRevenue: revenue,
    totalCost: cost,
    totalProfit: profit,
    profitMargin: revenue ? ((profit / revenue) * 100).toFixed(1) : "0.0",
    salesCount: new Set(saleItems.map((s) => s.saleId)).size,
  });
}

/* ======================================================
   PRODUCT PROFIT
====================================================== */

async function productProfit(dateFilter?: any) {
  const saleItems = await prisma.saleItem.findMany({
    where: dateFilter ? { sale: { saleDate: dateFilter } } : {},
    include: { product: { select: { name: true, unit: true } } },
  });

  const purchaseItems = await prisma.purchaseItem.findMany();

  const costMap: any = {};
  purchaseItems.forEach((p) => {
    if (!costMap[p.productId]) costMap[p.productId] = { qty: 0, total: 0 };
    costMap[p.productId].qty += p.quantity;
    costMap[p.productId].total += p.quantity * p.unitPrice;
  });

  const stats: any = {};

  saleItems.forEach((s) => {
    if (!stats[s.productId]) {
      stats[s.productId] = {
        productId: s.productId,
        productName: s.product.name,
        unit: s.product.unit,
        quantitySold: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
      };
    }

    const avgCost = costMap[s.productId]?.qty
      ? costMap[s.productId].total / costMap[s.productId].qty
      : 0;

    stats[s.productId].quantitySold += s.quantity;
    stats[s.productId].revenue += s.totalPrice;
    stats[s.productId].cost += s.quantity * avgCost;
    stats[s.productId].profit =
      stats[s.productId].revenue - stats[s.productId].cost;
  });

  return NextResponse.json(
    Object.values(stats).sort((a: any, b: any) => b.profit - a.profit),
  );
}

/* ======================================================
   SALES BY CUSTOMER (NO N+1)
====================================================== */

async function salesByCustomer(dateFilter?: any) {
  const sales = await prisma.sale.groupBy({
    by: ["customerId"],
    where: {
      isWalkIn: false, // ✅ Exclude walk-in sales
      ...(dateFilter ? { saleDate: dateFilter } : {}),
    },
    _sum: { totalAmount: true, paidAmount: true, dueAmount: true },
    _count: { id: true },
  });

  const customerIds = sales
    .map((s) => s.customerId)
    .filter((id): id is string => id !== null);

  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, phone: true },
  });

  const map = Object.fromEntries(customers.map((c) => [c.id, c]));

  return NextResponse.json(
    sales
      .filter((s) => s.customerId !== null)
      .map((s) => ({
        customerId: s.customerId,
        customerName: map[s.customerId!]?.name || "Unknown",
        customerPhone: map[s.customerId!]?.phone || "",
        totalSales: s._sum.totalAmount || 0,
        totalPaid: s._sum.paidAmount || 0,
        totalDue: s._sum.dueAmount || 0,
        salesCount: s._count.id,
      })),
  );
}

/* ======================================================
   PURCHASE BY VENDOR
====================================================== */

async function purchaseByVendor(dateFilter?: any) {
  const purchases = await prisma.purchase.groupBy({
    by: ["vendorId"],
    where: dateFilter ? { purchaseDate: dateFilter } : {},
    _sum: { totalAmount: true, paidAmount: true, dueAmount: true },
    _count: { id: true },
  });

  const vendors = await prisma.vendor.findMany({
    select: { id: true, name: true, phone: true },
  });

  const map = Object.fromEntries(vendors.map((v) => [v.id, v]));

  return NextResponse.json(
    purchases.map((p) => ({
      vendorId: p.vendorId,
      vendorName: map[p.vendorId]?.name || "Unknown",
      vendorPhone: map[p.vendorId]?.phone || "",
      totalPurchases: p._sum.totalAmount || 0,
      totalPaid: p._sum.paidAmount || 0,
      totalDue: p._sum.dueAmount || 0,
      purchaseCount: p._count.id,
    })),
  );
}

/* ======================================================
   SALES VS PURCHASE (MONTHLY – FIXED)
====================================================== */

async function salesVsPurchase(dateFilter?: any) {
  const sales = await prisma.sale.findMany({
    where: dateFilter ? { saleDate: dateFilter } : {},
    select: { saleDate: true, totalAmount: true },
  });

  const purchases = await prisma.purchase.findMany({
    where: dateFilter ? { purchaseDate: dateFilter } : {},
    select: { purchaseDate: true, totalAmount: true },
  });

  const map: any = {};

  sales.forEach((s) => {
    const m = s.saleDate.toISOString().slice(0, 7);
    if (!map[m]) map[m] = { month: m, sales: 0, purchases: 0 };
    map[m].sales += s.totalAmount;
  });

  purchases.forEach((p) => {
    const m = p.purchaseDate.toISOString().slice(0, 7);
    if (!map[m]) map[m] = { month: m, sales: 0, purchases: 0 };
    map[m].purchases += p.totalAmount;
  });

  return NextResponse.json(
    Object.values(map).sort((a: any, b: any) => a.month.localeCompare(b.month)),
  );
}

/* ======================================================
   TOP PRODUCTS
====================================================== */

async function topProducts(dateFilter?: any) {
  const items = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: dateFilter ? { sale: { saleDate: dateFilter } } : {},
    _sum: { quantity: true, totalPrice: true },
    _count: { id: true },
    orderBy: { _sum: { totalPrice: "desc" } },
    take: 10,
  });

  const products = await prisma.product.findMany({
    select: { id: true, name: true, unit: true, stockQuantity: true },
  });

  const map = Object.fromEntries(products.map((p) => [p.id, p]));

  return NextResponse.json(
    items.map((i) => ({
      productId: i.productId,
      productName: map[i.productId]?.name || "Unknown",
      unit: map[i.productId]?.unit || "",
      quantitySold: i._sum.quantity || 0,
      revenue: i._sum.totalPrice || 0,
      currentStock: map[i.productId]?.stockQuantity || 0,
      transactionCount: i._count.id,
    })),
  );
}

/* ======================================================
   TOP CUSTOMERS
====================================================== */

async function topCustomers(dateFilter?: any) {
  const sales = await prisma.sale.groupBy({
    by: ["customerId"],
    where: {
      isWalkIn: false, // ✅ Exclude walk-in
      ...(dateFilter ? { saleDate: dateFilter } : {}),
    },
    _sum: { totalAmount: true },
    _count: { id: true },
    orderBy: { _sum: { totalAmount: "desc" } },
    take: 10,
  });

  const customerIds = sales
    .map((s) => s.customerId)
    .filter((id): id is string => id !== null);

  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, phone: true, balance: true },
  });

  const map = Object.fromEntries(customers.map((c) => [c.id, c]));

  return NextResponse.json(
    sales
      .filter((s) => s.customerId !== null)
      .map((s) => ({
        customerId: s.customerId,
        customerName: map[s.customerId!]?.name || "Unknown",
        phone: map[s.customerId!]?.phone || "",
        totalSales: s._sum.totalAmount || 0,
        salesCount: s._count.id,
        currentBalance: map[s.customerId!]?.balance || 0,
      })),
  );
}

/* ======================================================
   STOCK VALUE (SCHEMA SAFE)
====================================================== */

async function stockValue() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      unit: true,
      stockQuantity: true,
      minimumStockLevel: true,
    },
  });

  return NextResponse.json({
    products: products.map((p) => ({
      productId: p.id,
      productName: p.name,
      unit: p.unit,
      quantity: p.stockQuantity,
      isLowStock: p.stockQuantity <= p.minimumStockLevel,
    })),
  });
}

/* ======================================================
   SALES DETAILS BY CUSTOMER
====================================================== */
async function salesDetailsByCustomer(customerId: string, dateFilter?: any) {
  const sales = await prisma.sale.findMany({
    where: {
      customerId,
      ...(dateFilter ? { saleDate: dateFilter } : {}),
    },
    include: {
      items: {
        include: {
          product: { select: { name: true, unit: true } },
        },
      },
    },
    orderBy: { saleDate: "desc" },
  });

  return NextResponse.json(sales);
}

/* ======================================================
   PURCHASE DETAILS BY VENDOR
====================================================== */
async function purchaseDetailsByVendor(vendorId: string, dateFilter?: any) {
  const purchases = await prisma.purchase.findMany({
    where: {
      vendorId,
      ...(dateFilter ? { purchaseDate: dateFilter } : {}),
    },
    include: {
      items: {
        include: {
          product: { select: { name: true, unit: true } },
        },
      },
    },
    orderBy: { purchaseDate: "desc" },
  });

  return NextResponse.json(purchases);
}

/* ======================================================
   ✅ NEW: WALK-IN SALES REPORT
====================================================== */
async function walkInSales(dateFilter?: any) {
  const sales = await prisma.sale.findMany({
    where: {
      isWalkIn: true,
      ...(dateFilter ? { saleDate: dateFilter } : {}),
    },
    select: {
      id: true,
      invoiceNumber: true,
      walkInCustomerName: true,
      saleDate: true,
      totalAmount: true,
      paidAmount: true,
    },
    orderBy: {
      saleDate: "desc",
    },
  });

  const totalSales = sales.reduce((sum, s) => sum + parseFloat(s.totalAmount.toString()), 0);
  const totalPaid = sales.reduce((sum, s) => sum + parseFloat(s.paidAmount.toString()), 0);

  return NextResponse.json({
    sales,
    summary: {
      totalSales,
      totalPaid,
      salesCount: sales.length,
    },
  });
}

/* ======================================================
   ✅ NEW: SALES COMPARISON (Walk-in vs Registered)
====================================================== */
async function salesComparison(dateFilter?: any) {
  const [walkInSales, registeredSales] = await Promise.all([
    prisma.sale.findMany({
      where: {
        isWalkIn: true,
        ...(dateFilter ? { saleDate: dateFilter } : {}),
      },
      select: {
        totalAmount: true,
      },
    }),
    prisma.sale.findMany({
      where: {
        isWalkIn: false,
        ...(dateFilter ? { saleDate: dateFilter } : {}),
      },
      select: {
        totalAmount: true,
      },
    }),
  ]);

  const walkInTotal = walkInSales.reduce(
    (sum, s) => sum + parseFloat(s.totalAmount.toString()),
    0
  );
  const registeredTotal = registeredSales.reduce(
    (sum, s) => sum + parseFloat(s.totalAmount.toString()),
    0
  );

  return NextResponse.json({
    walkIn: {
      count: walkInSales.length,
      total: walkInTotal,
      average: walkInSales.length > 0 ? walkInTotal / walkInSales.length : 0,
    },
    registered: {
      count: registeredSales.length,
      total: registeredTotal,
      average: registeredSales.length > 0 ? registeredTotal / registeredSales.length : 0,
    },
  });
}