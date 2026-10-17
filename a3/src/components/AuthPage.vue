<script setup>
import { reactive, ref } from 'vue'
import { login, loginWithGoogle, register } from '../services/auth.js'

const emit = defineEmits(['authenticated'])
const mode = ref('login')
const busy = ref(false)
const message = ref('')
const fieldErrors = reactive({ displayName: '', email: '', password: '', confirmPassword: '' })
const form = reactive({ displayName: '', email: '', password: '', confirmPassword: '' })

function resetFeedback() {
  message.value = ''
  Object.keys(fieldErrors).forEach((key) => { fieldErrors[key] = '' })
}

function changeMode(nextMode) {
  mode.value = nextMode
  resetFeedback()
  form.password = ''
  form.confirmPassword = ''
}

async function signInWithGoogle() {
  resetFeedback()
  busy.value = true
  const result = await loginWithGoogle()
  busy.value = false
  if (result.ok) emit('authenticated', result.user)
  else message.value = result.message
}

async function submit() {
  resetFeedback()
  busy.value = true
  try {
    const result = mode.value === 'login' ? await login(form) : await register(form)
    if (result.fieldErrors) Object.assign(fieldErrors, result.fieldErrors)
    if (!result.ok) {
      message.value = result.message || 'Check the highlighted fields and try again.'
      return
    }
    emit('authenticated', result.user)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main id="main-content" class="page-shell auth-page" tabindex="-1">
    <section class="auth-intro" aria-labelledby="auth-title">
      <h1 id="auth-title">Sign in or join</h1>
      <p>
        Sign in to book sessions, rate projects and manage your bookings.
      </p>
      <p class="demo-panel">
        Use your Google account, or create an account with your email address. New accounts join as community members.
      </p>
    </section>

    <section class="auth-card" :aria-labelledby="`${mode}-title`">
      <div class="auth-tabs" role="tablist" aria-label="Account options">
        <button
          id="login-tab"
          type="button"
          role="tab"
          :aria-selected="mode === 'login'"
          :class="{ active: mode === 'login' }"
          @click="changeMode('login')"
        >
          Sign in
        </button>
        <button
          id="register-tab"
          type="button"
          role="tab"
          :aria-selected="mode === 'register'"
          :class="{ active: mode === 'register' }"
          @click="changeMode('register')"
        >
          Register
        </button>
      </div>
      <div class="external-auth">
        <button class="button button-outline google-button" type="button" :disabled="busy" @click="signInWithGoogle">
          <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
            <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
          </svg>
          Continue with Google
        </button>
        <p class="auth-divider"><span>or use your email</span></p>
      </div>

      <form class="stack-form" novalidate @submit.prevent="submit">
        <h2 :id="`${mode}-title`">{{ mode === 'login' ? 'Welcome back' : 'Create a member account' }}</h2>

        <div v-if="mode === 'register'" class="field-group">
          <label for="account-name">Full name</label>
          <input
            id="account-name"
            v-model="form.displayName"
            type="text"
            autocomplete="name"
            maxlength="70"
            :aria-invalid="Boolean(fieldErrors.displayName)"
            aria-describedby="account-name-error"
          >
          <p id="account-name-error" class="field-error">{{ fieldErrors.displayName }}</p>
        </div>

        <div class="field-group">
          <label for="account-email">Email address</label>
          <input
            id="account-email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            maxlength="160"
            :aria-invalid="Boolean(fieldErrors.email)"
            aria-describedby="account-email-error"
          >
          <p id="account-email-error" class="field-error">{{ fieldErrors.email }}</p>
        </div>

        <div class="field-group">
          <label for="account-password">Password</label>
          <input
            id="account-password"
            v-model="form.password"
            type="password"
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            minlength="10"
            maxlength="72"
            :aria-invalid="Boolean(fieldErrors.password)"
            :aria-describedby="mode === 'register' ? 'password-help account-password-error' : 'account-password-error'"
          >
          <p v-if="mode === 'register'" id="password-help" class="field-help">
            Use 10–72 characters with uppercase, lowercase and a number.
          </p>
          <p id="account-password-error" class="field-error">{{ fieldErrors.password }}</p>
        </div>

        <div v-if="mode === 'register'" class="field-group">
          <label for="confirm-password">Confirm password</label>
          <input
            id="confirm-password"
            v-model="form.confirmPassword"
            type="password"
            autocomplete="new-password"
            maxlength="72"
            :aria-invalid="Boolean(fieldErrors.confirmPassword)"
            aria-describedby="confirm-password-error"
          >
          <p id="confirm-password-error" class="field-error">{{ fieldErrors.confirmPassword }}</p>
        </div>

        <p v-if="message" class="form-alert" role="alert">{{ message }}</p>
        <button class="button button-primary" type="submit" :disabled="busy">
          {{ busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account' }}
        </button>
      </form>
    </section>
  </main>
</template>
