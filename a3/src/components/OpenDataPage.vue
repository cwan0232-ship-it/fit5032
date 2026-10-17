<script setup>
// BR F.1 - public REST API that lets partner organisations fetch UrbanCanopy data
import { ref } from 'vue'

const endpoints = [
  { path: '/api/sessions', description: 'All volunteer sessions with places left. Filters: ?type=Biodiversity, ?upcoming=true' },
  { path: '/api/sessions/school-canopy-2026-10-25', description: 'One session by its id.' },
  { path: '/api/sites', description: 'All planting sites. Filters: ?suburb=Clayton, ?status=Planted' },
  { path: '/api/stats', description: 'Live totals for members, bookings, sessions, sites and trees planted.' },
]

const activePath = ref('')
const response = ref('')
const loading = ref(false)

async function tryEndpoint(path) {
  activePath.value = path
  loading.value = true
  response.value = ''
  try {
    const result = await fetch(path, { headers: { Accept: 'application/json' } })
    const text = JSON.stringify(await result.json(), null, 2)
    response.value = `HTTP ${result.status}\n${text.length > 3000 ? `${text.slice(0, 3000)}\n…` : text}`
  } catch {
    response.value = 'The API could not be reached. Check your connection and try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main id="main-content" class="page-shell" tabindex="-1">
    <header class="page-heading">
      <h1>Open data API</h1>
      <p>Councils, schools and other groups can use our session and planting site data in their own tools. All routes return JSON and no key is needed.</p>
    </header>

    <div class="table-scroll">
      <table>
        <caption class="visually-hidden">REST API routes</caption>
        <thead><tr><th scope="col">Method</th><th scope="col">Route</th><th scope="col">Description</th><th scope="col">Try it</th></tr></thead>
        <tbody>
          <tr v-for="endpoint in endpoints" :key="endpoint.path">
            <td><span class="role-badge">GET</span></td>
            <td><code>{{ endpoint.path }}</code></td>
            <td>{{ endpoint.description }}</td>
            <td>
              <button class="button button-outline small" type="button" @click="tryEndpoint(endpoint.path)">
                Send<span class="visually-hidden"> GET {{ endpoint.path }}</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <section class="dashboard-section" aria-labelledby="response-title" aria-live="polite">
      <h2 id="response-title" class="small-heading">Response{{ activePath ? ` from ${activePath}` : '' }}</h2>
      <pre class="api-response" tabindex="0">{{ loading ? 'Loading…' : response || 'Choose “Send” on any route to see a live response.' }}</pre>
      <p class="field-help">Example: <code>curl https://fit5032-76ca9.web.app/api/stats</code></p>
    </section>
  </main>
</template>
