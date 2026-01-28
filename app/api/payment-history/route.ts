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

    // Validate and fetch data BEFORE transaction to reduce transaction time
    let validationData: any = null;
    
    if (saleId) {
      const sale = await prisma.sale.findUnique({
        where: { id: saleId },
        select: {
          id: true,
          dueAmount: true,
          paidAmount: true,
          customerId: true,
          customer: {
            select: {
              id: true,
              balance: true,
            },
          },
        },
      });

      if (!sale) {
        throw new Error('Sale not found');
      }

      if (amount > sale.dueAmount) {
        throw new Error(`Payment amount cannot exceed due amount of Rs. ${sale.dueAmount}`);
      }

      validationData = sale;
    } else if (purchaseId) {
      const purchase = await prisma.purchase.findUnique({
        where: { id: purchaseId },
        select: {
          id: true,
          dueAmount: true,
          paidAmount: true,
          vendorId: true,
          vendor: {
            select: {
              id: true,
              balance: true,
            },
          },
        },
      });

      if (!purchase) {
        throw new Error('Purchase not found');
      }

      if (amount > purchase.dueAmount) {
        throw new Error(`Payment amount cannot exceed due amount of Rs. ${purchase.dueAmount}`);
      }

      validationData = purchase;
    }

    // Use transaction with increased timeout for data consistency
    const result = await prisma.$transaction(async (tx) => {
      if (saleId) {
        const balanceBefore = validationData.dueAmount;
        const newPaidAmount = validationData.paidAmount + amount;
        const newDueAmount = validationData.dueAmount - amount;
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
        if (validationData.customerId && validationData.customer) {
          await tx.customer.update({
            where: { id: validationData.customerId },
            data: {
              balance: {
                decrement: amount, // Use atomic decrement
              },
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
        const balanceBefore = validationData.dueAmount;
        const newPaidAmount = validationData.paidAmount + amount;
        const newDueAmount = validationData.dueAmount - amount;
        const balanceAfter = newDueAmount;

        // Update purchase
        const updatedPurchase = await tx.purchase.update({
          where: { id: purchaseId },
          data: {
            paidAmount: newPaidAmount,
            dueAmount: newDueAmount,
          },
        });

        // Update vendor balance using atomic decrement
        await tx.vendor.update({
          where: { id: validationData.vendorId },
          data: {
            balance: {
              decrement: amount, // Use atomic decrement
            },
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
    }, {
      maxWait: 10000, // Maximum time to wait for transaction to start (10 seconds)
      timeout: 20000, // Maximum time for transaction to complete (20 seconds)
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

