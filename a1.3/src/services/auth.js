import { computed, readonly, ref } from 'vue'
import {
  cleanPlainText,
  isValidEmail,
  makeId,
  normaliseEmail,
  safeRead,
  safeWrite,
  validatePassword,
} from './security.js'

const USERS_KEY = 'urbancanopy-users-v2'
const SESSION_KEY = 'urbancanopy-session-v2'
const HASH_ITERATIONS = 120000
const users = ref([])
const currentUser = ref(null)
const ready = ref(false)

const demoAccounts = [
  {
    displayName: 'UrbanCanopy Admin',
    email: 'admin@urbancanopy.org.au',
    password: 'CanopyAdmin!26',
    role: 'admin',
  },
  {
    displayName: 'Demo Volunteer',
    email: 'volunteer@urbancanopy.org.au',
    password: 'GreenerMelbourne!26',
    role: 'member',
  },
]

function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...bytes))
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

async function derivePasswordHash(password, salt) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: HASH_ITERATIONS },
    material,
    256,
  )
  return bytesToBase64(new Uint8Array(bits))
}

async function buildUser({ displayName, email, password, role = 'member' }) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return {
    id: makeId('user'),
    displayName: cleanPlainText(displayName, 70),
    email: normaliseEmail(email),
    role: role === 'admin' ? 'admin' : 'member',
    salt: bytesToBase64(salt),
    passwordHash: await derivePasswordHash(password, salt),
    createdAt: new Date().toISOString(),
  }
}

function publicUser(user) {
  if (!user) return null
  const { id, displayName, email, role, createdAt } = user
  return { id, displayName, email, role, createdAt }
}

function persistUsers() {
  return safeWrite(USERS_KEY, users.value)
}

export async function initialiseAuth() {
  const stored = safeRead(USERS_KEY, [])
  users.value = Array.isArray(stored) ? stored.filter((user) => user?.id && user?.passwordHash) : []

  if (!users.value.length) {
    users.value = await Promise.all(demoAccounts.map(buildUser))
    persistUsers()
  }

  const session = safeRead(SESSION_KEY, null)
  currentUser.value = publicUser(users.value.find((user) => user.id === session?.userId))
  ready.value = true
}

export async function register({ displayName, email, password, confirmPassword }) {
  const name = cleanPlainText(displayName, 70)
  const normalisedEmail = normaliseEmail(email)
  const fieldErrors = {}

  if (name.length < 2) fieldErrors.displayName = 'Enter at least two characters.'
  if (!isValidEmail(normalisedEmail)) fieldErrors.email = 'Enter a valid email address.'
  if (users.value.some((user) => user.email === normalisedEmail)) {
    fieldErrors.email = 'An account already uses this email address.'
  }
  const passwordError = validatePassword(password)
  if (passwordError) fieldErrors.password = passwordError
  if (password !== confirmPassword) fieldErrors.confirmPassword = 'Passwords do not match.'

  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors }

  const user = await buildUser({ displayName: name, email: normalisedEmail, password })
  users.value = [...users.value, user]
  if (!persistUsers()) return { ok: false, message: 'This browser could not save the account.' }

  safeWrite(SESSION_KEY, { userId: user.id })
  currentUser.value = publicUser(user)
  return { ok: true, user: currentUser.value }
}

export async function login({ email, password }) {
  const normalisedEmail = normaliseEmail(email)
  const user = users.value.find((candidate) => candidate.email === normalisedEmail)

  if (!user || !password) {
    return { ok: false, message: 'Email address or password is incorrect.' }
  }

  const candidateHash = await derivePasswordHash(password, base64ToBytes(user.salt))
  if (candidateHash !== user.passwordHash) {
    return { ok: false, message: 'Email address or password is incorrect.' }
  }

  safeWrite(SESSION_KEY, { userId: user.id })
  currentUser.value = publicUser(user)
  return { ok: true, user: currentUser.value }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
  currentUser.value = null
}

export function useAuth() {
  return {
    ready: readonly(ready),
    currentUser: readonly(currentUser),
    users: computed(() => users.value.map(publicUser)),
    isAuthenticated: computed(() => Boolean(currentUser.value)),
    isAdmin: computed(() => currentUser.value?.role === 'admin'),
  }
}

export const demoCredentials = Object.freeze({
  member: { email: demoAccounts[1].email, password: demoAccounts[1].password },
  admin: { email: demoAccounts[0].email, password: demoAccounts[0].password },
})
