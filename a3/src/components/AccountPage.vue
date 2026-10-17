<script setup>
import { computed, ref } from 'vue'
import DataTable from './DataTable.vue'
import ExportButtons from './ExportButtons.vue'
import { cancelBooking, sendEmail, useSessions } from '../services/bookings.js'
import { pdfBase64 } from '../utils/export.js'
import { formatDate, formatTimeRange } from '../utils/format.js'

const props = defineProps({ currentUser: { type: Object, required: true } })
const emit = defineEmits(['navigate'])

const { bookings } = useSessions()
const visibleRows = ref([])
const feedback = ref('')
const feedbackOk = ref(true)
const emailing = ref(false)

const myBookings = computed(() => bookings.value.filter((booking) => booking.uid === props.currentUser.id))
const upcomingCount = computed(() => myBookings.value.filter((booking) => new Date(booking.end) > new Date()).length)

const columns = [
  { key: 'title', label: 'Session' },
  { key: 'suburb', label: 'Suburb' },
  { key: 'start', label: 'Date', format: (value) => formatDate(value), sortValue: (row) => row.start },
  { key: 'time', label: 'Time', format: (_, row) => formatTimeRange(row.start, row.end), sortable: false },
  { key: 'createdAt', label: 'Booked on', format: (value) => formatDate(value), sortValue: (row) => row.createdAt },
]

async function cancel(row) {
  feedback.value = ''
  const result = await cancelBooking(row.id)
  feedbackOk.value = result.ok
  feedback.value = result.ok ? `Your booking for ${row.title} was cancelled.` : result.message
}

// BR D.2 - email the member a PDF of their bookings as an attachment
async function emailBookings() {
  emailing.value = true
  feedback.value = ''
  const result = await sendEmail({
    subject: 'Your UrbanCanopy volunteer bookings',
    message: `Hi ${props.currentUser.displayName},\n\nYour current volunteer bookings are attached as a PDF.\n\nThank you for helping grow Melbourne's canopy.`,
    attachment: {
      filename: 'urbancanopy-bookings.pdf',
      type: 'application/pdf',
      content: pdfBase64('My UrbanCanopy bookings', columns, myBookings.value),
    },
  })
  emailing.value = false
  feedbackOk.value = result.ok
  feedback.value = result.ok ? `We emailed your bookings to ${result.to}.` : result.message
}
</script>

<template>
  <main id="main-content" class="page-shell account-page" tabindex="-1">
    <header class="page-heading compact-heading">
      <h1>My account</h1>
      <p>Your details and the sessions you have booked.</p>
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
          <div><dt>Upcoming bookings</dt><dd>{{ upcomingCount }}</dd></div>
        </dl>
      </div>
    </section>

    <section class="dashboard-section" aria-labelledby="bookings-title">
      <div class="section-heading">
        <div><h2 id="bookings-title">My sessions</h2></div>
        <a class="text-link" href="#/sessions" @click.prevent="emit('navigate', 'sessions')">Book another session</a>
      </div>
      <p v-if="feedback" :class="feedbackOk ? 'success-message' : 'form-alert'" class="page-feedback" role="status">{{ feedback }}</p>
      <DataTable
        id="my-bookings-table"
        caption="My bookings"
        :columns="columns"
        :rows="myBookings"
        actions-label="Manage"
        empty-message="You have no bookings yet."
        @filtered="visibleRows = $event"
      >
        <template #toolbar>
          <ExportButtons filename="my-urbancanopy-bookings" title="My UrbanCanopy bookings" :columns="columns" :rows="visibleRows" />
          <button class="button button-primary" type="button" :disabled="emailing || !myBookings.length" @click="emailBookings">
            {{ emailing ? 'Sending…' : 'Email me a PDF' }}
          </button>
        </template>
        <template #actions="{ row }">
          <button
            v-if="new Date(row.start) > new Date()"
            class="button button-outline small"
            type="button"
            @click="cancel(row)"
          >
            Cancel<span class="visually-hidden"> {{ row.title }} on {{ formatDate(row.start) }}</span>
          </button>
          <span v-else>Completed</span>
        </template>
      </DataTable>
    </section>
  </main>
</template>
