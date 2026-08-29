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
      <p class="eyebrow">Local action. Living neighbourhoods.</p>
      <h1 id="hero-title">Greener streets begin with community action.</h1>
      <p class="hero-summary">
        Explore {{ projectCount }} practical tree-planting and biodiversity projects across
        Melbourne and help create healthier, climate-resilient neighbourhoods.
      </p>
      <div class="hero-actions">
        <a class="button button-primary" href="#projects">Explore projects</a>
        <a class="button button-secondary" href="#volunteer">Volunteer with us</a>
      </div>
    </div>
    <aside class="hero-card" aria-label="Next community event">
      <p class="card-label">Next community event</p>
      <h2>{{ nextEvent.title }}</h2>
      <dl>
        <div><dt>Date</dt><dd>{{ formattedDate }}</dd></div>
        <div><dt>Location</dt><dd>{{ nextEvent.suburb }}</dd></div>
        <div><dt>Places</dt><dd>{{ placesAvailable }} of {{ nextEvent.capacity }} available</dd></div>
      </dl>
    </aside>
  </section>
</template>
