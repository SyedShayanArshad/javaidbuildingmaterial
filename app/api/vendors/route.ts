import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, isErrorResponse } from '@/lib/api-auth';

// GET all vendors
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;
  
  try {
    const vendors = await prisma.vendor.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(vendors);
  } catch (error: any) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

// POST create new vendor
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;
  
  try {
    const body = await request.json();
    const openingBalance = parseFloat(body.openingBalance) || 0;

    // Use transaction if opening balance exists
    if (openingBalance > 0) {
      const result = await prisma.$transaction(async (tx) => {
        // Create vendor
        const vendor = await tx.vendor.create({
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
        const invoiceNumber = `OB-PUR-${year}${month}-${random}`;

        // Create opening balance purchase record
        await tx.purchase.create({
          data: {
            vendorId: vendor.id,
            invoiceNumber,
            purchaseDate: now,
            totalAmount: openingBalance,
            paidAmount: 0,
            dueAmount: openingBalance,
            notes: 'Opening Balance',
            isOpeningBalance: true,
          },
        });

        return vendor;
      });

      return NextResponse.json(result, { status: 201 });
    } else {
      // No opening balance, simple create
      const vendor = await prisma.vendor.create({
        data: {
          name: body.name,
          phone: body.phone || null,
          address: body.address || null,
          balance: 0,
          isActive: true,
        },
      });

      return NextResponse.json(vendor, { status: 201 });
    }
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
}
