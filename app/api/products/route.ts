import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { productSchema } from '@/lib/validations';
import { requireAuth, isErrorResponse } from '@/lib/api-auth';

// GET all products
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;
  
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST create new product
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;
  
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = productSchema.parse(body);

    // Create product
    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        unit: validatedData.unit,
        minimumStockLevel: validatedData.minimumStockLevel,
        stockQuantity: 0, // Initial stock is 0
        isActive: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
