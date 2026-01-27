import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, isErrorResponse } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;
  
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        vendor: {
          select: {
            name: true,
          },
        },
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;
  
  try {
    const body = await request.json();
    const { partyType, partyId, transactionType, amount, paymentMode, description, transactionDate } = body;

    if (!partyType || !partyId || !transactionType || !amount) {
      return NextResponse.json(
        { error: 'Party type, party, transaction type, and amount are required' },
        { status: 400 }
      );
    }

    const amt = parseFloat(amount);
    if (amt <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Transaction to ensure atomic updates
    const result = await prisma.$transaction(async (tx) => {
      // Get current balance
      let currentBalance = 0;
      let partyName = '';
      
      if (partyType === 'VENDOR') {
        const vendor = await tx.vendor.findUnique({
          where: { id: partyId },
        });

        if (!vendor) {
          throw new Error('Vendor not found');
        }
        
        currentBalance = parseFloat(vendor.balance.toString());
        partyName = vendor.name;
        
        // Payment reduces vendor balance (payable)
        const newBalance = currentBalance - amt;
        await tx.vendor.update({
          where: { id: partyId },
          data: { balance: newBalance },
        });

        // Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            transactionType,
            vendorId: partyId,
            amount: amt,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            description: description || `${transactionType} for ${partyName}`,
            transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
          },
        });

        return transaction;
      } else if (partyType === 'CUSTOMER') {
        const customer = await tx.customer.findUnique({
          where: { id: partyId },
        });

        if (!customer) {
          throw new Error('Customer not found');
        }
        
        currentBalance = parseFloat(customer.balance.toString());
        partyName = customer.name;
        
        // Receipt reduces customer balance (receivable)
        const newBalance = currentBalance - amt;
        await tx.customer.update({
          where: { id: partyId },
          data: { balance: newBalance },
        });

        // Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            transactionType,
            customerId: partyId,
            amount: amt,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            description: description || `${transactionType} for ${partyName}`,
            transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
          },
        });

        return transaction;
      }

      throw new Error('Invalid party type');
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record payment' },
      { status: 500 }
    );
  }
}
