'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { extractSidCookie, isValidSidCookie } from '@/lib/cookie'
import { 
  EnvelopeIcon, 
  LockClosedIcon,
  ArrowLeftIcon,
  ClipboardDocumentIcon,
  WrenchScrewdriverIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    textnowUsername: '',
    sidCookie: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCookieHelper, setShowCookieHelper] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    // Extract and validate SID cookie
    const extractedSid = extractSidCookie(formData.sidCookie)
    if (!extractedSid) {
      setError('Please enter a valid connect.sid cookie')
      setLoading(false)
      return
    }

    if (!isValidSidCookie(extractedSid)) {
      setError('The cookie value doesn\'t look valid. Make sure you copied the connect.sid value correctly.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          textnowUsername: formData.textnowUsername,
          sidCookie: extractedSid, // Use extracted value
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Set auth token in cookie
        document.cookie = `auth-token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`
        router.push('/dashboard')
      } else {
        setError(data.error || 'Signup failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mb-6 flex items-center gap-2 text-primary-600 hover:text-primary-700"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Home
          </motion.button>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600 mb-8">Sign up to get started</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  placeholder="Choose a username"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                This is your account username for this app
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  placeholder="Create a password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">TextNow Configuration</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TextNow Username
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.textnowUsername}
                    onChange={(e) => setFormData({ ...formData, textnowUsername: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    placeholder="Your TextNow username"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Your TextNow account username (used to log in to TextNow)
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Connect.sid Cookie
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCookieHelper(true)}
                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <WrenchScrewdriverIcon className="w-4 h-4" />
                    Auto-Fetch Tool
                  </button>
                </div>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.sidCookie}
                    onChange={(e) => setFormData({ ...formData, sidCookie: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    placeholder="Enter connect.sid cookie or use Auto-Fetch Tool"
                  />
                </div>
              <p className="mt-1 text-xs text-gray-500">
                Get this from your browser's developer tools. Go to TextNow.com, open DevTools → Network → find a request → Headers → Cookie → find "connect.sid"
              </p>
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                <strong>Tip:</strong> You can paste the entire Cookie header - we'll automatically extract the connect.sid value. Or paste just the value after "connect.sid=".
              </div>
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                <strong>Important:</strong> If your cookie expires or you get a 403 error, you'll need to get a fresh one from TextNow.com.
              </div>
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Cookie Helper Modal */}
      {showCookieHelper && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCookieHelper(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <WrenchScrewdriverIcon className="w-6 h-6 text-primary-600" />
                  Cookie Auto-Fetch Tool
                </h2>
                <button
                  onClick={() => setShowCookieHelper(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Method 1: Bookmarklet */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ClipboardDocumentIcon className="w-5 h-5 text-primary-600" />
                  Method 1: Bookmarklet (Easiest)
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-gray-700">
                    Drag the button below to your bookmarks bar, then click it when you're on TextNow.com:
                  </p>
                  <a
                    href={`javascript:(function(){const cookies=document.cookie.split(';');let sid='';cookies.forEach(c=>{const parts=c.trim().split('=');if(parts[0]==='connect.sid'){sid=parts[1]}});if(sid){navigator.clipboard.writeText(sid).then(()=>{alert('Cookie copied to clipboard!\\n\\nPaste it in the signup form.');}).catch(()=>{prompt('Copy this cookie:',sid);});}else{alert('connect.sid cookie not found.\\n\\nMake sure you are logged into TextNow.com');}})();`}
                    className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm"
                    onClick={(e) => {
                      e.preventDefault()
                      alert('Drag this button to your bookmarks bar, then click it on TextNow.com')
                    }}
                  >
                    📌 Get TextNow Cookie
                  </a>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800">
                    <strong>Instructions:</strong>
                    <ol className="mt-2 ml-4 list-decimal space-y-1">
                      <li>Drag the button above to your bookmarks bar</li>
                      <li>Go to <a href="https://www.textnow.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">TextNow.com</a> and log in</li>
                      <li>Click the bookmarklet in your bookmarks bar</li>
                      <li>The cookie will be copied to your clipboard</li>
                      <li>Paste it in the form above</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Method 2: Console Script */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <InformationCircleIcon className="w-5 h-5 text-primary-600" />
                  Method 2: Browser Console
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-gray-700">
                    Copy and paste this script into the browser console on TextNow.com:
                  </p>
                  <div className="relative">
                    <textarea
                      readOnly
                      value={`// Run this in the browser console on TextNow.com
const cookies = document.cookie.split(';');
let sid = '';
cookies.forEach(c => {
  const parts = c.trim().split('=');
  if (parts[0] === 'connect.sid') {
    sid = parts[1];
  }
});

if (sid) {
  navigator.clipboard.writeText(sid).then(() => {
    console.log('✅ Cookie copied to clipboard!');
    alert('Cookie copied! Paste it in the signup form.');
  }).catch(() => {
    console.log('Cookie:', sid);
    prompt('Copy this cookie:', sid);
  });
} else {
  alert('❌ connect.sid cookie not found.\\n\\nMake sure you are logged into TextNow.com');
}`}
                      className="w-full h-40 p-3 bg-gray-900 text-green-400 font-mono text-xs rounded border border-gray-300 resize-none"
                      onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    />
                    <button
                      onClick={() => {
                        const textarea = document.createElement('textarea')
                        textarea.value = `// Run this in the browser console on TextNow.com
const cookies = document.cookie.split(';');
let sid = '';
cookies.forEach(c => {
  const parts = c.trim().split('=');
  if (parts[0] === 'connect.sid') {
    sid = parts[1];
  }
});

if (sid) {
  navigator.clipboard.writeText(sid).then(() => {
    console.log('✅ Cookie copied to clipboard!');
    alert('Cookie copied! Paste it in the signup form.');
  }).catch(() => {
    console.log('Cookie:', sid);
    prompt('Copy this cookie:', sid);
  });
} else {
  alert('❌ connect.sid cookie not found.\\n\\nMake sure you are logged into TextNow.com');
}`
                        document.body.appendChild(textarea)
                        textarea.select()
                        document.execCommand('copy')
                        document.body.removeChild(textarea)
                        alert('Script copied to clipboard! Paste it in the browser console on TextNow.com')
                      }}
                      className="absolute top-2 right-2 px-3 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700"
                    >
                      Copy Script
                    </button>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800">
                    <strong>Instructions:</strong>
                    <ol className="mt-2 ml-4 list-decimal space-y-1">
                      <li>Go to <a href="https://www.textnow.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">TextNow.com</a> and log in</li>
                      <li>Open Developer Tools (F12)</li>
                      <li>Go to the Console tab</li>
                      <li>Paste the script above and press Enter</li>
                      <li>The cookie will be copied to your clipboard</li>
                      <li>Paste it in the form above</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Manual Method */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Method 3: Manual (Traditional)</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <ol className="text-sm text-gray-700 space-y-2 ml-4 list-decimal">
                    <li>Go to <a href="https://www.textnow.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline font-semibold">TextNow.com</a> and log in</li>
                    <li>Open Developer Tools (F12 or Right-click → Inspect)</li>
                    <li>Go to the Network tab</li>
                    <li>Refresh the page (F5)</li>
                    <li>Click on any request in the Network tab</li>
                    <li>Go to the Headers section</li>
                    <li>Find the "Cookie" header in Request Headers</li>
                    <li>Copy the entire Cookie header or just the "connect.sid" value</li>
                    <li>Paste it in the form above</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowCookieHelper(false)}
                className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

