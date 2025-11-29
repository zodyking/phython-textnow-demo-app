import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getUserById } from '@/lib/db'
import { spawn } from 'child_process'
import path from 'path'

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

    // Get phone number from query params (optional)
    const { searchParams } = new URL(request.url)
    const phoneNumber = searchParams.get('phoneNumber')

    // Call Python service to get messages
    // Try 'python' first, fallback to 'python3' if needed
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
    const pythonProcess = spawn(pythonCmd, [
      path.join(process.cwd(), 'python_service.py'),
      'get_messages'
    ], {
      cwd: process.cwd(),
      env: process.env
    })

    const inputData = {
      username: user.textnowUsername,
      sid_cookie: user.sidCookie,
      user_agent: user.userAgent || undefined,  // User agent from browser (required per GitHub issue #39)
      number: phoneNumber || null,
      num_messages: 200,  // Increased to get more messages
    }

    let output = ''
    let errorOutput = ''

    pythonProcess.stdin.write(JSON.stringify(inputData))
    pythonProcess.stdin.end()

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
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
      
      // Check if there's an error in the response
      if (parsed.error) {
        console.error('Python service error:', parsed.error)
        return NextResponse.json({
          messages: [],
          error: parsed.error,
        })
      }
      
      // Filter out debug messages and errors, but log debug info
      const allMessages = parsed.messages || []
      const debugInfo = allMessages.find((m: any) => m.debug)?.debug
      
      if (debugInfo) {
        console.log('DEBUG INFO from Python service:', JSON.stringify(debugInfo, null, 2))
      }
      
      const messages = allMessages.filter((msg: any) => {
        if (msg.debug) {
          return false // Don't include debug in messages
        }
        return !msg.error // Filter out error messages
      })
      
      return NextResponse.json({
        messages: messages,
        debug: debugInfo, // Include debug in response for frontend inspection
      })
    } catch (parseError: any) {
      console.error('Failed to parse Python output:', parseError)
      console.error('Raw output:', result)
      console.error('Error output:', errorOutput)
      return NextResponse.json({
        messages: [],
        error: `Failed to parse response: ${parseError.message}`,
      })
    }
  } catch (error: any) {
    console.error('Get messages error:', error)
    return NextResponse.json({
      messages: [],
      error: error.message || 'Failed to get messages',
    })
  }
}

