import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // TODO: Replace with your actual DB logic (e.g. Prisma, Supabase, etc.)
    // Demo: simulate account creation
    const user = {
      id: `user_${Date.now()}`,
      name,
      email,
      createdAt: new Date().toISOString(),
    }

    // In production: hash password, save to DB, set session cookie / JWT here
    return NextResponse.json({ success: true, user }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
