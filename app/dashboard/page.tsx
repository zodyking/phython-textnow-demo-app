'use client'

import { useState, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  PaperAirplaneIcon,
  ArrowLeftOnRectangleIcon,
  Cog6ToothIcon,
  PhotoIcon,
  XCircleIcon,
  SparklesIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

// Format phone number for display: (xxx) xxx-xxxx
const formatPhoneDisplay = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '')
  
  // Limit to 10 digits (US phone number)
  const limited = digits.slice(0, 10)
  
  // Format based on length
  if (limited.length === 0) return ''
  if (limited.length <= 3) return `(${limited}`
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
}

// Extract only digits from formatted phone number
const extractDigits = (value: string): string => {
  return value.replace(/\D/g, '')
}

// Generate random phone number for placeholder (formatted)
const generateRandomPhoneNumber = () => {
  const areaCode = Math.floor(Math.random() * 800) + 200 // 200-999
  const exchange = Math.floor(Math.random() * 800) + 200 // 200-999
  const number = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  const digits = `${areaCode}${exchange}${number}`
  return formatPhoneDisplay(digits)
}

export default function DashboardPage() {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState('') // Stores formatted display value
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [sending, setSending] = useState(false)
  const [auth, setAuth] = useState<any>(null)
  const [phonePlaceholder, setPhonePlaceholder] = useState('')
  const [mounted, setMounted] = useState(false)
  const [sendStatus, setSendStatus] = useState<{
    show: boolean
    status: 'sending' | 'success' | 'error'
    message: string
    progress?: string
  }>({
    show: false,
    status: 'sending',
    message: '',
  })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const springConfig = { damping: 25, stiffness: 700 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)
  
  // Hooks must be called unconditionally
  const cursorX = useTransform(x, (value) => value - 192)
  const cursorY = useTransform(y, (value) => value - 192)

  useEffect(() => {
    setMounted(true)
    // Only add mouse move listener on non-touch devices
    if (typeof window !== 'undefined' && !('ontouchstart' in window)) {
      const handleMouseMove = (e: MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY })
        mouseX.set(e.clientX)
        mouseY.set(e.clientY)
      }
      window.addEventListener('mousemove', handleMouseMove)
      return () => window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [mouseX, mouseY])

  useEffect(() => {
    checkAuth()
    setPhonePlaceholder(generateRandomPhoneNumber())
  }, [router])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/login')
        return
      }
      const data = await response.json()
      setAuth(data.user)
    } catch (error) {
      router.push('/login')
    }
  }

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setFilePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
      // Reset the input so the same file can be selected again if needed
      e.target.value = ''
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Extract only digits from the formatted phone number
    const rawPhoneNumber = extractDigits(phoneNumber)
    
    if (!rawPhoneNumber || rawPhoneNumber.length !== 10) {
      alert('Please enter a valid 10-digit phone number')
      return
    }

    if (!message.trim() && !selectedFile) {
      alert('Please enter a message or select an image')
      return
    }

    if (sending) return

    setSending(true)
    setSendStatus({
      show: true,
      status: 'sending',
      message: selectedFile ? 'Sending image...' : 'Sending message...',
      progress: selectedFile && message.trim() ? 'Image will be sent first, then message after 10 seconds' : undefined,
    })

    try {
      if (selectedFile) {
        // Step 1: Send image first
        const formData = new FormData()
        formData.append('number', rawPhoneNumber)
        formData.append('file', selectedFile, selectedFile.name)

        setSendStatus({
          show: true,
          status: 'sending',
          message: 'Step 1: Sending image...',
          progress: undefined,
        })

        const imageResponse = await fetch('/api/messages/send-media', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })

        let imageSuccess = false
        let imageError = ''

        if (imageResponse.ok) {
          const imageData = await imageResponse.json()
          if (imageData.success) {
            imageSuccess = true
            setSendStatus({
              show: true,
              status: 'sending',
              message: 'Step 1: Image sent successfully! ✓',
              progress: message.trim() ? 'Waiting 10 seconds before sending message...' : undefined,
            })
          } else {
            imageError = imageData.error || 'Failed to send image'
            setSendStatus({
              show: true,
              status: 'sending',
              message: `Step 1: Image failed - ${imageError}`,
              progress: message.trim() ? 'Continuing to send message anyway...' : undefined,
            })
          }
        } else {
          const imageData = await imageResponse.json().catch(() => ({ error: 'Failed to send image' }))
          imageError = imageData.error || 'Failed to send image'
          setSendStatus({
            show: true,
            status: 'sending',
            message: `Step 1: Image failed - ${imageError}`,
            progress: message.trim() ? 'Continuing to send message anyway...' : undefined,
          })
        }

        // If there's a message to send, wait 10 seconds then send it
        if (message.trim()) {
          // Wait 10 seconds with countdown
          for (let i = 10; i > 0; i--) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            setSendStatus({
              show: true,
              status: 'sending',
              message: imageSuccess 
                ? `Step 1: Image sent successfully! ✓` 
                : `Step 1: Image failed - ${imageError}`,
              progress: `Waiting ${i} seconds before sending message...`,
            })
          }

          // Step 2: Send message
          setSendStatus({
            show: true,
            status: 'sending',
            message: 'Step 2: Sending message...',
            progress: undefined,
          })

          const messageResponse = await fetch('/api/messages/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              number: rawPhoneNumber,
              message: message.trim(),
            }),
          })

          if (messageResponse.ok) {
            const messageData = await messageResponse.json()
            if (messageData.success) {
              setSendStatus({
                show: true,
                status: 'success',
                message: imageSuccess 
                  ? 'Step 2: Message sent successfully! ✓' 
                  : `Step 2: Message sent successfully! ✓\n(Image failed: ${imageError})`,
                progress: imageSuccess ? undefined : 'Image failed but message was sent.',
              })
            } else {
              setSendStatus({
                show: true,
                status: imageSuccess ? 'success' : 'error',
                message: imageSuccess
                  ? `Step 2: Message failed - ${messageData.error || 'Failed to send message'}\n(Image was sent successfully)`
                  : `Both steps failed:\nImage: ${imageError}\nMessage: ${messageData.error || 'Failed to send message'}`,
                progress: imageSuccess ? 'Image was sent successfully.' : undefined,
              })
            }
          } else {
            const messageData = await messageResponse.json().catch(() => ({ error: 'Failed to send message' }))
            setSendStatus({
              show: true,
              status: imageSuccess ? 'success' : 'error',
              message: imageSuccess
                ? `Step 2: Message failed - ${messageData.error || 'Failed to send message'}\n(Image was sent successfully)`
                : `Both steps failed:\nImage: ${imageError}\nMessage: ${messageData.error || 'Failed to send message'}`,
              progress: imageSuccess ? 'Image was sent successfully.' : undefined,
            })
          }
        } else {
          // No message, just show image result
          if (imageSuccess) {
            setSendStatus({
              show: true,
              status: 'success',
              message: 'Step 1: Image sent successfully! ✓',
            })
          } else {
            setSendStatus({
              show: true,
              status: 'error',
              message: `Step 1: Image failed - ${imageError}`,
            })
          }
        }

        // Clear form and hide modal
        setTimeout(() => {
          setPhoneNumber('')
          setMessage('')
          setSelectedFile(null)
          setFilePreview(null)
          setSendStatus({ show: false, status: 'sending', message: '' })
        }, imageSuccess && message.trim() ? 5000 : 3000)
      } else {
        // Send text message
        setSendStatus({
          show: true,
          status: 'sending',
          message: 'Sending message...',
        })

        const response = await fetch('/api/messages/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            number: rawPhoneNumber, // Send only digits
            message: message.trim(),
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setSendStatus({
              show: true,
              status: 'success',
              message: 'Message sent successfully!',
            })
            
            // Clear form
            setPhoneNumber('')
            setMessage('')
            
            // Hide modal after 3 seconds
            setTimeout(() => {
              setSendStatus({ show: false, status: 'sending', message: '' })
            }, 3000)
          } else {
            setSendStatus({
              show: true,
              status: 'error',
              message: data.error || 'Failed to send message',
            })
            setTimeout(() => {
              setSendStatus({ show: false, status: 'sending', message: '' })
            }, 5000)
          }
        } else {
          const data = await response.json()
          setSendStatus({
            show: true,
            status: 'error',
            message: data.error || 'Failed to send message',
          })
          setTimeout(() => {
            setSendStatus({ show: false, status: 'sending', message: '' })
          }, 5000)
        }
      }
    } catch (error: any) {
      setSendStatus({
        show: true,
        status: 'error',
        message: error.message || 'An error occurred while sending message',
      })
      console.error('Send message error:', error)
      setTimeout(() => {
        setSendStatus({ show: false, status: 'sending', message: '' })
      }, 5000)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-black relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 40% 20%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        />
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.2) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 80%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)',
              'radial-gradient(circle at 60% 40%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.2) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        />
      </div>

      {/* Animated Cursor Glow */}
      {mounted && (
        <motion.div
          className="pointer-events-none fixed w-96 h-96 rounded-full blur-3xl opacity-20 mix-blend-screen z-0"
          style={{
            x: cursorX,
            y: cursorY,
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.8), rgba(59, 130, 246, 0.8), rgba(236, 72, 153, 0.8))',
          }}
        />
      )}

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

      {/* Header */}
      <header className="relative z-10 px-3 sm:px-4 py-4 sm:py-6 backdrop-blur-sm bg-black/20 border-b border-white/10">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative group"
          >
            <motion.h1
              className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Python TextNow
              </span>
            </motion.h1>
          </motion.div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/settings"
              className="p-2 sm:p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
              title="Settings"
            >
              <Cog6ToothIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 sm:p-2.5 text-white/80 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
              title="Logout"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl shadow-xl p-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 border border-purple-500/30 backdrop-blur-sm mb-6 mx-auto block text-center"
          >
            <SparklesIcon className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-sm font-medium text-cyan-300">Send a Message</span>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => {
                  const formatted = formatPhoneDisplay(e.target.value)
                  setPhoneNumber(formatted)
                }}
                className="w-full px-4 py-3.5 sm:px-4 sm:py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 transition-all text-white placeholder:text-gray-500 text-base sm:text-lg backdrop-blur-sm touch-manipulation"
                placeholder={phonePlaceholder || "(212) 203-7678"}
                disabled={sending}
                maxLength={14} // (xxx) xxx-xxxx = 14 characters
              />
              <p className="mt-2 text-xs text-gray-400">
                Enter 10-digit US number (e.g., {phonePlaceholder || "(212) 203-7678"})
              </p>
            </div>

            {/* Drag and Drop Area */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Image (Optional)
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all backdrop-blur-sm touch-manipulation ${
                  isDragging
                    ? 'border-purple-500 bg-purple-500/20 scale-105'
                    : 'border-white/20 hover:border-purple-500/50 hover:bg-white/5 active:bg-white/5'
                }`}
              >
                {filePreview ? (
                  <div className="relative">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg shadow-md"
                    />
                    <button
                      type="button"
                      onClick={removeFile}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-all"
                      disabled={sending}
                    >
                      <XCircleIcon className="w-5 h-5" />
                    </button>
                    <p className="mt-3 text-sm text-gray-300 font-medium">{selectedFile?.name}</p>
                  </div>
                ) : (
                  <>
                    <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 mb-3 font-medium">
                      <span className="hidden sm:inline">Drag and drop an image here or </span>
                      <span className="sm:hidden">Tap to select an image</span>
                    </p>
                    <p className="text-sm text-gray-400 mb-4 hidden sm:block">or</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                      id="file-input"
                      disabled={sending}
                    />
                    <label
                      htmlFor="file-input"
                      className="inline-block px-6 py-3.5 sm:py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white rounded-xl hover:shadow-lg cursor-pointer font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px] flex items-center justify-center"
                    >
                      Select Image
                    </label>
                    <p className="mt-4 text-xs text-gray-400">
                      Supported: JPEG, PNG, GIF, WebP (max 10MB)
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Message {selectedFile && '(optional with image)'}
              </label>
              <textarea
                required={!selectedFile}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full px-4 py-3.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 resize-none transition-all text-white placeholder:text-gray-500 text-base sm:text-lg backdrop-blur-sm touch-manipulation"
                placeholder={selectedFile ? "Add a caption (optional)..." : "Type your message..."}
                disabled={sending}
              />
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={sending || (!phoneNumber.trim() || (!message.trim() && !selectedFile))}
              className="w-full py-4 sm:py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white rounded-xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 touch-manipulation min-h-[48px]"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-6 h-6" />
                  <span>{selectedFile ? 'Send Image' : 'Send Message'}</span>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </main>

      {/* Sending Status Modal */}
      <AnimatePresence>
        {sendStatus.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              if (sendStatus.status !== 'sending') {
                setSendStatus({ show: false, status: 'sending', message: '' })
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`backdrop-blur-sm border rounded-2xl shadow-2xl p-8 max-w-md w-full ${
                sendStatus.status === 'success'
                  ? 'bg-green-500/10 border-green-500/30'
                  : sendStatus.status === 'error'
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                {sendStatus.status === 'sending' && (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
                    />
                    <div className="w-full">
                      <h3 className="text-xl font-bold text-white mb-2">Sending...</h3>
                      <p className="text-gray-300 whitespace-pre-line text-center">{sendStatus.message}</p>
                      {sendStatus.progress && (
                        <p className="text-sm text-gray-400 mt-3">{sendStatus.progress}</p>
                      )}
                    </div>
                  </>
                )}
                
                {sendStatus.status === 'success' && (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center"
                    >
                      <CheckCircleIcon className="w-10 h-10 text-green-400" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-green-300 mb-2">Success!</h3>
                      <p className="text-gray-300">{sendStatus.message}</p>
                    </div>
                  </>
                )}
                
                {sendStatus.status === 'error' && (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center"
                    >
                      <ExclamationTriangleIcon className="w-10 h-10 text-red-400" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-red-300 mb-2">Error</h3>
                      <p className="text-gray-300">{sendStatus.message}</p>
                    </div>
                    <button
                      onClick={() => setSendStatus({ show: false, status: 'sending', message: '' })}
                      className="mt-4 px-6 py-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 bg-black/20 border-t border-white/10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-400">
            <span>Developers</span>
            <Link
              href="https://github.com/zodyking"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              ZodyKing
            </Link>
            <span className="text-gray-600">•</span>
            <Link
              href="https://github.com/joeyagreco"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Joey Greco
            </Link>
            <span className="text-gray-600">•</span>
            <Link
              href="https://github.com/joeyagreco/pythontextnow"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Python TextNow Api
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
