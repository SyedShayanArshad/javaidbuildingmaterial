import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, isErrorResponse } from '@/lib/api-auth';

// Helper: Get or create default settings
async function getSettings() {
  let settings = await prisma.systemSettings.findUnique({
    where: { id: 'default' },
  });

  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: {
        id: 'default',
        allowNegativeStock: false,
      },
    });
  }

  return settings;
}

// GET - Fetch system settings
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;

  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT - Update system settings
export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult;

  try {
    const body = await request.json();
    const { allowNegativeStock } = body;

    if (typeof allowNegativeStock !== 'boolean') {
      return NextResponse.json(
        { error: 'allowNegativeStock must be a boolean value' },
        { status: 400 }
      );
    }

    // Upsert to handle first-time creation
    const settings = await prisma.systemSettings.upsert({
      where: { id: 'default' },
      update: {
        allowNegativeStock,
      },
      create: {
        id: 'default',
        allowNegativeStock,
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
