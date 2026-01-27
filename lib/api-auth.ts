import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, SessionUser } from './session';

export async function requireAuth(request: NextRequest): Promise<{ user: SessionUser } | NextResponse> {
  const user = await getSessionFromRequest(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized - Please login' },
      { status: 401 }
    );
  }

  return { user };
}

export function isErrorResponse(result: any): result is NextResponse {
  return result instanceof NextResponse;
}
