import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, adjustmentType, quantity, notes } = body;

    if (!productId || !adjustmentType || !quantity) {
      return NextResponse.json(
        { error: 'Product, adjustment type, and quantity are required' },
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

    // Transaction to ensure atomic updates
    const result = await prisma.$transaction(async (tx) => {
      // Get current product
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      // Calculate new stock
      const currentStock = parseFloat(product.stockQuantity.toString());
      const newStock = adjustmentType === 'IN' 
        ? currentStock + qty 
        : currentStock - qty;

      if (newStock < 0) {
        throw new Error('Cannot reduce stock below zero');
      }

      // Update product stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: newStock },
      });

      // Create stock movement record
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          movementType: adjustmentType === 'IN' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
          quantity: qty,
          balanceBefore: currentStock,
          balanceAfter: newStock,
          notes: notes || `Manual ${adjustmentType === 'IN' ? 'addition' : 'removal'} of stock`,
        },
      });

      return { product: updatedProduct, movement };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error adjusting stock:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to adjust stock' },
      { status: 500 }
    );
  }
}
