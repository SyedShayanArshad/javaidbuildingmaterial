import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth, isErrorResponse } from '@/lib/api-auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;
  
  try {
    const { id } = await params;
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            balance: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    // Handle walk-in customers by providing default customer object
    const response = {
      ...sale,
      customer: sale.customer || {
        name: sale.walkInCustomerName || 'Walk-in Customer',
        phone: null,
        balance: 0,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sale' },
      { status: 500 }
    );
  }
}