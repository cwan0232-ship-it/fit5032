<script setup>
import { onMounted, ref } from 'vue'
import { logout } from '../stores/auth'
import { auth } from '../Firebase/init'
const done = ref(false),
  error = ref('')
onMounted(async () => {
  try {
    if (auth) await logout()
    done.value = true
  } catch (e) {
    error.value = `Unable to sign out (${e.code}).`
  }
})
</script>
<template>
  <section class="hero">
    <p class="eyebrow">UNTIL NEXT TIME</p>
    <h1>{{ done ? 'You are signed out.' : 'Signing out…' }}</h1>
    <p v-if="done" role="status">Your session has ended. See you again soon.</p>
    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <RouterLink class="button" to="/FireLogin">Sign in again</RouterLink>
  </section>
</template>
