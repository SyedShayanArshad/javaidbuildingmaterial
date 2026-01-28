import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, isErrorResponse } from '@/lib/api-auth';


// Get payment history for a specific transaction
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const saleId = searchParams.get('saleId');
    const purchaseId = searchParams.get('purchaseId');

    if (!saleId && !purchaseId) {
      return NextResponse.json(
        { error: 'Either saleId or purchaseId is required' },
        { status: 400 }
      );
    }

    const where: any = {};
    if (saleId) where.saleId = saleId;
    if (purchaseId) where.purchaseId = purchaseId;

    const history = await prisma.paymentHistory.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}

// Add payment to a transaction
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;

  try {
    const body = await request.json();
    const { saleId, purchaseId, amount, paymentMode, paymentDate, notes } = body;

    if (!saleId && !purchaseId) {
      return NextResponse.json(
        { error: 'Either saleId or purchaseId is required' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid payment amount is required' },
        { status: 400 }
      );
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      if (saleId) {
        // Handle sale payment
        const sale = await tx.sale.findUnique({
          where: { id: saleId },
          include: { customer: true },
        });

        if (!sale) {
          throw new Error('Sale not found');
        }

        if (amount > sale.dueAmount) {
          throw new Error(`Payment amount cannot exceed due amount of Rs. ${sale.dueAmount}`);
        }

        const balanceBefore = sale.dueAmount;
        const newPaidAmount = sale.paidAmount + amount;
        const newDueAmount = sale.dueAmount - amount;
        const balanceAfter = newDueAmount;

        // Update sale
        const updatedSale = await tx.sale.update({
          where: { id: saleId },
          data: {
            paidAmount: newPaidAmount,
            dueAmount: newDueAmount,
          },
        });

        // Update customer balance only if customerId is not null
        if (sale.customerId && sale.customer) {
          await tx.customer.update({
            where: { id: sale.customerId },
            data: {
              balance: sale.customer.balance - amount,
            },
          });
        }

        // Create payment history record
        const paymentHistory = await tx.paymentHistory.create({
          data: {
            saleId,
            amount,
            paymentMode: paymentMode || 'CASH',
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            notes,
            balanceBefore,
            balanceAfter,
            createdBy: authResult.user.id,
          },
        });

        return { sale: updatedSale, paymentHistory };
      } else if (purchaseId) {
        // Handle purchase payment
        const purchase = await tx.purchase.findUnique({
          where: { id: purchaseId },
          include: { vendor: true },
        });

        if (!purchase) {
          throw new Error('Purchase not found');
        }

        if (amount > purchase.dueAmount) {
          throw new Error(`Payment amount cannot exceed due amount of Rs. ${purchase.dueAmount}`);
        }

        const balanceBefore = purchase.dueAmount;
        const newPaidAmount = purchase.paidAmount + amount;
        const newDueAmount = purchase.dueAmount - amount;
        const balanceAfter = newDueAmount;

        // Update purchase
        const updatedPurchase = await tx.purchase.update({
          where: { id: purchaseId },
          data: {
            paidAmount: newPaidAmount,
            dueAmount: newDueAmount,
          },
        });

        // Update vendor balance
        await tx.vendor.update({
          where: { id: purchase.vendorId },
          data: {
            balance: purchase.vendor.balance - amount,
          },
        });

        // Create payment history record
        const paymentHistory = await tx.paymentHistory.create({
          data: {
            purchaseId,
            amount,
            paymentMode: ['CASH', 'BANK', 'ONLINE'].includes(paymentMode) ? paymentMode : 'CASH',
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            notes,
            balanceBefore,
            balanceAfter,
            createdBy: authResult.user.id,
          },
        });

        return { purchase: updatedPurchase, paymentHistory };
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record payment' },
      { status: 500 }
    );
  }
}
