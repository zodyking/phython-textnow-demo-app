import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getUserById, updateUser } from '@/lib/db'
import { extractSidCookie, isValidSidCookie } from '@/lib/cookie'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const authData = verifyToken(token)
    if (!authData) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const user = getUserById(authData.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user settings (including stored values for display)
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        textnowUsername: user.textnowUsername,
        sidCookie: user.sidCookie || '', // Return stored cookie for display
        userAgent: user.userAgent || '', // Return stored user agent for display
        hasSidCookie: !!user.sidCookie,
        hasUserAgent: !!user.userAgent,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const authData = verifyToken(token)
    if (!authData) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { textnowUsername, sidCookie, userAgent } = await request.json()

    if (!textnowUsername && !sidCookie) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const updates: any = {}
    if (textnowUsername) updates.textnowUsername = textnowUsername
    if (sidCookie) {
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
      updates.sidCookie = extractedSid
      // When updating cookie, also update user agent from request headers (required per GitHub issue #39)
      const newUserAgent = request.headers.get('user-agent') || undefined
      if (newUserAgent) {
        updates.userAgent = newUserAgent
      }
    }
    if (userAgent) {
      updates.userAgent = userAgent
    }

    const updatedUser = await updateUser(authData.userId, updates)

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        textnowUsername: updatedUser.textnowUsername,
        hasSidCookie: !!updatedUser.sidCookie,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    )
  }
}

