import { computed, readonly, ref } from 'vue'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/init.js'
import { cleanPlainText, isValidEmail, normaliseEmail, validatePassword } from './security.js'

// BR D.1 - Firebase Authentication with a member profile and role kept in Firestore
const PROFILES = 'members'
const users = ref([])
const currentUser = ref(null)
const ready = ref(false)
let readyPromise = null

const authMessages = {
  'auth/email-already-in-use': { field: 'email', text: 'An account already uses this email address.' },
  'auth/invalid-email': { field: 'email', text: 'Enter a valid email address.' },
  'auth/weak-password': { field: 'password', text: 'Choose a stronger password.' },
  'auth/too-many-requests': { text: 'Too many attempts. Wait a moment and try again.' },
  'auth/network-request-failed': { text: 'Check your internet connection and try again.' },
}

async function loadProfile(user) {
  const snapshot = await getDoc(doc(db, PROFILES, user.uid))
  const profile = snapshot.exists() ? snapshot.data() : {}
  return {
    id: user.uid,
    displayName: profile.displayName || user.displayName || user.email,
    email: user.email,
    role: profile.role === 'admin' ? 'admin' : 'member',
    createdAt: profile.createdAt || user.metadata.creationTime,
  }
}

async function loadUsers() {
  if (currentUser.value?.role !== 'admin') {
    users.value = currentUser.value ? [currentUser.value] : []
    return
  }
  const snapshot = await getDocs(collection(db, PROFILES))
  users.value = snapshot.docs.map((record) => ({ id: record.id, ...record.data() }))
}

export function initialiseAuth() {
  readyPromise ??= new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      try {
        currentUser.value = user ? await loadProfile(user) : null
        await loadUsers()
      } catch (error) {
        console.error('Could not load the account profile:', error.code || error.message)
      } finally {
        ready.value = true
        resolve()
      }
    })
  })
  return readyPromise
}

function failure(error) {
  const known = authMessages[error.code]
  if (known?.field) return { ok: false, fieldErrors: { [known.field]: known.text } }
  return { ok: false, message: known?.text || 'Something went wrong. Please try again.' }
}

export async function register({ displayName, email, password, confirmPassword }) {
  const name = cleanPlainText(displayName, 70)
  const normalisedEmail = normaliseEmail(email)
  const fieldErrors = {}

  if (name.length < 2) fieldErrors.displayName = 'Enter at least two characters.'
  if (!isValidEmail(normalisedEmail)) fieldErrors.email = 'Enter a valid email address.'
  const passwordError = validatePassword(password)
  if (passwordError) fieldErrors.password = passwordError
  if (password !== confirmPassword) fieldErrors.confirmPassword = 'Passwords do not match.'

  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors }

  try {
    const { user } = await createUserWithEmailAndPassword(auth, normalisedEmail, password)
    await updateProfile(user, { displayName: name })
    const profile = {
      displayName: name,
      email: normalisedEmail,
      role: 'member',
      createdAt: new Date().toISOString(),
    }
    await setDoc(doc(db, PROFILES, user.uid), profile)
    currentUser.value = { id: user.uid, ...profile }
    await loadUsers()
    return { ok: true, user: currentUser.value }
  } catch (error) {
    return failure(error)
  }
}

export async function login({ email, password }) {
  const normalisedEmail = normaliseEmail(email)
  if (!isValidEmail(normalisedEmail) || !password) {
    return { ok: false, message: 'Email address or password is incorrect.' }
  }

  try {
    const { user } = await signInWithEmailAndPassword(auth, normalisedEmail, password)
    currentUser.value = await loadProfile(user)
    await loadUsers()
    return { ok: true, user: currentUser.value }
  } catch (error) {
    if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(error.code)) {
      return { ok: false, message: 'Email address or password is incorrect.' }
    }
    return failure(error)
  }
}

export async function logout() {
  await signOut(auth)
  currentUser.value = null
  users.value = []
}

export function useAuth() {
  return {
    ready: readonly(ready),
    currentUser: readonly(currentUser),
    users: computed(() => users.value),
    isAuthenticated: computed(() => Boolean(currentUser.value)),
    isAdmin: computed(() => currentUser.value?.role === 'admin'),
  }
}
