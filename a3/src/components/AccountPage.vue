<script setup>
defineProps({ currentUser: { type: Object, required: true } })
</script>

<template>
  <main id="main-content" class="page-shell account-page" tabindex="-1">
    <header class="page-heading compact-heading">
      <p class="section-kicker">Profile</p>
      <h1>Your account.</h1>
      <p>Your details and access level.</p>
    </header>
    <section class="profile-card" aria-labelledby="profile-title">
      <div class="profile-avatar" aria-hidden="true">{{ currentUser.displayName.slice(0, 1).toUpperCase() }}</div>
      <div>
        <p class="role-badge">{{ currentUser.role === 'admin' ? 'Administrator' : 'Community member' }}</p>
        <h2 id="profile-title">{{ currentUser.displayName }}</h2>
        <dl class="profile-details">
          <div><dt>Email</dt><dd>{{ currentUser.email }}</dd></div>
          <div><dt>Access level</dt><dd>{{ currentUser.role }}</dd></div>
          <div><dt>Account created</dt><dd>{{ new Date(currentUser.createdAt).toLocaleDateString('en-AU') }}</dd></div>
        </dl>
      </div>
    </section>
  </main>
</template>
