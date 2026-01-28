import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, isErrorResponse } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;

  try {
    const { customerId } = params;

    const sales = await prisma.sale.findMany({
      where: {
        customerId,
        dueAmount: {
          gt: 0,
        },
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Error fetching customer sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}
