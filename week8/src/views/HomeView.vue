<script setup>
import { session } from '../stores/auth'
</script>
<template>
  <section class="hero">
    <p class="eyebrow">YOUR COMMUNITY LIBRARY</p>
    <h1>A good book.<br />A new perspective.</h1>
    <p>Find your next read and keep our collection growing.</p>
    <RouterLink class="button" :to="session.user ? '/account' : '/FireLogin'">{{
      session.user ? 'My library account' : 'Sign in to the library'
    }}</RouterLink>
  </section>
  <div class="features">
    <article>
      <span class="number">01</span>
      <h2>Your account</h2>
      <p>Register and sign in with your email.</p>
    </article>
    <article>
      <span class="number">02</span>
      <h2>Member access</h2>
      <p>Explore the collection with your library membership.</p>
    </article>
    <article>
      <span class="number">03</span>
      <h2>Library care</h2>
      <p>Librarians add, update and organise books.</p>
    </article>
  </div>
</template>
