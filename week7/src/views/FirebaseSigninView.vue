<script setup>
import { ref } from 'vue'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, configured } from '../Firebase/init'
import { refreshSession, session } from '../stores/auth'

const email = ref(''),
  password = ref('')
const busy = ref(false),
  message = ref(''),
  error = ref('')

async function signin() {
  busy.value = true
  error.value = message.value = ''
  try {
    await signInWithEmailAndPassword(auth, email.value.trim(), password.value)
    await refreshSession(auth.currentUser)
    console.info('Signed in. Current user:', {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      role: session.role,
    })
    message.value = `Signed in as ${auth.currentUser.email}. Role: ${session.role}.`
    password.value = ''
  } catch (e) {
    error.value = `Sign in failed (${e.code || e.message}).`
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="auth-layout">
    <div>
      <p class="eyebrow">WELCOME BACK</p>
      <h1>Make room<br />for a new story.</h1>
      <p>Sign in to your library account.</p>
    </div>
    <form class="panel" @submit.prevent="signin">
      <h2>Sign in</h2>
      <label for="email">Email address</label
      ><input
        id="email"
        v-model="email"
        type="email"
        required
        autocomplete="username"
      />
      <label for="password">Password</label
      ><input
        id="password"
        v-model="password"
        type="password"
        required
        autocomplete="current-password"
      />
      <button :disabled="busy || !configured">
        {{ busy ? 'Signing in…' : 'Sign in' }}
      </button>
      <p v-if="message" role="status" class="success">{{ message }}</p>
      <p v-if="error" role="alert" class="error">{{ error }}</p>
      <RouterLink v-if="session.user" class="text-link" to="/account"
        >Continue to my account →</RouterLink
      >
      <p class="hint">
        New here? <RouterLink to="/FireRegister">Create an account</RouterLink>
      </p>
    </form>
  </section>
</template>
