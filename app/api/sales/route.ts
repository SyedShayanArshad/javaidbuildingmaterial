import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;

  try {
    const sales = await prisma.sale.findMany({
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        saleDate: "desc",
      },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;

  try {
    const body = await request.json();
    const { customerId, saleDate, receivedAmount, paymentMode, notes, items, isWalkIn, walkInCustomerName, additionalCharges, chargesDescription } = body;

    // Validation
    if (!isWalkIn && !customerId) {
      return NextResponse.json(
        { error: "Customer is required for non-walk-in sales" },
        { status: 400 },
      );
    }

    if (isWalkIn && (!walkInCustomerName || walkInCustomerName.trim() === '')) {
      return NextResponse.json(
        { error: "Walk-in customer name is required" },
        { status: 400 },
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 },
      );
    }

    // Calculate subtotal from items
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.rate,
      0,
    );
    const charges = parseFloat(additionalCharges) || 0;
    const totalAmount = subtotal + charges;
    const received = parseFloat(receivedAmount) || 0;
    const due = totalAmount - received;

    // Walk-in validation
    if (isWalkIn && due > 0) {
      return NextResponse.json(
        { error: "Walk-in customers must pay the full amount. No balance is allowed." },
        { status: 400 },
      );
    }

    // 🚀 OPTIMIZED TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Fetch all products at once
      const productIds = items.map((item: any) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(products.map(p => [p.id, p]));

      // 2️⃣ Validate stock for all items
      for (const item of items) {
        const product = productMap.get(item.productId);
        
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const currentStock = parseFloat(product.stockQuantity.toString());
        if (currentStock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available: ${currentStock}, Required: ${item.quantity}`,
          );
        }
      }

      // 3️⃣ Generate invoice and create sale
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const sale = await tx.sale.create({
        data: {
          customerId: isWalkIn ? null : customerId,
          invoiceNumber,
          saleDate: new Date(saleDate),
          subtotal,
          additionalCharges: charges,
          chargesDescription: chargesDescription || null,
          totalAmount,
          paidAmount: received,
          dueAmount: due,
          notes,
          isWalkIn: isWalkIn || false,
          walkInCustomerName: isWalkIn ? walkInCustomerName : null,
        },
      });

      // 4️⃣ Batch operations for products
      await Promise.all([
        // Update all products
        ...items.map((item: any) =>
          tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { decrement: item.quantity }, // ✅ Atomic decrement
            },
          })
        ),

        // Create sale items in bulk
        tx.saleItem.createMany({
          data: items.map((item: any) => ({
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.rate,
            totalPrice: item.quantity * item.rate,
          })),
        }),

        // Create stock movements in bulk
        tx.stockMovement.createMany({
          data: items.map((item: any) => {
            const product = productMap.get(item.productId)!;
            const currentStock = parseFloat(product.stockQuantity.toString());
            return {
              productId: item.productId,
              movementType: "SALE",
              quantity: item.quantity,
              balanceBefore: currentStock,
              balanceAfter: currentStock - item.quantity,
              referenceType: "SALE",
              referenceId: sale.id,
              notes: `Sale ${sale.invoiceNumber}`,
            };
          }),
        }),
      ]);

      // 5️⃣ Handle customer balance and payment (registered customers only)
      if (!isWalkIn && customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: customerId },
        });

        if (customer) {
          const currentBalance = parseFloat(customer.balance.toString());
          const newBalance = currentBalance + due;

          // Update customer balance
          await tx.customer.update({
            where: { id: customerId },
            data: { balance: newBalance },
          });

          // Create transaction and payment history if payment received
          if (received > 0) {
            await Promise.all([
              tx.transaction.create({
                data: {
                  transactionType: "RECEIPT",
                  customerId: customerId,
                  saleId: sale.id,
                  amount: received,
                  balanceBefore: newBalance, // ✅ After adding due
                  balanceAfter: newBalance, // ✅ Same (payment already deducted in due calculation)
                  description: `Payment for Sale ${sale.invoiceNumber}`,
                  transactionDate: new Date(saleDate),
                },
              }),
              tx.paymentHistory.create({
                data: {
                  saleId: sale.id,
                  amount: received,
                  paymentMode: ['CASH', 'BANK', 'ONLINE'].includes(paymentMode) ? paymentMode : 'CASH',
                  paymentDate: saleDate ? new Date(saleDate) : new Date(),
                  notes,
                  balanceBefore: totalAmount,
                  balanceAfter: due,
                  createdBy: authResult.user.id,
                },
              }),
            ]);
          }
        }
      }

      // 6️⃣ Handle walk-in payment history
      if (received > 0 && isWalkIn) {
        await tx.paymentHistory.create({
          data: {
            saleId: sale.id,
            amount: received,
            paymentMode: ['CASH', 'BANK', 'ONLINE'].includes(paymentMode) ? paymentMode : 'CASH',
            paymentDate: saleDate ? new Date(saleDate) : new Date(),
            notes,
            balanceBefore: totalAmount,
            balanceAfter: 0,
            createdBy: authResult.user.id,
          },
        });
      }

      return sale;
    }, {
      timeout: 20000, // 20 second timeout
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create sale" },
      { status: 500 },
    );
  }
}