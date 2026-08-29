<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  projects: { type: Array, required: true },
})

const emit = defineEmits(['select-project'])
const searchQuery = ref('')
const selectedType = ref('All')

const projectTypes = computed(() => ['All', ...new Set(props.projects.map((project) => project.type))])

const filteredProjects = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return props.projects.filter((project) => {
    const matchesType = selectedType.value === 'All' || project.type === selectedType.value
    const searchableText = `${project.title} ${project.suburb} ${project.type} ${project.description}`.toLowerCase()
    return matchesType && searchableText.includes(query)
  })
})
</script>

<template>
  <section id="projects" class="content-section projects-section" aria-labelledby="projects-title">
    <div class="section-heading">
      <div>
        <p class="section-kicker">Find local action</p>
        <h2 id="projects-title">Community greening projects</h2>
      </div>
      <p>{{ filteredProjects.length }} project{{ filteredProjects.length === 1 ? '' : 's' }} shown</p>
    </div>
    <div class="project-filters" aria-label="Project filters">
      <div class="field-group">
        <label for="project-search">Search projects</label>
        <input id="project-search" v-model="searchQuery" type="search" placeholder="Try Footscray or biodiversity">
      </div>
      <div class="field-group">
        <label for="project-type">Project type</label>
        <select id="project-type" v-model="selectedType">
          <option v-for="type in projectTypes" :key="type" :value="type">{{ type }}</option>
        </select>
      </div>
    </div>
    <div v-if="filteredProjects.length" class="project-grid" aria-live="polite">
      <article v-for="project in filteredProjects" :key="project.id" class="project-card">
        <div class="project-card-meta">
          <span>{{ project.type }}</span>
          <span>{{ project.suburb }}</span>
        </div>
        <h3>{{ project.title }}</h3>
        <p>{{ project.description }}</p>
        <ul class="project-features" aria-label="Project features">
          <li>{{ project.familyFriendly ? 'Family friendly' : 'Adults only' }}</li>
          <li>{{ project.accessible ? 'Accessible site' : 'Uneven ground' }}</li>
        </ul>
        <a class="text-link" href="#volunteer" @click="emit('select-project', project.id)">
          Volunteer for this project
        </a>
      </article>
    </div>
    <p v-else class="empty-state" role="status">
      No projects match those filters. Try another suburb or select “All”.
    </p>
  </section>
</template>
