import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, isErrorResponse } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;
  
  try {
    const body = await request.json();
    const { productId, adjustmentType, quantity, notes } = body;

    if (!productId || !adjustmentType || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const qty = parseFloat(quantity);
    if (qty <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // Use transaction to ensure atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Get current product
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      // Calculate new stock
      const currentStock = product.stockQuantity;
      const adjustment = adjustmentType === 'IN' ? qty : -qty;
      const newStock = currentStock + adjustment;

      if (newStock < 0) {
        throw new Error('Insufficient stock');
      }

      // Update product stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: newStock },
      });

      // Create stock movement record
      await tx.stockMovement.create({
        data: {
          productId,
          movementType: adjustmentType === 'IN' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
          quantity: qty,
          balanceBefore: currentStock,
          balanceAfter: newStock,
          referenceType: 'MANUAL_ADJUSTMENT',
          notes: notes || null,
        },
      });

      return updatedProduct;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error adjusting stock:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to adjust stock' },
      { status: 500 }
    );
  }
}
