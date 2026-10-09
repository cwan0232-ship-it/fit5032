<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BHeader from './components/BHeader.vue'
import { configured } from './Firebase/init'

const route = useRoute()

// API pages only show the raw JSON, so hide the header and footer there
const showHeader = computed(
  () => !['CountBookAPI', 'GetAllBookAPI'].includes(route.name),
)
</script>

<template>
  <BHeader v-if="showHeader" />
  <main v-if="showHeader">
    <p v-if="!configured" class="notice">
      Firebase configuration is required. Add the web app settings to .env.local
      and restart the server.
    </p>
    <RouterView />
  </main>
  <RouterView v-else />
  <footer v-if="showHeader">
    NoMash Library <span>FIT5032 · Week 9 &amp; 10</span>
  </footer>
</template>
