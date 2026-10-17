<script setup>
// Offline feature: tell people when the connection drops and what still works
import { onBeforeUnmount, onMounted, ref } from 'vue'

const online = ref(navigator.onLine)
const goOnline = () => { online.value = true }
const goOffline = () => { online.value = false }

onMounted(() => {
  window.addEventListener('online', goOnline)
  window.addEventListener('offline', goOffline)
})
onBeforeUnmount(() => {
  window.removeEventListener('online', goOnline)
  window.removeEventListener('offline', goOffline)
})
</script>

<template>
  <p class="offline-banner" role="status" aria-live="polite" :hidden="online">
    You are offline. Saved bookings and your volunteer form draft are still available. Changes will sync when you reconnect.
  </p>
</template>
