<script setup>
// BR F.1 - volunteer session booking with a calendar and conflict management
import { computed, nextTick, ref } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import DataTable from './DataTable.vue'
import { bookSession, useSessions } from '../services/bookings.js'
import { formatDate, formatTimeRange } from '../utils/format.js'

const props = defineProps({ currentUser: { type: Object, default: null } })
const emit = defineEmits(['request-login'])

const { sessions, bookings } = useSessions()
const dialog = ref(null)
const activeId = ref('')
const busy = ref(false)
const feedback = ref('')
const feedbackOk = ref(false)
const pageMessage = ref('')

const myBookings = computed(() => (props.currentUser
  ? bookings.value.filter((booking) => booking.uid === props.currentUser.id)
  : []))
const bookedIds = computed(() => new Set(myBookings.value.map((booking) => booking.sessionId)))
const overlaps = (a, b) => new Date(a.start) < new Date(b.end) && new Date(b.start) < new Date(a.end)

function statusOf(session) {
  if (bookedIds.value.has(session.id)) return 'booked'
  if (new Date(session.start) <= new Date()) return 'past'
  if (session.placesLeft === 0) return 'full'
  if (myBookings.value.some((booking) => overlaps(booking, session))) return 'clash'
  return 'open'
}
const statusLabels = { booked: 'You are booked', past: 'Finished', full: 'Full', clash: 'Clashes with your booking', open: 'Places available' }
const statusColours = { booked: '#0a3f2d', past: '#8a958f', full: '#8a958f', clash: '#9a6400', open: '#0f6849' }

const rows = computed(() => sessions.value.map((session) => ({ ...session, status: statusOf(session) })))
const active = computed(() => rows.value.find((session) => session.id === activeId.value))

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin],
  initialView: window.innerWidth < 720 ? 'listMonth' : 'dayGridMonth',
  initialDate: '2026-10-24',
  headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listMonth' },
  buttonText: { today: 'Today', month: 'Month', week: 'Week', list: 'List' },
  height: 'auto',
  firstDay: 1,
  eventDisplay: 'block',
  events: rows.value.map((session) => ({
    id: session.id,
    title: `${session.title} (${session.placesLeft} left)`,
    start: session.start,
    end: session.end,
    backgroundColor: statusColours[session.status],
    borderColor: statusColours[session.status],
  })),
  eventClick: ({ event, jsEvent }) => {
    jsEvent.preventDefault()
    openSession(event.id)
  },
  eventDidMount: ({ el, event }) => {
    // Make calendar events reachable and operable from the keyboard (their visible text is the accessible name)
    el.setAttribute('tabindex', '0')
    el.setAttribute('role', 'button')
    el.addEventListener('keydown', (keyEvent) => {
      if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
        keyEvent.preventDefault()
        openSession(event.id)
      }
    })
  },
}))

const columns = [
  { key: 'start', label: 'Date', format: (value) => formatDate(value), sortValue: (row) => row.start },
  { key: 'time', label: 'Time', format: (_, row) => formatTimeRange(row.start, row.end), sortable: false },
  { key: 'title', label: 'Project' },
  { key: 'suburb', label: 'Suburb' },
  { key: 'placesLeft', label: 'Places left' },
  { key: 'status', label: 'Status', format: (value) => statusLabels[value] },
]

function openSession(id) {
  activeId.value = id
  feedback.value = ''
  feedbackOk.value = false
  nextTick(() => dialog.value?.showModal())
}

function closeDialog() {
  dialog.value?.close()
}

async function confirmBooking() {
  if (!props.currentUser) {
    closeDialog()
    emit('request-login')
    return
  }
  busy.value = true
  feedback.value = ''
  const result = await bookSession(activeId.value)
  busy.value = false
  feedbackOk.value = result.ok
  feedback.value = result.ok ? 'Booked! A confirmation is now in My account.' : result.message
  if (result.ok) pageMessage.value = `You are booked for ${active.value.title} on ${formatDate(active.value.start)}.`
}
</script>

<template>
  <main id="main-content" class="page-shell" tabindex="-1">
    <header class="page-heading compact-heading">
      <h1>Volunteer sessions</h1>
      <p>Most sessions run for about three hours on a Saturday or Sunday. Pick one from the calendar or the list below. Gloves, tools and morning tea are provided.</p>
    </header>

    <p v-if="pageMessage" class="success-message page-feedback" role="status">{{ pageMessage }}</p>
    <p v-if="!currentUser" class="route-message inline-notice">You can browse sessions without an account. Sign in when you are ready to book.</p>

    <ul class="map-legend" aria-label="Calendar colour key">
      <li v-for="(label, key) in statusLabels" :key="key">
        <span class="legend-dot" :style="{ background: statusColours[key] }" aria-hidden="true" />{{ label }}
      </li>
    </ul>

    <section class="calendar-card" aria-label="Session calendar">
      <FullCalendar :options="calendarOptions" />
    </section>

    <section class="dashboard-section" aria-labelledby="session-table-title">
      <div class="section-heading">
        <div><h2 id="session-table-title">All sessions</h2></div>
      </div>
      <DataTable id="sessions-table" caption="Volunteer sessions" :columns="columns" :rows="rows" actions-label="Book">
        <template #actions="{ row }">
          <button class="button button-outline small" type="button" :disabled="row.status === 'past'" @click="openSession(row.id)">
            {{ row.status === 'booked' ? 'View' : 'Details' }}<span class="visually-hidden"> for {{ row.title }} on {{ formatDate(row.start) }}</span>
          </button>
        </template>
      </DataTable>
    </section>

    <dialog ref="dialog" class="booking-dialog" aria-labelledby="dialog-title" @close="activeId = ''">
      <template v-if="active">
        <p class="dialog-meta">{{ active.type }} · {{ active.suburb }}</p>
        <h2 id="dialog-title">{{ active.title }}</h2>
        <dl class="profile-details">
          <div><dt>Date</dt><dd>{{ formatDate(active.start) }}</dd></div>
          <div><dt>Time</dt><dd>{{ formatTimeRange(active.start, active.end) }}</dd></div>
          <div><dt>Location</dt><dd>{{ active.suburb }}</dd></div>
          <div><dt>Places left</dt><dd>{{ active.placesLeft }} of {{ active.capacity }}</dd></div>
          <div><dt>Status</dt><dd>{{ statusLabels[active.status] }}</dd></div>
        </dl>
        <p v-if="feedback" :class="feedbackOk ? 'success-message' : 'form-alert'" role="alert">{{ feedback }}</p>
        <div class="dialog-actions">
          <button
            v-if="!['booked', 'past'].includes(active.status) && !feedbackOk"
            class="button button-primary"
            type="button"
            :disabled="busy"
            @click="confirmBooking"
          >
            {{ busy ? 'Booking…' : currentUser ? 'Book this session' : 'Sign in to book' }}
          </button>
          <button class="button button-outline" type="button" @click="closeDialog">Close</button>
        </div>
      </template>
    </dialog>
  </main>
</template>
