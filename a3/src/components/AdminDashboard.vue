<script setup>
// BR F.1 - admin dashboard with Firestore charts, bulk email and booking reports
import { computed, reactive, ref } from 'vue'
import ChartCard from './ChartCard.vue'
import DataTable from './DataTable.vue'
import ExportButtons from './ExportButtons.vue'
import { useRatings } from '../services/ratings.js'
import { sendBulkEmail, useSessions } from '../services/bookings.js'
import { formatDate, formatTimeRange } from '../utils/format.js'

const props = defineProps({
  users: { type: Array, required: true },
  projects: { type: Array, required: true },
})

const { summaries } = useRatings()
const { sessions, bookings } = useSessions()
const selectedMembers = ref([])
const visibleMembers = ref([])
const visibleBookings = ref([])
const email = reactive({ subject: '', message: '' })
const emailErrors = reactive({ subject: '', message: '' })
const emailFeedback = ref('')
const emailOk = ref(false)
const sending = ref(false)

const upcomingBookings = computed(() => bookings.value.filter((booking) => new Date(booking.end) > new Date()))
const fillRate = computed(() => {
  const capacity = sessions.value.reduce((sum, session) => sum + session.capacity, 0)
  const booked = sessions.value.reduce((sum, session) => sum + session.booked, 0)
  return capacity ? Math.round((booked / capacity) * 100) : 0
})

const bookingsByProject = computed(() => {
  const counts = Object.fromEntries(props.projects.map((project) => [project.id, 0]))
  bookings.value.forEach((booking) => { counts[booking.projectId] = (counts[booking.projectId] ?? 0) + 1 })
  return {
    labels: props.projects.map((project) => project.title),
    values: props.projects.map((project) => counts[project.id]),
  }
})

const membersByRole = computed(() => {
  const counts = { member: 0, admin: 0 }
  props.users.forEach((user) => { counts[user.role] = (counts[user.role] ?? 0) + 1 })
  return { labels: ['Community members', 'Administrators'], values: [counts.member, counts.admin] }
})

const highestRated = computed(() => props.projects
  .map((project) => ({ ...project, ...(summaries.value[project.id] ?? { average: 0, count: 0 }) }))
  .sort((a, b) => b.average - a.average)[0])

const memberColumns = [
  { key: 'displayName', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'createdAt', label: 'Joined', format: (value) => formatDate(value), sortValue: (row) => row.createdAt },
]

const bookingColumns = [
  { key: 'displayName', label: 'Volunteer' },
  { key: 'email', label: 'Email' },
  { key: 'title', label: 'Session' },
  { key: 'start', label: 'Date', format: (value) => formatDate(value), sortValue: (row) => row.start },
  { key: 'time', label: 'Time', format: (_, row) => formatTimeRange(row.start, row.end), sortable: false },
  { key: 'suburb', label: 'Suburb' },
]

function selectVisibleMembers() {
  selectedMembers.value = visibleMembers.value.map((member) => member.id)
}

async function sendAnnouncement() {
  emailFeedback.value = ''
  emailErrors.subject = email.subject.trim().length >= 3 ? '' : 'Enter a subject of at least 3 characters.'
  emailErrors.message = email.message.trim().length >= 10 ? '' : 'Enter a message of at least 10 characters.'
  if (!selectedMembers.value.length) {
    emailOk.value = false
    emailFeedback.value = 'Select at least one member in the table above.'
    return
  }
  if (emailErrors.subject || emailErrors.message) return

  sending.value = true
  const result = await sendBulkEmail({ uids: selectedMembers.value, subject: email.subject, message: email.message })
  sending.value = false
  emailOk.value = result.ok
  emailFeedback.value = result.ok ? `Announcement sent to ${result.sent} member${result.sent === 1 ? '' : 's'}.` : result.message
  if (result.ok) {
    email.subject = ''
    email.message = ''
    selectedMembers.value = []
  }
}
</script>

<template>
  <main id="main-content" class="page-shell admin-page" tabindex="-1">
    <header class="page-heading">
      <h1>Admin dashboard</h1>
      <p>Members, bookings and session numbers. Figures update as people book.</p>
    </header>

    <section class="metric-grid" aria-label="Community metrics">
      <article><span>Registered members</span><strong>{{ users.length }}</strong></article>
      <article><span>Total bookings</span><strong>{{ bookings.length }}</strong></article>
      <article><span>Upcoming bookings</span><strong>{{ upcomingBookings.length }}</strong></article>
      <article><span>Session fill rate</span><strong>{{ fillRate }}%</strong></article>
    </section>

    <section class="chart-grid" aria-label="Charts">
      <ChartCard
        id="bookings-chart"
        title="Bookings per project"
        type="bar"
        value-label="Bookings"
        :labels="bookingsByProject.labels"
        :values="bookingsByProject.values"
      />
      <ChartCard
        id="roles-chart"
        title="Members by role"
        type="doughnut"
        value-label="Members"
        :labels="membersByRole.labels"
        :values="membersByRole.values"
      />
    </section>

    <section class="dashboard-section" aria-labelledby="users-title">
      <div class="section-heading">
        <div><h2 id="users-title">Members</h2></div>
        <p>{{ selectedMembers.length }} selected</p>
      </div>
      <DataTable
        id="members-table"
        v-model:selected="selectedMembers"
        caption="Members"
        :columns="memberColumns"
        :rows="users"
        selectable
        @filtered="visibleMembers = $event"
      >
        <template #toolbar>
          <button class="button button-outline" type="button" @click="selectVisibleMembers">Select all filtered</button>
          <ExportButtons filename="urbancanopy-members" title="UrbanCanopy members" :columns="memberColumns" :rows="visibleMembers" />
        </template>
      </DataTable>

      <form class="bulk-email" novalidate @submit.prevent="sendAnnouncement">
        <h3>Email selected members</h3>
        <div class="field-group">
          <label for="bulk-subject">Subject</label>
          <input
            id="bulk-subject"
            v-model="email.subject"
            type="text"
            maxlength="120"
            :aria-invalid="Boolean(emailErrors.subject)"
            aria-describedby="bulk-subject-error"
          >
          <p id="bulk-subject-error" class="field-error">{{ emailErrors.subject }}</p>
        </div>
        <div class="field-group">
          <label for="bulk-message">Message</label>
          <textarea
            id="bulk-message"
            v-model="email.message"
            rows="5"
            maxlength="5000"
            :aria-invalid="Boolean(emailErrors.message)"
            aria-describedby="bulk-message-error"
          />
          <p id="bulk-message-error" class="field-error">{{ emailErrors.message }}</p>
        </div>
        <p v-if="emailFeedback" :class="emailOk ? 'success-message' : 'form-alert'" role="status">{{ emailFeedback }}</p>
        <button class="button button-primary" type="submit" :disabled="sending">
          {{ sending ? 'Sending…' : `Send to ${selectedMembers.length} member${selectedMembers.length === 1 ? '' : 's'}` }}
        </button>
      </form>
    </section>

    <section class="dashboard-section" aria-labelledby="all-bookings-title">
      <div class="section-heading">
        <div><h2 id="all-bookings-title">All bookings</h2></div>
      </div>
      <DataTable
        id="all-bookings-table"
        caption="All bookings"
        :columns="bookingColumns"
        :rows="bookings"
        empty-message="No bookings yet."
        @filtered="visibleBookings = $event"
      >
        <template #toolbar>
          <ExportButtons filename="urbancanopy-bookings" title="UrbanCanopy bookings" :columns="bookingColumns" :rows="visibleBookings" />
        </template>
      </DataTable>
    </section>

    <section v-if="highestRated" class="dashboard-highlight" aria-labelledby="highlight-title">
      <h2 id="highlight-title">Top rated project: {{ highestRated.title }}</h2>
      <p>
        Current leading project with an average of
        <strong>{{ highestRated.average.toFixed(1) }} / 5</strong> from {{ highestRated.count }}
        rating{{ highestRated.count === 1 ? '' : 's' }}.
      </p>
    </section>
  </main>
</template>
