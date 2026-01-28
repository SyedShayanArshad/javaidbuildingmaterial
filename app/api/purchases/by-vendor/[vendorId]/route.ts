import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, isErrorResponse } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;

  try {
    const { vendorId } = params;

    const purchases = await prisma.purchase.findMany({
      where: {
        vendorId,
        dueAmount: {
          gt: 0,
        },
      },
      include: {
        vendor: {
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

    return NextResponse.json(purchases);
  } catch (error) {
    console.error('Error fetching vendor purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}
