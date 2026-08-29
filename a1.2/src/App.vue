<script setup>
import { computed, ref } from 'vue'
import HeroSection from './components/HeroSection.vue'
import ProjectExplorer from './components/ProjectExplorer.vue'
import SiteHeader from './components/SiteHeader.vue'
import VolunteerForm from './components/VolunteerForm.vue'
import { projects } from './data/projects.js'

const selectedProjectId = ref(projects[0]?.id ?? '')

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
</script>

<template>
  <div class="site-shell">
    <SiteHeader />
    <main id="top">
      <HeroSection :next-event="nextEvent" :project-count="projects.length" />
      <ProjectExplorer :projects="projects" @select-project="selectProject" />
      <VolunteerForm :projects="projects" :selected-project-id="selectedProjectId" />
      <section id="about" class="content-section about-section" aria-labelledby="about-title">
        <div>
          <p class="section-kicker">About UrbanCanopy</p>
          <h2 id="about-title">Local knowledge, practical action and healthier neighbourhoods.</h2>
        </div>
        <p>
          UrbanCanopy Melbourne connects residents with community-led tree planting and
          biodiversity projects. We make opportunities easier to find, understand and join,
          especially in neighbourhoods that need more shade and habitat.
        </p>
      </section>
    </main>
    <footer class="site-footer">
      <p>UrbanCanopy Melbourne</p>
      <a href="#top">Back to top</a>
    </footer>
  </div>
</template>
