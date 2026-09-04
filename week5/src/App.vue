<script setup>
import BHeader from './components/BHeader.vue'
</script>

<template>
  <header>
    <BHeader />
  </header>

  <main>
    <div class="page-shell">
      <router-view />
    </div>
  </main>
</template>

<style scoped>
.page-shell {
  width: min(1200px, 92vw);
  margin: 0 auto;
  padding: 1rem 0 3rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
</style>
