import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, isErrorResponse } from '@/lib/api-auth';

// GET all customers
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;
  
  try {
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST create new customer
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;
  
  try {
    const body = await request.json();
    const openingBalance = parseFloat(body.openingBalance) || 0;

    // Use transaction if opening balance exists
    if (openingBalance > 0) {
      const result = await prisma.$transaction(async (tx) => {
        // Create customer
        const customer = await tx.customer.create({
          data: {
            name: body.name,
            phone: body.phone || null,
            address: body.address || null,
            balance: openingBalance,
            isActive: true,
          },
        });

        // Generate opening balance invoice number
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000);
        const invoiceNumber = `OB-${year}${month}-${random}`;

        // Create opening balance sale record
        await tx.sale.create({
          data: {
            customerId: customer.id,
            invoiceNumber,
            saleDate: now,
            totalAmount: openingBalance,
            paidAmount: 0,
            dueAmount: openingBalance,
            notes: 'Opening Balance',
            isOpeningBalance: true,
            isWalkIn: false,
          },
        });

        return customer;
      });

      return NextResponse.json(result, { status: 201 });
    } else {
      // No opening balance, simple create
      const customer = await prisma.customer.create({
        data: {
          name: body.name,
          phone: body.phone || null,
          address: body.address || null,
          balance: 0,
          isActive: true,
        },
      });

      return NextResponse.json(customer, { status: 201 });
    }
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
