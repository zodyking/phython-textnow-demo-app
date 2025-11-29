import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/db'
import { generateToken } from '@/lib/auth'
import { extractSidCookie, isValidSidCookie } from '@/lib/cookie'

export async function POST(request: NextRequest) {
  try {
    const { username, password, textnowUsername, sidCookie } = await request.json()

    if (!username || !password || !textnowUsername || !sidCookie) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Extract and validate SID cookie
    const extractedSid = extractSidCookie(sidCookie)
    if (!extractedSid) {
      return NextResponse.json(
        { error: 'Invalid cookie format. Could not extract connect.sid value.' },
        { status: 400 }
      )
    }
    if (!isValidSidCookie(extractedSid)) {
      return NextResponse.json(
        { error: 'The cookie value doesn\'t look valid. Make sure you copied the connect.sid value correctly.' },
        { status: 400 }
      )
    }

    // Get user agent from request headers (required per GitHub issue #39)
    const userAgent = request.headers.get('user-agent') || undefined

    // Create user
    let user
    try {
      user = await createUser(username, password, textnowUsername, extractedSid, userAgent)
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Failed to create user' },
        { status: 400 }
      )
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      username: user.username,
    })

    // Set cookie
    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    )
  }
}

