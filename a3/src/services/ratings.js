import { ref } from 'vue'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { auth, db, functions } from '../firebase/init.js'

// Project averages are public; each person can only see their own scores
const summaries = ref({})
const ratings = ref([])
let stopSummaries = null
let stopRatings = null

export function watchRatings(user, attempt = 0) {
  stopSummaries ??= onSnapshot(collection(db, 'projectStats'), (snapshot) => {
    summaries.value = Object.fromEntries(snapshot.docs.map((doc) => [doc.id, doc.data()]))
  })
  stopRatings?.()
  stopRatings = null
  ratings.value = []
  if (!user) return
  stopRatings = onSnapshot(query(collection(db, 'ratings'), where('uid', '==', user.id)), (snapshot) => {
    ratings.value = snapshot.docs.map((doc) => ({ id: doc.id, userId: doc.data().uid, ...doc.data() }))
  }, () => {
    // Right after sign-in Firestore can briefly lack the new token; try again once it arrives
    if (attempt < 3) setTimeout(() => { if (auth.currentUser?.uid === user.id) watchRatings(user, attempt + 1) }, 1500)
  })
}

// BR E.1 - the submitRating Cloud Function validates the score and updates the average
export async function saveRating({ projectId, score }) {
  const numericScore = Number(score)
  if (!projectId || !Number.isInteger(numericScore) || numericScore < 1 || numericScore > 5) {
    return { ok: false, message: 'Choose a rating from 1 to 5.' }
  }
  try {
    const { data } = await httpsCallable(functions, 'submitRating')({ projectId, score: numericScore })
    return { ok: true, ...data }
  } catch (error) {
    return { ok: false, message: error?.message?.replace(/^.*?: /, '').replace(/\s*\[\d{3}\]$/, '') || 'The rating could not be saved.' }
  }
}

export function useRatings() {
  return { ratings, summaries }
}
