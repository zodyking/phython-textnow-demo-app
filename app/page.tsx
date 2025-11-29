'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { 
  PaperAirplaneIcon,
  PhotoIcon,
  DevicePhoneMobileIcon,
  BoltIcon,
  SparklesIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const springConfig = { damping: 25, stiffness: 700 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)

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

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
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
      <motion.div
        className="pointer-events-none fixed w-96 h-96 rounded-full blur-3xl opacity-20 mix-blend-screen z-0"
        style={{
          x: useTransform(x, (value) => value - 192),
          y: useTransform(y, (value) => value - 192),
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.8), rgba(59, 130, 246, 0.8), rgba(236, 72, 153, 0.8))',
        }}
      />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

      {/* Navigation */}
      <nav className="relative z-10 px-3 sm:px-4 py-4 sm:py-6 backdrop-blur-sm bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative group flex-shrink-0"
          >
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              {/* Icon with glow effect */}
              <motion.div
                className="relative"
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-cyan-600 p-1.5 sm:p-2.5 rounded-xl">
                  <BoltIcon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
              </motion.div>

              {/* Title with enhanced styling */}
              <div className="relative">
                <motion.h1
                  className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                    <span className="relative inline-block">
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent blur-sm opacity-50">
                      Python TextNow
                    </span>
                    <motion.span
                      className="relative bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent"
                      animate={{
                        backgroundPosition: ['0%', '100%', '0%'],
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      style={{ backgroundSize: '200%' }}
                    >
                      Python TextNow
                    </motion.span>
                  </span>
                </motion.h1>
                
                {/* Animated underline */}
                <motion.div
                  className="absolute -bottom-1 sm:-bottom-2 left-0 h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
                
                {/* Glow effect on hover */}
                <motion.div
                  className="absolute -bottom-1 sm:-bottom-2 left-0 h-0.5 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </div>
            </Link>
          </motion.div>
          <div className="flex gap-2 sm:gap-4">
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                className="px-3 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base text-white/80 font-medium rounded-lg backdrop-blur-sm bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all touch-manipulation"
              >
                Login
              </motion.button>
            </Link>
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(139, 92, 246, 0.8)' }}
                whileTap={{ scale: 0.95 }}
                className="px-3 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white rounded-lg font-semibold relative overflow-hidden group touch-manipulation"
              >
                <span className="relative z-10">Sign Up</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.5 }}
                />
              </motion.button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 px-4 py-12 md:py-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            {/* Animated Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 border border-purple-500/30 backdrop-blur-sm mb-8"
            >
              <SparklesIcon className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span className="text-sm font-medium text-cyan-300">Next-Gen Messaging Platform</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-4 sm:mb-6 leading-tight px-2"
            >
              <span className="block text-white">Send</span>
              <motion.span
                className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ['0%', '100%', '0%'],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                style={{ backgroundSize: '200%' }}
              >
                Text Messages
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4"
            >
              Send SMS and MMS messages to any phone number instantly. Simple, fast, and reliable messaging powered by TextNow.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4"
            >
              <Link href="/signup" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)' }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white rounded-2xl font-bold text-base sm:text-lg overflow-hidden touch-manipulation"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <RocketLaunchIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    Get Started
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                </motion.button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-white/5 backdrop-blur-sm text-white rounded-2xl font-bold text-base sm:text-lg border-2 border-purple-500/50 hover:border-purple-400 transition-all touch-manipulation"
                >
                  Sign In
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-16 sm:mt-24 md:mt-32 px-4"
          >
            <FeatureCard
              icon={<PaperAirplaneIcon className="w-8 h-8" />}
              title="Send SMS"
              description="Send text messages to any phone number instantly with lightning speed and reliability"
              delay={0.1}
              gradient="from-purple-500 to-pink-500"
            />
            <FeatureCard
              icon={<PhotoIcon className="w-8 h-8" />}
              title="Send MMS"
              description="Send pictures and media with drag-and-drop support. Images and text sent seamlessly"
              delay={0.2}
              gradient="from-pink-500 to-cyan-500"
            />
            <FeatureCard
              icon={<DevicePhoneMobileIcon className="w-8 h-8" />}
              title="Simple Interface"
              description="Clean, modern design that makes sending messages quick and effortless"
              delay={0.3}
              gradient="from-cyan-500 to-purple-500"
            />
          </motion.div>
        </div>
      </main>

      {/* Floating Particles - Only render on client to avoid hydration errors */}
      {mounted && typeof window !== 'undefined' && [...Array(20)].map((_, i) => {
        const width = window.innerWidth
        const height = window.innerHeight
        // Generate stable random values per particle index
        const seed = i * 1000
        const random1 = ((seed * 9301 + 49297) % 233280) / 233280
        const random2 = ((seed * 9301 + 49297 + 1) % 233280) / 233280
        const random3 = ((seed * 9301 + 49297 + 2) % 233280) / 233280
        const random4 = ((seed * 9301 + 49297 + 3) % 233280) / 233280
        
        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            initial={{
              x: random1 * width,
              y: random2 * height,
              opacity: 0,
            }}
            animate={{
              y: [null, random3 * height],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: random4 * 10 + 10,
              repeat: Infinity,
              delay: random1 * 5,
            }}
          />
        )
      })}
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  delay,
  gradient
}: { 
  icon: React.ReactNode
  title: string
  description: string
  delay: number
  gradient: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="group relative p-8 rounded-2xl backdrop-blur-sm bg-white/5 border border-white/10 hover:border-white/30 transition-all overflow-hidden"
    >
      {/* Gradient Glow Effect */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}
      />
      
      {/* Icon */}
      <motion.div
        className={`relative mb-6 inline-flex p-4 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-white">{icon}</div>
      </motion.div>

      <h3 className="text-2xl font-bold text-white mb-3 relative z-10">{title}</h3>
      <p className="text-gray-300 leading-relaxed relative z-10">{description}</p>

      {/* Shine Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
        initial={{ x: '-100%' }}
        whileHover={{ x: '200%' }}
        transition={{ duration: 0.8 }}
      />
    </motion.div>
  )
}

