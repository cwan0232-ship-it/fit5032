<script setup>
import { computed } from 'vue'
import sites from '../data/sites.json'

const props = defineProps({
  nextEvent: { type: Object, required: true },
  projectCount: { type: Number, required: true },
})

const formattedDate = computed(() =>
  new Intl.DateTimeFormat('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })
    .format(new Date(`${props.nextEvent.date}T00:00:00`)),
)
const placesAvailable = computed(() => props.nextEvent.capacity - props.nextEvent.registered)
const treesPlanted = sites.reduce((sum, site) => sum + site.trees, 0).toLocaleString('en-AU')
const suburbs = new Set(sites.map((site) => site.suburb)).size
</script>

<template>
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero-copy">
      <h1 id="hero-title">Help plant Melbourne's next generation of trees</h1>
      <p class="hero-summary">
        We run weekend planting days, creek clean-ups and seed-raising workshops with local councils and schools.
        No experience needed. We bring the tools, gloves and morning tea.
      </p>
      <div class="hero-actions">
        <a class="button button-primary" href="#/sessions">See upcoming sessions</a>
        <a class="button button-secondary" href="#projects">Browse projects</a>
      </div>
      <p class="hero-facts">
        <strong>{{ treesPlanted }}</strong> trees planted across <strong>{{ suburbs }}</strong> suburbs
        through <strong>{{ projectCount }}</strong> ongoing projects.
      </p>
    </div>
    <aside class="next-session" aria-labelledby="next-session-title">
      <p class="next-session-label">Next session</p>
      <h2 id="next-session-title">{{ nextEvent.title }}</h2>
      <p>{{ formattedDate }}, {{ nextEvent.suburb }}</p>
      <p>{{ placesAvailable }} of {{ nextEvent.capacity }} places left</p>
      <a class="text-link" href="#/sessions">Book a place</a>
    </aside>
  </section>
</template>
