<script setup>
defineProps({
  currentPage: { type: String, required: true },
  currentUser: { type: Object, default: null },
  isAdmin: { type: Boolean, default: false },
})
const emit = defineEmits(['navigate', 'logout'])
</script>

<template>
  <header class="site-header">
    <a class="brand" href="#/home" aria-label="UrbanCanopy Melbourne home" @click.prevent="emit('navigate', 'home')">
      <span class="brand-mark" aria-hidden="true">UC</span>
      <span><strong>UrbanCanopy</strong><small>Melbourne</small></span>
    </a>
    <nav class="primary-nav" aria-label="Primary navigation">
      <a href="#/home" :aria-current="currentPage === 'home' ? 'page' : undefined" @click.prevent="emit('navigate', 'home')">Home</a>
      <a href="#/ratings" :aria-current="currentPage === 'ratings' ? 'page' : undefined" @click.prevent="emit('navigate', 'ratings')">Ratings</a>
      <a v-if="currentUser" href="#/account" :aria-current="currentPage === 'account' ? 'page' : undefined" @click.prevent="emit('navigate', 'account')">My account</a>
      <a v-if="isAdmin" href="#/admin" :aria-current="currentPage === 'admin' ? 'page' : undefined" @click.prevent="emit('navigate', 'admin')">Dashboard</a>
      <a v-if="!currentUser" href="#/auth" :aria-current="currentPage === 'auth' ? 'page' : undefined" @click.prevent="emit('navigate', 'auth')">Sign in</a>
      <button v-else class="nav-button" type="button" @click="emit('logout')">Sign out</button>
    </nav>
  </header>
</template>
