<script setup>
import { reactive, ref } from 'vue'
import { demoCredentials, login, register } from '../services/auth.js'

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

function useDemo(account) {
  changeMode('login')
  form.email = account.email
  form.password = account.password
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
      <p class="section-kicker">Account</p>
      <h1 id="auth-title">One account. More local action.</h1>
      <p>
        Sign in to rate projects and manage your profile.
      </p>
      <div class="demo-panel" aria-labelledby="demo-title">
        <h2 id="demo-title">Demonstration accounts</h2>
        <p>Local accounts for testing each role.</p>
        <div class="demo-actions">
          <button class="text-button" type="button" @click="useDemo(demoCredentials.member)">
            Use member
          </button>
          <button class="text-button" type="button" @click="useDemo(demoCredentials.admin)">
            Use admin
          </button>
        </div>
      </div>
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
