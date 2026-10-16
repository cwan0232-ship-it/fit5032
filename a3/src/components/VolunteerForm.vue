<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { cleanPlainText, isValidEmail, normaliseEmail } from '../services/security.js'

const props = defineProps({
  projects: { type: Array, required: true },
  selectedProjectId: { type: String, default: '' },
})

const form = reactive({
  name: '',
  email: '',
  projectId: props.selectedProjectId || props.projects[0]?.id || '',
  participants: 1,
  consent: false,
})

const errors = reactive({ name: '', email: '', projectId: '', participants: '', consent: '' })
const successMessage = ref('')

const selectedProject = computed(() =>
  props.projects.find((project) => project.id === form.projectId),
)

const availablePlaces = computed(() => {
  if (!selectedProject.value) return 1
  return Math.max(1, selectedProject.value.capacity - selectedProject.value.registered)
})

watch(
  () => props.selectedProjectId,
  (projectId) => {
    if (projectId) form.projectId = projectId
  },
)

function validateField(field) {
  if (field === 'name') {
    errors.name = cleanPlainText(form.name, 70).length >= 2 ? '' : 'Enter your full name.'
  }

  if (field === 'email') {
    errors.email = isValidEmail(form.email) ? '' : 'Enter a valid email address.'
  }

  if (field === 'projectId') {
    errors.projectId = selectedProject.value ? '' : 'Select a project.'
  }

  if (field === 'participants') {
    const number = Number(form.participants)
    errors.participants = Number.isInteger(number) && number >= 1 && number <= availablePlaces.value
      ? ''
      : `Choose between 1 and ${availablePlaces.value} participants.`
  }

  if (field === 'consent') {
    errors.consent = form.consent ? '' : 'Confirm that you have read the safety and privacy notice.'
  }
}

function validateForm() {
  Object.keys(errors).forEach(validateField)
  return Object.values(errors).every((message) => !message)
}

function getSavedRegistrations() {
  try {
    const saved = JSON.parse(localStorage.getItem('urbancanopy-registrations') || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function submitForm() {
  successMessage.value = ''
  if (!validateForm()) return

  const registration = {
    name: cleanPlainText(form.name, 70),
    email: normaliseEmail(form.email),
    projectId: form.projectId,
    participants: Number(form.participants),
    submittedAt: new Date().toISOString(),
  }

  const registrations = getSavedRegistrations()
  registrations.push(registration)
  localStorage.setItem('urbancanopy-registrations', JSON.stringify(registrations))

  successMessage.value = `Thanks, ${registration.name}. Your interest in ${selectedProject.value.title} has been saved.`
  form.name = ''
  form.email = ''
  form.participants = 1
  form.consent = false
  Object.keys(errors).forEach((key) => { errors[key] = '' })
}
</script>

<template>
  <section id="volunteer" class="volunteer-section" aria-labelledby="volunteer-title">
    <div class="volunteer-intro">
      <p class="section-kicker">Volunteer</p>
      <h2 id="volunteer-title">Save your place.</h2>
      <p>
        Pick a project and tell us who is coming.
      </p>
    </div>

    <form class="volunteer-form" novalidate @submit.prevent="submitForm">
      <div class="field-group">
        <label for="volunteer-name">Full name <span aria-hidden="true">*</span></label>
        <input
          id="volunteer-name"
          v-model="form.name"
          type="text"
          autocomplete="name"
          maxlength="70"
          :aria-invalid="Boolean(errors.name)"
          aria-describedby="name-error"
          @blur="validateField('name')"
        >
        <p id="name-error" class="field-error">{{ errors.name }}</p>
      </div>

      <div class="field-group">
        <label for="volunteer-email">Email address <span aria-hidden="true">*</span></label>
        <input
          id="volunteer-email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          maxlength="160"
          :aria-invalid="Boolean(errors.email)"
          aria-describedby="email-error"
          @blur="validateField('email')"
        >
        <p id="email-error" class="field-error">{{ errors.email }}</p>
      </div>

      <div class="field-group form-wide">
        <label for="volunteer-project">Project <span aria-hidden="true">*</span></label>
        <select
          id="volunteer-project"
          v-model="form.projectId"
          :aria-invalid="Boolean(errors.projectId)"
          aria-describedby="project-error"
          @change="validateField('projectId'); validateField('participants')"
        >
          <option value="">Choose a project</option>
          <option v-for="project in projects" :key="project.id" :value="project.id">
            {{ project.title }} — {{ project.suburb }}
          </option>
        </select>
        <p id="project-error" class="field-error">{{ errors.projectId }}</p>
      </div>

      <div class="field-group form-wide">
        <label for="participant-count">Number of participants <span aria-hidden="true">*</span></label>
        <input
          id="participant-count"
          v-model.number="form.participants"
          type="number"
          min="1"
          :max="availablePlaces"
          :aria-invalid="Boolean(errors.participants)"
          aria-describedby="participant-help participant-error"
          @blur="validateField('participants')"
        >
        <p id="participant-help" class="field-help">{{ availablePlaces }} places available.</p>
        <p id="participant-error" class="field-error">{{ errors.participants }}</p>
      </div>

      <div class="checkbox-field form-wide">
        <input
          id="volunteer-consent"
          v-model="form.consent"
          type="checkbox"
          :aria-invalid="Boolean(errors.consent)"
          aria-describedby="consent-error"
          @change="validateField('consent')"
        >
        <label for="volunteer-consent">
          I accept the safety and privacy notice and agree to event contact.
        </label>
        <p id="consent-error" class="field-error">{{ errors.consent }}</p>
      </div>

      <button class="button button-primary form-wide" type="submit">Save registration</button>
      <p v-if="successMessage" class="success-message form-wide" role="status">
        {{ successMessage }}
      </p>
    </form>
  </section>
</template>
