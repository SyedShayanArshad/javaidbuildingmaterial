import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, isErrorResponse } from '@/lib/api-auth';

// GET search customers by name or phone
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;
  
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query || query.trim().length === 0) {
      return NextResponse.json([]);
    }

    const customers = await prisma.customer.findMany({
      where: {
        isActive: true,
        OR: [
          {
            name: {
              contains: query,
            },
          },
          {
            phone: {
              contains: query,
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        balance: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: 10, // Limit to 10 results
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error('Error searching customers:', error);
    return NextResponse.json(
      { error: 'Failed to search customers' },
      { status: 500 }
    );
  }
}
