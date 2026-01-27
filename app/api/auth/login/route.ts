import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations';
import { getUserByEmail, verifyPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1️⃣ Validate input
    const validatedData = loginSchema.parse(body);

    // 2️⃣ Find user by email
    const user = await getUserByEmail(validatedData.email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 3️⃣ Check if user is active
    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    // 4️⃣ Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 5️⃣ Create JWT session
    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
    };
    const token = await createSession(sessionUser);

    // 6️⃣ Return success response with token
    const response = NextResponse.json({ 
      success: true,
      message: 'Login successful',
      redirectUrl: '/dashboard'
    }, { status: 200 });

    // 7️⃣ Set HTTP-only cookie
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('Login error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'An error occurred during login' }, { status: 500 });
  }
}
