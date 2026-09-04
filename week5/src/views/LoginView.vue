<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AccessDeniedView from './AccessDeniedView.vue'
import { login } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const username = ref('')
const password = ref('')
const loginError = ref('')

const handleLogin = () => {
  loginError.value = ''

  if (!login(username.value, password.value)) {
    loginError.value = 'Incorrect username or password.'
    return
  }

  const destination =
    typeof route.query.redirect === 'string' ? route.query.redirect : { name: 'About' }
  router.push(destination)
}
</script>

<template>
  <section class="login-card card shadow-sm border-0 p-4 p-md-5">
    <AccessDeniedView v-if="route.query.denied === '1'" />
    <h1 class="h2">Member login</h1>
    <p class="text-secondary">Use the demo credentials to access the protected About page.</p>

    <form @submit.prevent="handleLogin" novalidate>
      <div class="mb-3">
        <label for="login-username" class="form-label">Username</label>
        <input id="login-username" v-model="username" class="form-control" autocomplete="username" />
      </div>
      <div class="mb-3">
        <label for="login-password" class="form-label">Password</label>
        <input
          id="login-password"
          v-model="password"
          type="password"
          class="form-control"
          autocomplete="current-password"
        />
      </div>
      <div v-if="loginError" class="alert alert-danger py-2" role="alert">{{ loginError }}</div>
      <button type="submit" class="btn btn-primary">Login</button>
    </form>

    <div class="demo-credentials mt-4 p-3 rounded">
      <strong>Demo credentials</strong>
      <div>Username: <code>library</code></div>
      <div>Password: <code>Vue5032!</code></div>
    </div>
  </section>
</template>

<style scoped>
.login-card {
  max-width: 560px;
  margin: 2rem auto;
}

.demo-credentials {
  background: #f6f8fa;
}
</style>
