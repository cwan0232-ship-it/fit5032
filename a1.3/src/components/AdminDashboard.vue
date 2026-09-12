<script setup>
import { computed } from 'vue'
import { useRatings } from '../services/ratings.js'

const props = defineProps({
  users: { type: Array, required: true },
  projects: { type: Array, required: true },
})
const { ratings, summaries } = useRatings()
const memberCount = computed(() => props.users.filter((user) => user.role === 'member').length)
const highestRated = computed(() => props.projects
  .map((project) => ({ ...project, ...(summaries.value[project.id] ?? { average: 0, count: 0 }) }))
  .sort((a, b) => b.average - a.average)[0])
</script>

<template>
  <main id="main-content" class="page-shell admin-page" tabindex="-1">
    <header class="page-heading">
      <p class="section-kicker">Admin</p>
      <h1>Community overview.</h1>
      <p>Accounts, roles and project feedback.</p>
    </header>

    <section class="metric-grid" aria-label="Community metrics">
      <article><span>Registered accounts</span><strong>{{ users.length }}</strong></article>
      <article><span>Community members</span><strong>{{ memberCount }}</strong></article>
      <article><span>Ratings recorded</span><strong>{{ ratings.length }}</strong></article>
      <article><span>Active projects</span><strong>{{ projects.length }}</strong></article>
    </section>

    <section class="dashboard-section" aria-labelledby="users-title">
      <div class="section-heading">
        <div><p class="section-kicker">Access</p><h2 id="users-title">User roles</h2></div>
      </div>
      <div class="table-scroll" tabindex="0" aria-label="Scrollable user account table">
        <table>
          <thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Created</th></tr></thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.displayName }}</td><td>{{ user.email }}</td><td><span class="role-badge">{{ user.role }}</span></td>
              <td>{{ new Date(user.createdAt).toLocaleDateString('en-AU') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="highestRated" class="dashboard-highlight" aria-labelledby="highlight-title">
      <p class="section-kicker">Top rated</p>
      <h2 id="highlight-title">{{ highestRated.title }}</h2>
      <p>
        Current leading project with an average of
        <strong>{{ highestRated.average.toFixed(1) }} / 5</strong> from {{ highestRated.count }}
        rating{{ highestRated.count === 1 ? '' : 's' }}.
      </p>
    </section>
  </main>
</template>
