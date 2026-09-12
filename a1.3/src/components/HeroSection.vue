<script setup>
import { computed } from 'vue'

const props = defineProps({
  nextEvent: { type: Object, required: true },
  projectCount: { type: Number, required: true },
})

const formattedDate = computed(() =>
  new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${props.nextEvent.date}T00:00:00`)),
)

const placesAvailable = computed(() => props.nextEvent.capacity - props.nextEvent.registered)
</script>

<template>
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero-copy">
      <p class="eyebrow">Urban greening · Melbourne</p>
      <h1 id="hero-title">Greener Melbourne, together.</h1>
      <p class="hero-summary">
        Find one of {{ projectCount }} local projects and make a visible difference.
      </p>
      <div class="hero-actions">
        <a class="button button-primary" href="#projects">Find a project</a>
        <a class="button button-secondary" href="#volunteer">Volunteer</a>
      </div>
    </div>
    <aside class="hero-card" aria-label="Next community event">
      <p class="card-label">Next event</p>
      <h2>{{ nextEvent.title }}</h2>
      <dl>
        <div><dt>Date</dt><dd>{{ formattedDate }}</dd></div>
        <div><dt>Location</dt><dd>{{ nextEvent.suburb }}</dd></div>
        <div><dt>Places</dt><dd>{{ placesAvailable }} of {{ nextEvent.capacity }} available</dd></div>
      </dl>
    </aside>
  </section>
</template>
