<script setup>
import { ref } from 'vue'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import db, { auth, configured } from '../Firebase/init'
import { refreshSession } from '../stores/auth'

const name = ref(''),
  email = ref(''),
  password = ref('')
const busy = ref(false),
  message = ref(''),
  error = ref('')

async function register() {
  busy.value = true
  error.value = message.value = ''
  try {
    const result = await createUserWithEmailAndPassword(
      auth,
      email.value.trim(),
      password.value,
    )
    await updateProfile(result.user, { displayName: name.value.trim() })
    await setDoc(doc(db, 'users', result.user.uid), {
      name: name.value.trim(),
      email: result.user.email,
      role: 'member',
    })
    await refreshSession(result.user)
    message.value = `Account created for ${result.user.email}. Role: member.`
    console.info('Registered user:', {
      uid: result.user.uid,
      email: result.user.email,
      role: 'member',
    })
    password.value = ''
  } catch (e) {
    error.value = `Registration failed (${e.code || e.message}).`
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="auth-layout">
    <div>
      <p class="eyebrow">BECOME A MEMBER</p>
      <h1>Your next chapter<br />starts here.</h1>
      <p>Create an account to join the library.</p>
    </div>
    <form class="panel" @submit.prevent="register">
      <h2>Create an account</h2>
      <label for="name">Full name</label
      ><input
        id="name"
        v-model="name"
        required
        maxlength="80"
        autocomplete="name"
      />
      <label for="email">Email address</label
      ><input
        id="email"
        v-model="email"
        type="email"
        required
        maxlength="254"
        autocomplete="email"
      />
      <label for="password">Password</label
      ><input
        id="password"
        v-model="password"
        type="password"
        required
        minlength="8"
        autocomplete="new-password"
      />
      <p class="hint">Use at least 8 characters.</p>
      <button :disabled="busy || !configured">
        {{ busy ? 'Creating account…' : 'Create account' }}
      </button>
      <p v-if="message" role="status" class="success">{{ message }}</p>
      <p v-if="error" role="alert" class="error">{{ error }}</p>
      <p class="hint">
        Already a member? <RouterLink to="/FireLogin">Sign in</RouterLink>
      </p>
    </form>
  </section>
</template>
