<script setup>
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AuthPage from './components/AuthPage.vue'
import HeroSection from './components/HeroSection.vue'
import OfflineBanner from './components/OfflineBanner.vue'
import ProjectExplorer from './components/ProjectExplorer.vue'
import RatingsPage from './components/RatingsPage.vue'
import SiteHeader from './components/SiteHeader.vue'
import VolunteerForm from './components/VolunteerForm.vue'
import { projects } from './data/projects.js'
import { initialiseAuth, logout, useAuth } from './services/auth.js'
import { useSessions, watchBookings, watchSessionStats } from './services/bookings.js'
import { watchRatings } from './services/ratings.js'

// Larger pages (map, calendar, charts, PDF export) load only when they are opened
const AccountPage = defineAsyncComponent(() => import('./components/AccountPage.vue'))
const AdminDashboard = defineAsyncComponent(() => import('./components/AdminDashboard.vue'))
const MapPage = defineAsyncComponent(() => import('./components/MapPage.vue'))
const OpenDataPage = defineAsyncComponent(() => import('./components/OpenDataPage.vue'))
const SessionsPage = defineAsyncComponent(() => import('./components/SessionsPage.vue'))
const SitesPage = defineAsyncComponent(() => import('./components/SitesPage.vue'))

const selectedProjectId = ref(projects[0]?.id ?? '')
const currentPage = ref('home')
const routeParams = ref({})
const routeMessage = ref('')
const returnPage = ref('home')
const { currentUser, users, isAdmin, ready } = useAuth()
const { sessions } = useSessions()
const validPages = new Set(['home', 'sessions', 'sites', 'map', 'ratings', 'api', 'auth', 'account', 'admin'])
const pageTitles = {
  home: 'Home', sessions: 'Book a session', sites: 'Planting sites', map: 'Map', ratings: 'Ratings',
  api: 'Open data', auth: 'Sign in', account: 'My account', admin: 'Dashboard',
}

// The hero shows the next session that still has places
const nextEvent = computed(() => {
  const session = sessions.value.find((item) => new Date(item.start) > new Date() && item.placesLeft > 0)
    ?? sessions.value[sessions.value.length - 1]
  return {
    title: session.title,
    date: session.start.slice(0, 10),
    suburb: session.suburb,
    capacity: session.capacity,
    registered: session.booked,
  }
})

function selectProject(projectId) {
  selectedProjectId.value = projectId
}

function parseHash() {
  const [path, queryString = ''] = window.location.hash.replace(/^#\/?/, '').split('?')
  const page = path.split('/')[0]
  return { page: validPages.has(page) ? page : 'home', params: Object.fromEntries(new URLSearchParams(queryString)) }
}

function focusMain() {
  nextTick(() => document.querySelector('#main-content')?.focus())
}

function navigate(page, params = {}, options = {}) {
  routeMessage.value = ''
  let destination = validPages.has(page) ? page : 'home'

  if ((destination === 'account' || destination === 'admin') && !currentUser.value) {
    returnPage.value = destination
    routeMessage.value = 'Sign in to access that page.'
    destination = 'auth'
  } else if (destination === 'admin' && !isAdmin.value) {
    routeMessage.value = 'The community dashboard is available to administrators only.'
    destination = 'account'
  }

  currentPage.value = destination
  routeParams.value = params
  const query = new URLSearchParams(params).toString()
  const nextHash = `#/${destination}${query ? `?${query}` : ''}`
  if (window.location.hash !== nextHash) {
    history[options.replace ? 'replaceState' : 'pushState'](null, '', nextHash)
  }
  document.title = `${pageTitles[destination]} · UrbanCanopy Melbourne`
  window.scrollTo({ top: 0, behavior: 'auto' })
  focusMain()
}

function handleHashChange() {
  // In-page anchors such as the skip link (#main-content) are not routes
  if (window.location.hash && !window.location.hash.startsWith('#/')) return
  const { page, params } = parseHash()
  navigate(page, params, { replace: true })
}

function handleAuthenticated() {
  const destination = returnPage.value
  returnPage.value = 'home'
  navigate(destination === 'admin' && !isAdmin.value ? 'account' : destination)
}

async function handleLogout() {
  await logout()
  navigate('home', {}, { replace: true })
  routeMessage.value = 'You have signed out safely.'
}

function requestLogin(destination = 'ratings') {
  returnPage.value = destination
  navigate('auth')
  routeMessage.value = destination === 'sessions'
    ? 'Sign in or create an account to book a session.'
    : 'Sign in or create an account to rate a project.'
}

// Keep the signed-in person's bookings (or all bookings for admins) in sync with Firestore
watch(currentUser, (user) => {
  watchBookings(user)
  watchRatings(user)
}, { immediate: true })

onMounted(async () => {
  watchSessionStats()
  await initialiseAuth()
  handleHashChange()
  window.addEventListener('hashchange', handleHashChange)
})

onBeforeUnmount(() => window.removeEventListener('hashchange', handleHashChange))
</script>

<template>
  <div class="site-shell">
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <SiteHeader
      :current-page="currentPage"
      :current-user="currentUser"
      :is-admin="isAdmin"
      @navigate="navigate"
      @logout="handleLogout"
    />
    <OfflineBanner />
    <p v-if="routeMessage" class="route-message" role="status">{{ routeMessage }}</p>

    <div v-if="!ready" class="loading-state" role="status">Connecting to your account…</div>

    <main v-else-if="currentPage === 'home'" id="main-content" tabindex="-1">
      <HeroSection :next-event="nextEvent" :project-count="projects.length" />
      <ProjectExplorer :projects="projects" @select-project="selectProject" />
      <VolunteerForm :projects="projects" :selected-project-id="selectedProjectId" />
      <section id="about" class="content-section about-section" aria-labelledby="about-title">
        <div>
          <h2 id="about-title">About us</h2>
        </div>
        <p>
          UrbanCanopy Melbourne is a volunteer group working with councils and schools in Melbourne's west and north,
          where summer heat is highest and tree cover is lowest. Since 2023 our volunteers have planted almost
          10,000 trees, shrubs and grasses.
        </p>
      </section>
    </main>
    <SessionsPage
      v-else-if="currentPage === 'sessions'"
      :current-user="currentUser"
      @request-login="requestLogin('sessions')"
    />
    <SitesPage v-else-if="currentPage === 'sites'" @navigate="navigate" />
    <MapPage v-else-if="currentPage === 'map'" :params="routeParams" />
    <RatingsPage
      v-else-if="currentPage === 'ratings'"
      :projects="projects"
      :current-user="currentUser"
      @request-login="requestLogin('ratings')"
    />
    <OpenDataPage v-else-if="currentPage === 'api'" />
    <AuthPage v-else-if="currentPage === 'auth'" @authenticated="handleAuthenticated" />
    <AccountPage v-else-if="currentPage === 'account' && currentUser" :current-user="currentUser" @navigate="navigate" />
    <AdminDashboard
      v-else-if="currentPage === 'admin' && isAdmin"
      :users="users"
      :projects="projects"
    />

    <footer class="site-footer">
      <p>© 2026 UrbanCanopy Melbourne</p>
      <a class="footer-link" href="#/api" @click.prevent="navigate('api')">Open data API</a>
      <button class="footer-link" type="button" @click="navigate('home')">Return home</button>
    </footer>
  </div>
</template>
