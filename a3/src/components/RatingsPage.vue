<script setup>
import { computed, reactive, ref } from 'vue'
import { saveRating, useRatings } from '../services/ratings.js'

const props = defineProps({
  projects: { type: Array, required: true },
  currentUser: { type: Object, default: null },
})
const emit = defineEmits(['request-login'])
const { ratings, summaries } = useRatings()
const selections = reactive({})
const feedback = ref('')
const feedbackOk = ref(true)

const cards = computed(() => props.projects.map((project) => {
  const summary = summaries.value[project.id] ?? { average: 0, count: 0 }
  const ownRating = ratings.value.find(
    (rating) => rating.userId === props.currentUser?.id && rating.projectId === project.id,
  )
  return { ...project, ...summary, ownRating: ownRating?.score ?? null }
}))

const saving = ref('')

async function submitRating(projectId) {
  feedback.value = ''
  if (!props.currentUser) {
    emit('request-login')
    return
  }
  saving.value = projectId
  const result = await saveRating({ projectId, score: selections[projectId] })
  saving.value = ''
  feedbackOk.value = result.ok
  feedback.value = result.ok
    ? `Thanks. The new average is ${result.average.toFixed(1)} from ${result.count} rating${result.count === 1 ? '' : 's'}.`
    : result.message
}
</script>

<template>
  <main id="main-content" class="page-shell rating-page" tabindex="-1">
    <header class="page-heading">
      <h1>Project ratings</h1>
      <p>
        See the average, add your score, or change it later.
      </p>
    </header>

    <p v-if="feedback" :class="feedbackOk ? 'success-message' : 'form-alert'" class="page-feedback" role="status">{{ feedback }}</p>
    <div class="rating-grid">
      <article v-for="project in cards" :key="project.id" class="rating-card">
        <div class="rating-card-heading">
          <div>
            <p class="project-location">{{ project.suburb }} · {{ project.type }}</p>
            <h2>{{ project.title }}</h2>
          </div>
          <div class="rating-summary" :aria-label="`${project.average.toFixed(1)} out of 5 from ${project.count} ratings`">
            <strong>{{ project.count ? project.average.toFixed(1) : 'New' }}</strong>
            <span>{{ project.count }} rating{{ project.count === 1 ? '' : 's' }}</span>
          </div>
        </div>
        <p>{{ project.description }}</p>
        <p v-if="project.ownRating" class="your-rating">Your current rating: {{ project.ownRating }} / 5</p>
        <fieldset class="rating-fieldset">
          <legend>Choose a score</legend>
          <div class="score-options">
            <label v-for="score in 5" :key="score">
              <input v-model.number="selections[project.id]" type="radio" :name="`rating-${project.id}`" :value="score">
              <span>{{ score }}</span>
            </label>
          </div>
        </fieldset>
        <button class="button button-outline" type="button" :disabled="saving === project.id" @click="submitRating(project.id)">
          {{ saving === project.id ? 'Saving…' : currentUser ? 'Save rating' : 'Sign in to rate' }}
        </button>
      </article>
    </div>
  </main>
</template>
