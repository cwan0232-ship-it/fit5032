<script setup>
import BHeader from './components/BHeader.vue'
import { configured } from './Firebase/init'
</script>

<template>
  <BHeader />
  <main>
    <p v-if="!configured" class="notice">
      Firebase configuration is required. Add the web app settings to .env.local
      and restart the server.
    </p>
    <RouterView />
  </main>
  <footer>NoMash Library <span>FIT5032 · Week 10</span></footer>
</template>
