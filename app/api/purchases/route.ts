import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;

  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        vendor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        purchaseDate: "desc",
      },
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchases" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;

  try {
    const body = await request.json();
    const { vendorId, purchaseDate, paidAmount, paymentMode, notes, items } =
      body;

    if (!vendorId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Vendor and at least one item are required" },
        { status: 400 },
      );
    }

    // Calculate total
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.rate,
      0,
    );
    const paid = parseFloat(paidAmount) || 0;
    const due = totalAmount - paid;

    // Transaction to ensure atomic updates
    // Transaction to ensure atomic updates
    const result = await prisma.$transaction(async (tx) => {
  // 1. Fetch vendor
  const vendor = await tx.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw new Error(`Vendor not found: ${vendorId}`);

  // 2. Create purchase
  const invoiceNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const purchase = await tx.purchase.create({
    data: {
      vendorId,
      invoiceNumber,
      purchaseDate: new Date(purchaseDate),
      totalAmount,
      paidAmount: paid,
      dueAmount: due,
      notes,
    },
  });

  // 3. Fetch all products at once
  const productIds = items.map((item: any) => item.productId);
  const products = await tx.product.findMany({
    where: { id: { in: productIds } },
  });
  
  const productMap = new Map(products.map(p => [p.id, p]));
  
  // Validate
  for (const item of items) {
    if (!productMap.has(item.productId)) {
      throw new Error(`Product not found: ${item.productId}`);
    }
  }

  // 4. Batch operations
  await Promise.all([
    // Update products
    ...items.map((item: any) => 
      tx.product.update({
        where: { id: item.productId },
        data: { 
          stockQuantity: { 
            increment: item.quantity // Use atomic increment
          } 
        },
      })
    ),
    
    // Create purchase items
    tx.purchaseItem.createMany({
      data: items.map((item: any) => ({
        purchaseId: purchase.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.rate,
        totalPrice: item.quantity * item.rate,
      })),
    }),
    
    // Create stock movements
    tx.stockMovement.createMany({
      data: items.map((item: any) => {
        const product = productMap.get(item.productId)!;
        return {
          productId: item.productId,
          movementType: "PURCHASE",
          quantity: item.quantity,
          balanceBefore: product.stockQuantity,
          balanceAfter: product.stockQuantity + item.quantity,
          referenceType: "PURCHASE",
          referenceId: purchase.id,
          notes: `Purchase ${purchase.invoiceNumber}`,
        };
      }),
    }),
  ]);

  // 5. Update vendor balance
  const currentBalance = Number(vendor.balance);
  await tx.vendor.update({
    where: { id: vendorId },
    data: { balance: currentBalance + due },
  });

  // 6. Handle payment
  if (paid > 0) {
    await Promise.all([
      tx.transaction.create({
        data: {
          transactionType: "PAYMENT",
          vendorId,
          purchaseId: purchase.id,
          amount: paid,
          balanceBefore: currentBalance + due,
          balanceAfter: currentBalance + due,
          description: `Payment for Purchase ${purchase.invoiceNumber}`,
          transactionDate: new Date(purchaseDate),
        },
      }),
      tx.paymentHistory.create({
        data: {
          purchaseId: purchase.id,
          amount: paid,
          paymentMode: paymentMode === "BANK" ? "BANK" : paymentMode === "ONLINE" ? "ONLINE" : "CASH",
          paymentDate: purchaseDate ? new Date(purchaseDate) : new Date(),
          notes,
          balanceBefore: currentBalance + due,
          balanceAfter: currentBalance + due,
          createdBy: authResult.user.id,
        },
      }),
    ]);
  }

  return purchase;
}, {
  timeout: 20000, // 20 second safety net
});

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create purchase" },
      { status: 500 },
    );
  }
}
