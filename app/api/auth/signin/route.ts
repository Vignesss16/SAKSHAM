import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    // Basic validation
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // TODO: Replace with your actual auth logic (e.g. NextAuth, Supabase, Prisma, etc.)
    // Demo: accept any valid-looking credentials
    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Simulate a successful login
    const user = {
      id: 'user_demo_001',
      email,
      name: email.split('@')[0],
    }

    // In production: set httpOnly cookie / JWT here
    return NextResponse.json({ success: true, user }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
