import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, isErrorResponse } from '@/lib/api-auth';

// GET - Fetch recent stock adjustments
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;

  try {
    const adjustments = await prisma.stockMovement.findMany({
      where: {
        movementType: {
          in: ['ADJUSTMENT_IN', 'ADJUSTMENT_OUT']
        }
      },
      include: {
        product: {
          select: {
            name: true,
            unit: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return NextResponse.json(adjustments);
  } catch (error) {
    console.error('Error fetching stock adjustments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock adjustments' },
      { status: 500 }
    );
  }
}

// POST - Create stock adjustment
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;

  try {
    const body = await request.json();
    const { productId, adjustmentType, quantity, notes } = body;

    // Validation
    if (!productId || !adjustmentType || !quantity) {
      return NextResponse.json(
        { error: 'Product, adjustment type, and quantity are required' },
        { status: 400 }
      );
    }

    const qty = parseFloat(quantity);
    if (qty <= 0 || isNaN(qty)) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
        { status: 400 }
      );
    }

    if (!['IN', 'OUT'].includes(adjustmentType)) {
      return NextResponse.json(
        { error: 'Invalid adjustment type' },
        { status: 400 }
      );
    }

    // Transaction to ensure atomic updates
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch product
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      if (!product.isActive) {
        throw new Error('Cannot adjust stock for inactive product');
      }

      // 2. Calculate new stock
      const currentStock = Number(product.stockQuantity);
      const adjustment = adjustmentType === 'IN' ? qty : -qty;
      const newStock = currentStock + adjustment;

      if (newStock < 0) {
        throw new Error(`Insufficient stock. Current: ${currentStock}, Attempting to remove: ${qty}`);
      }

      // 3. Batch operations using Promise.all
      const [updatedProduct, movement] = await Promise.all([
        // Update product stock using atomic increment/decrement
        tx.product.update({
          where: { id: productId },
          data: {
            stockQuantity: {
              [adjustmentType === 'IN' ? 'increment' : 'decrement']: qty
            }
          },
        }),
        
        // Create stock movement record
        tx.stockMovement.create({
          data: {
            productId,
            movementType: adjustmentType === 'IN' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
            quantity: qty,
            balanceBefore: currentStock,
            balanceAfter: newStock,
            referenceType: 'MANUAL_ADJUSTMENT',
            notes: notes || `Manual ${adjustmentType === 'IN' ? 'stock in' : 'stock out'}`,
          },
        }),
      ]);

      return { product: updatedProduct, movement };
    }, {
      timeout: 20000, // 20 second timeout
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error adjusting stock:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to adjust stock' },
      { status: 500 }
    );
  }
}