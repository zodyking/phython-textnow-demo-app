'use client'

import { useState, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { extractSidCookie, isValidSidCookie } from '@/lib/cookie'
import {
  ArrowLeftIcon,
  Cog6ToothIcon,
  UserIcon,
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    textnowUsername: '',
    sidCookie: '',
    userAgent: '',
  })
  const [showSidCookie, setShowSidCookie] = useState(false)
  const [showUserAgent, setShowUserAgent] = useState(false)
  const [storedSidCookie, setStoredSidCookie] = useState('')
  const [storedUserAgent, setStoredUserAgent] = useState('')
  const [mounted, setMounted] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const springConfig = { damping: 25, stiffness: 700 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)
  
  // Hooks must be called unconditionally - move useTransform outside conditional
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
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/user/settings', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setFormData({
          textnowUsername: data.user.textnowUsername || '',
          sidCookie: '',
          userAgent: '',
        })
        setStoredSidCookie(data.user.sidCookie || '')
        setStoredUserAgent(data.user.userAgent || '')
      } else if (response.status === 401) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const updateData: any = {}
    if (formData.textnowUsername) {
      updateData.textnowUsername = formData.textnowUsername
    }
    if (formData.sidCookie) {
      const extractedSid = extractSidCookie(formData.sidCookie)
      if (!extractedSid) {
        setError('Please enter a valid connect.sid cookie')
        setSaving(false)
        return
      }
      if (!isValidSidCookie(extractedSid)) {
        setError('The cookie value doesn\'t look valid. Make sure you copied the connect.sid value correctly.')
        setSaving(false)
        return
      }
      updateData.sidCookie = extractedSid
    }

    if (Object.keys(updateData).length === 0) {
      setError('Please enter at least one field to update')
      setSaving(false)
      return
    }

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        setSuccess('Settings updated successfully!')
        setFormData({ ...formData, sidCookie: '', userAgent: '' })
        await loadSettings()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update settings')
      }
    } catch (error: any) {
      setError('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
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
        <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-4">
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6 text-white" />
            </motion.button>
          </Link>
          <div className="flex items-center gap-3">
            <motion.div
              className="relative"
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-xl blur-md opacity-50" />
              <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-cyan-600 p-2 rounded-xl">
                <Cog6ToothIcon className="w-6 h-6 text-white" />
              </div>
            </motion.div>
            <motion.h1
              className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Settings
              </span>
            </motion.h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 px-3 sm:px-4 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 border border-purple-500/30 backdrop-blur-sm mb-6"
            >
              <SparklesIcon className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span className="text-sm font-medium text-cyan-300">TextNow Configuration</span>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <XCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-green-300 text-sm">{success}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  TextNow Username
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.textnowUsername}
                    onChange={(e) => setFormData({ ...formData, textnowUsername: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white placeholder:text-gray-500 backdrop-blur-sm transition-all"
                    placeholder="Your TextNow username"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Your TextNow account username (used to log in to TextNow)
                </p>
              </div>

              {/* Stored SID Cookie */}
              {storedSidCookie && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Current Cookie
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showSidCookie ? "text" : "password"}
                      value={storedSidCookie}
                      readOnly
                      className="w-full pl-12 pr-12 py-3.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 font-mono text-xs sm:text-sm backdrop-blur-sm touch-manipulation"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSidCookie(!showSidCookie)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showSidCookie ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Update SID Cookie */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  {storedSidCookie ? 'Update Cookie' : 'Connect.sid Cookie'}
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.sidCookie}
                    onChange={(e) => setFormData({ ...formData, sidCookie: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white placeholder:text-gray-500 backdrop-blur-sm transition-all text-base sm:text-base touch-manipulation"
                    placeholder={storedSidCookie ? "Enter new cookie (leave blank to keep current)" : "Enter connect.sid cookie"}
                  />
                </div>
                <div className="mt-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl backdrop-blur-sm">
                  <p className="text-xs text-blue-300 mb-2">
                    <strong className="text-blue-200">How to get your cookie:</strong>
                  </p>
                  <ol className="text-xs text-blue-300/80 space-y-1 ml-4 list-decimal">
                    <li>Go to <a href="https://www.textnow.com" target="_blank" rel="noopener noreferrer" className="underline text-blue-200">TextNow.com</a> and log in</li>
                    <li>Open Developer Tools (F12)</li>
                    <li>Network tab → refresh page</li>
                    <li>Click any request → Headers → Cookie</li>
                    <li>Copy the entire Cookie header and paste here</li>
                  </ol>
                </div>
                {!storedSidCookie && (
                  <div className="mt-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
                    <p className="text-xs text-red-300">
                      <strong className="text-red-200">⚠️ Getting 403 Error?</strong> Your cookie expired. Get a fresh one from TextNow.com
                    </p>
                  </div>
                )}
              </div>

              {/* Stored User Agent */}
              {storedUserAgent && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Current User-Agent
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showUserAgent ? "text" : "password"}
                      value={storedUserAgent}
                      readOnly
                      className="w-full pl-12 pr-12 py-3.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 font-mono text-xs sm:text-xs backdrop-blur-sm touch-manipulation"
                    />
                    <button
                      type="button"
                      onClick={() => setShowUserAgent(!showUserAgent)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showUserAgent ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Automatically captured from your browser (required)
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={saving}
                className="w-full py-4 sm:py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white rounded-xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation min-h-[48px]"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <BoltIcon className="w-5 h-5" />
                    <span>Save Settings</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </main>

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
