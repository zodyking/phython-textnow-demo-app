import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getUserById } from '@/lib/db'
import { formatAndValidatePhoneNumber } from '@/lib/phone'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { writeFile } from 'fs/promises'

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

    // Parse form data (multipart/form-data)
    const formData = await request.formData()
    const number = formData.get('number') as string
    const file = formData.get('file') as File
    const message = formData.get('message') as string | null  // Optional caption/message

    if (!number || !file) {
      return NextResponse.json(
        { error: 'Missing number or file' },
        { status: 400 }
      )
    }

    // Validate file type (images only for now)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) are supported.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
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

    // Save file to temporary directory
    const uploadsDir = path.join(process.cwd(), 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
    const filePath = path.join(uploadsDir, fileName)

    // Write file to disk
    await writeFile(filePath, buffer)

    // Call Python service to send media
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
    const pythonProcess = spawn(pythonCmd, [
      path.join(process.cwd(), 'python_service.py'),
      'send_media'
    ], {
      cwd: process.cwd(),
      env: process.env
    })

    const inputData = {
      username: user.textnowUsername,
      sid_cookie: user.sidCookie,
      user_agent: user.userAgent || undefined,
      number: phoneNumber,
      file_path: filePath,
      // Note: message is handled separately by the frontend
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
        // Clean up uploaded file after sending
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup file:', cleanupError)
        }

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
        // Clean up on error
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup file:', cleanupError)
        }
        reject(new Error(`Failed to start Python process: ${err.message}`))
      })
    })

    try {
      // Clean the output
      const cleanedOutput = result.trim().replace(/\x1B\[[0-9;]*[mK]/g, '')
      const jsonMatch = cleanedOutput.match(/\{.*\}/s)
      const jsonString = jsonMatch ? jsonMatch[0] : cleanedOutput
      const parsed = JSON.parse(jsonString)

      if (parsed.success) {
        return NextResponse.json({
          success: true,
          message: 'Media sent successfully',
        })
      } else {
        return NextResponse.json(
          { error: parsed.error || 'Failed to send media' },
          { status: 500 }
        )
      }
    } catch (parseError: any) {
      console.error('Failed to parse Python output:', parseError)
      return NextResponse.json(
        { error: `Failed to parse response: ${parseError.message}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Send media error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send media' },
      { status: 500 }
    )
  }
}

