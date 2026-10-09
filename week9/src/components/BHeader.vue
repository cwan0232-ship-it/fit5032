<script setup>
import { session } from '../stores/auth'
</script>

<template>
  <header>
    <RouterLink to="/" class="brand">NoMash<span>Library</span></RouterLink>
    <nav aria-label="Main navigation">
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/GetBookCount">Get Book Count</RouterLink>
      <template v-if="session.user">
        <RouterLink to="/account">My account</RouterLink>
        <RouterLink v-if="session.role === 'librarian'" to="/addbook"
          >Add book</RouterLink
        >
        <RouterLink to="/logout">Log out</RouterLink>
      </template>
      <template v-else>
        <RouterLink to="/FireLogin">Sign in</RouterLink>
        <RouterLink to="/FireRegister">Register</RouterLink>
      </template>
    </nav>
    <span v-if="session.user" class="badge">{{
      session.role || 'Loading role'
    }}</span>
  </header>
</template>
