<script setup>
import { useRoute } from 'vue-router'
import { session } from '../stores/auth'
import BookList from '../components/BookList.vue'
const route = useRoute()
</script>
<template>
  <p class="eyebrow">MY LIBRARY</p>
  <h1>Welcome, {{ session.user?.displayName || 'reader' }}.</h1>
  <div class="account-summary">
    <p>{{ session.user?.email }}</p>
    <span class="badge">{{ session.role }}</span>
  </div>
  <p v-if="route.query.denied" role="alert" class="notice">
    Only librarians can add or manage books. Your member account can browse the
    collection.
  </p>
  <p v-if="session.error" role="alert" class="error">{{ session.error }}</p>
  <p v-if="session.role === 'librarian'">
    <RouterLink class="button" to="/addbook">Manage books</RouterLink>
  </p>
  <p v-else>Your membership gives you access to the library catalogue.</p>
  <BookList />
</template>
