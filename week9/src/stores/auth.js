import { reactive } from 'vue'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import db, { auth } from '../Firebase/init'

export const session = reactive({
  user: null,
  role: null,
  ready: false,
  error: '',
})

export async function refreshSession(user = auth?.currentUser) {
  session.user = user || null
  session.role = null
  session.error = ''
  if (user) {
    try {
      const profile = await getDoc(doc(db, 'users', user.uid))
      session.role = profile.exists() ? profile.data().role : 'member'
    } catch (error) {
      session.error = `Unable to load role: ${error.code}`
    }
  }
}

export const authReady = new Promise((resolve) => {
  if (!auth) {
    session.ready = true
    resolve()
    return
  }
  onAuthStateChanged(auth, async (user) => {
    await refreshSession(user)
    session.ready = true
    console.info(
      'Current user:',
      user
        ? {
            uid: user.uid,
            email: user.email,
            role: session.role,
          }
        : null,
    )
    resolve()
  })
})

export async function logout() {
  await signOut(auth)
  await refreshSession(null)
  console.info('Signed out. Current user:', auth.currentUser)
}
