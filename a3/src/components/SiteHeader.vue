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
    <a class="brand" href="#/home" @click.prevent="emit('navigate', 'home')">
      <svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path d="M16 3C9 9 6 15 8 21c1.6 4.6 5 7 8 8 3-1 6.4-3.4 8-8 2-6-1-12-8-18Z" fill="currentColor" />
        <path d="M16 9v20M16 16l-4-3M16 21l5-4" stroke="#fbfaf6" stroke-width="1.6" stroke-linecap="round" fill="none" />
      </svg>
      <span><strong>UrbanCanopy</strong><small>Melbourne</small></span>
    </a>
    <nav class="primary-nav" aria-label="Primary navigation">
      <a href="#/home" :aria-current="currentPage === 'home' ? 'page' : undefined" @click.prevent="emit('navigate', 'home')">Home</a>
      <a href="#/sessions" :aria-current="currentPage === 'sessions' ? 'page' : undefined" @click.prevent="emit('navigate', 'sessions')">Sessions</a>
      <a href="#/sites" :aria-current="currentPage === 'sites' ? 'page' : undefined" @click.prevent="emit('navigate', 'sites')">Sites</a>
      <a href="#/map" :aria-current="currentPage === 'map' ? 'page' : undefined" @click.prevent="emit('navigate', 'map')">Map</a>
      <a href="#/ratings" :aria-current="currentPage === 'ratings' ? 'page' : undefined" @click.prevent="emit('navigate', 'ratings')">Ratings</a>
      <a v-if="currentUser" href="#/account" :aria-current="currentPage === 'account' ? 'page' : undefined" @click.prevent="emit('navigate', 'account')">My account</a>
      <a v-if="isAdmin" href="#/admin" :aria-current="currentPage === 'admin' ? 'page' : undefined" @click.prevent="emit('navigate', 'admin')">Dashboard</a>
      <a v-if="!currentUser" href="#/auth" :aria-current="currentPage === 'auth' ? 'page' : undefined" @click.prevent="emit('navigate', 'auth')">Sign in</a>
      <button v-else class="nav-button" type="button" @click="emit('logout')">Sign out</button>
    </nav>
  </header>
</template>
