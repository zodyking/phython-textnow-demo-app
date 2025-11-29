import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getUserById } from '@/lib/db'
import { formatAndValidatePhoneNumber } from '@/lib/phone'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(request: NextRequest) {
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

    const { number, message } = await request.json()

    if (!number || !message) {
      return NextResponse.json(
        { error: 'Missing number or message' },
        { status: 400 }
      )
    }

    // Format and validate phone number to E.164 format
    let phoneNumber: string
    try {
      phoneNumber = formatAndValidatePhoneNumber(number)
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Call Python service to send message
    // Try 'python' first, fallback to 'python3' if needed
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
    const pythonProcess = spawn(pythonCmd, [
      path.join(process.cwd(), 'python_service.py'),
      'send_sms'
    ], {
      cwd: process.cwd(),
      env: process.env
    })

    const inputData = {
      username: user.textnowUsername,
      sid_cookie: user.sidCookie,
      user_agent: user.userAgent || undefined,  // User agent from browser (required per GitHub issue #39)
      number: phoneNumber,
      message: message,
    }

    let output = ''
    let errorOutput = ''

    pythonProcess.stdin.write(JSON.stringify(inputData))
    pythonProcess.stdin.end()

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
      // Collect stderr but don't let it interfere with JSON parsing
      errorOutput += data.toString()
    })

    const result = await new Promise<string>((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          if (output.trim()) {
            resolve(output)
          } else {
            reject(new Error('Python process returned no output'))
          }
        } else {
          const errorMsg = errorOutput || output || 'Python process failed'
          reject(new Error(`Python process exited with code ${code}: ${errorMsg}`))
        }
      })
      
      pythonProcess.on('error', (err) => {
        reject(new Error(`Failed to start Python process: ${err.message}`))
      })
    })

    try {
      // Clean the output - remove any ANSI codes or extra whitespace
      const cleanedOutput = result.trim().replace(/\x1B\[[0-9;]*[mK]/g, '')
      
      // Try to find JSON in the output (in case there's extra text)
      const jsonMatch = cleanedOutput.match(/\{.*\}/s)
      const jsonString = jsonMatch ? jsonMatch[0] : cleanedOutput
      
      const parsed = JSON.parse(jsonString)
      
      if (parsed.success) {
        return NextResponse.json({
          success: true,
          message: 'Message sent successfully',
        })
      } else {
        console.error('Python service returned failure:', parsed)
        return NextResponse.json(
          { error: parsed.error || 'Failed to send message' },
          { status: 500 }
        )
      }
    } catch (parseError: any) {
      console.error('Failed to parse Python output:', parseError)
      console.error('Raw output:', result)
      console.error('Error output:', errorOutput)
      return NextResponse.json(
        { error: `Failed to parse response: ${parseError.message}. Raw output: ${result.substring(0, 200)}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    )
  }
}

