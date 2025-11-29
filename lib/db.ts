import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

const DB_PATH = path.join(process.cwd(), 'data', 'users.json')

interface User {
  id: string
  username: string
  passwordHash: string
  textnowUsername: string
  sidCookie: string
  userAgent?: string  // User agent from browser that obtained the cookie (required per GitHub issue #39)
  createdAt: string
}

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2))
  }
}

// Read users from database
export function getUsers(): User[] {
  ensureDataDir()
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// Write users to database
function saveUsers(users: User[]) {
  ensureDataDir()
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2))
}

// Create a new user
export async function createUser(
  username: string,
  password: string,
  textnowUsername: string,
  sidCookie: string,
  userAgent?: string
): Promise<User> {
  const users = getUsers()
  
  // Check if username already exists
  if (users.find(u => u.username === username)) {
    throw new Error('Username already exists')
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10)

  const user: User = {
    id: Date.now().toString(),
    username,
    passwordHash,
    textnowUsername,
    sidCookie,
    userAgent,
    createdAt: new Date().toISOString(),
  }

  users.push(user)
  saveUsers(users)
  return user
}

// Find user by username
export function findUserByUsername(username: string): User | null {
  const users = getUsers()
  return users.find(u => u.username === username) || null
}

// Verify password
export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return await bcrypt.compare(password, user.passwordHash)
}

// Get user by ID
export function getUserById(id: string): User | null {
  const users = getUsers()
  return users.find(u => u.id === id) || null
}

// Update user
export async function updateUser(
  userId: string,
  updates: Partial<Pick<User, 'textnowUsername' | 'sidCookie' | 'userAgent'>>
): Promise<User> {
  const users = getUsers()
  const userIndex = users.findIndex(u => u.id === userId)
  
  if (userIndex === -1) {
    throw new Error('User not found')
  }

  // Update fields
  if (updates.textnowUsername !== undefined) {
    users[userIndex].textnowUsername = updates.textnowUsername
  }
  if (updates.sidCookie !== undefined) {
    users[userIndex].sidCookie = updates.sidCookie
  }
  if (updates.userAgent !== undefined) {
    users[userIndex].userAgent = updates.userAgent
  }

  saveUsers(users)
  return users[userIndex]
}

