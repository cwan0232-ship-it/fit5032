import { computed, ref } from 'vue'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../firebase/init.js'
import sessions from '../data/sessions.json'

const stats = ref({})
const bookings = ref([])
let stopStats = null
let stopBookings = null

// Places booked per session are public, so the calendar can show availability to everyone
export function watchSessionStats() {
  stopStats ??= onSnapshot(collection(db, 'sessionStats'), (snapshot) => {
    stats.value = Object.fromEntries(snapshot.docs.map((doc) => [doc.id, doc.data().booked ?? 0]))
  })
}

// Members see their own bookings; administrators see every booking
export function watchBookings(user) {
  stopBookings?.()
  stopBookings = null
  bookings.value = []
  if (!user) return
  const source = collection(db, 'bookings')
  const bookingQuery = user.role === 'admin' ? source : query(source, where('uid', '==', user.id))
  stopBookings = onSnapshot(bookingQuery, (snapshot) => {
    bookings.value = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => a.start.localeCompare(b.start))
  })
}

export function useSessions() {
  const withAvailability = computed(() => sessions.map((session) => {
    const booked = stats.value[session.id] ?? 0
    return { ...session, booked, placesLeft: Math.max(0, session.capacity - booked) }
  }))
  return { sessions: withAvailability, bookings }
}

function friendlyError(error) {
  // Remove the SDK prefix and status suffix so people see only the readable reason
  return error?.message?.replace(/^.*?: /, '').replace(/\s*\[\d{3}\]$/, '') || 'Something went wrong. Please try again.'
}

export async function bookSession(sessionId) {
  try {
    const { data } = await httpsCallable(functions, 'createBooking')({ sessionId })
    return { ok: true, booking: data }
  } catch (error) {
    return { ok: false, message: friendlyError(error) }
  }
}

export async function cancelBooking(bookingId) {
  try {
    await httpsCallable(functions, 'cancelBooking')({ bookingId })
    return { ok: true }
  } catch (error) {
    return { ok: false, message: friendlyError(error) }
  }
}

export async function sendEmail(payload) {
  try {
    const { data } = await httpsCallable(functions, 'sendEmail')(payload)
    return { ok: true, ...data }
  } catch (error) {
    return { ok: false, message: friendlyError(error) }
  }
}

export async function sendBulkEmail(payload) {
  try {
    const { data } = await httpsCallable(functions, 'sendBulkEmail')(payload)
    return { ok: true, ...data }
  } catch (error) {
    return { ok: false, message: friendlyError(error) }
  }
}
