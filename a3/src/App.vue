<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import AccountPage from './components/AccountPage.vue'
import AdminDashboard from './components/AdminDashboard.vue'
import AuthPage from './components/AuthPage.vue'
import HeroSection from './components/HeroSection.vue'
import ProjectExplorer from './components/ProjectExplorer.vue'
import RatingsPage from './components/RatingsPage.vue'
import SiteHeader from './components/SiteHeader.vue'
import VolunteerForm from './components/VolunteerForm.vue'
import { projects } from './data/projects.js'
import { initialiseAuth, logout, useAuth } from './services/auth.js'

const selectedProjectId = ref(projects[0]?.id ?? '')
const currentPage = ref('home')
const routeMessage = ref('')
const returnPage = ref('home')
const { currentUser, users, isAdmin, ready } = useAuth()
const validPages = new Set(['home', 'ratings', 'auth', 'account', 'admin'])

const nextEvent = computed(() => {
  const today = new Date()
  const upcoming = projects
    .filter((project) => new Date(`${project.date}T00:00:00`) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  return upcoming[0] ?? projects[0]
})

function selectProject(projectId) {
  selectedProjectId.value = projectId
}

function requestedPage() {
  const page = window.location.hash.replace(/^#\/?/, '').split('/')[0]
  return validPages.has(page) ? page : 'home'
}

function focusMain() {
  nextTick(() => document.querySelector('#main-content')?.focus())
}

function navigate(page, options = {}) {
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
  const nextHash = `#/${destination}`
  if (window.location.hash !== nextHash) {
    history[options.replace ? 'replaceState' : 'pushState'](null, '', nextHash)
  }
  window.scrollTo({ top: 0, behavior: 'auto' })
  focusMain()
}

function handleHashChange() {
  navigate(requestedPage(), { replace: true })
}

function handleAuthenticated() {
  const destination = returnPage.value
  returnPage.value = 'home'
  navigate(destination === 'admin' && !isAdmin.value ? 'account' : destination)
}

async function handleLogout() {
  await logout()
  navigate('home', { replace: true })
  routeMessage.value = 'You have signed out safely.'
}

function requestLogin() {
  returnPage.value = 'ratings'
  navigate('auth')
  routeMessage.value = 'Sign in or create an account to rate a project.'
}

onMounted(async () => {
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
    <p v-if="routeMessage" class="route-message" role="status">{{ routeMessage }}</p>

    <div v-if="!ready" class="loading-state" role="status">Connecting to your account…</div>

    <main v-else-if="currentPage === 'home'" id="main-content" tabindex="-1">
      <HeroSection :next-event="nextEvent" :project-count="projects.length" />
      <ProjectExplorer :projects="projects" @select-project="selectProject" />
      <VolunteerForm :projects="projects" :selected-project-id="selectedProjectId" />
      <section id="about" class="content-section about-section" aria-labelledby="about-title">
        <div>
          <p class="section-kicker">About</p>
          <h2 id="about-title">Local action. Lasting canopy.</h2>
        </div>
        <p>
          We connect Melbourne communities with practical tree planting and biodiversity work.
        </p>
      </section>
    </main>
    <RatingsPage
      v-else-if="currentPage === 'ratings'"
      :projects="projects"
      :current-user="currentUser"
      @request-login="requestLogin"
    />
    <AuthPage v-else-if="currentPage === 'auth'" @authenticated="handleAuthenticated" />
    <AccountPage v-else-if="currentPage === 'account' && currentUser" :current-user="currentUser" />
    <AdminDashboard
      v-else-if="currentPage === 'admin' && isAdmin"
      :users="users"
      :projects="projects"
    />

    <footer class="site-footer">
      <p>© 2026 UrbanCanopy Melbourne</p>
      <button class="footer-link" type="button" @click="navigate('home')">Return home</button>
    </footer>
  </div>
</template>
