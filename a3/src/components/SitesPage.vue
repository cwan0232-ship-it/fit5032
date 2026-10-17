<script setup>
import { computed, ref } from 'vue'
import DataTable from './DataTable.vue'
import ExportButtons from './ExportButtons.vue'
import sites from '../data/sites.json'
import { formatDate } from '../utils/format.js'

const emit = defineEmits(['navigate'])
const visibleRows = ref(sites)

const columns = [
  { key: 'name', label: 'Site' },
  { key: 'suburb', label: 'Suburb' },
  { key: 'council', label: 'Council' },
  { key: 'type', label: 'Type' },
  { key: 'species', label: 'Lead species' },
  { key: 'trees', label: 'Trees planted' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date', format: (value) => formatDate(value), sortValue: (row) => row.date },
]

const totals = computed(() => ({
  trees: sites.reduce((sum, site) => sum + site.trees, 0),
  councils: new Set(sites.map((site) => site.council)).size,
  establishing: sites.filter((site) => site.status === 'Establishing').length,
}))
</script>

<template>
  <main id="main-content" class="page-shell" tabindex="-1">
    <header class="page-heading">
      <h1>Planting sites</h1>
      <p>Every site we have planted or are planning to plant. Search or sort the list, or download it as a spreadsheet or PDF.</p>
    </header>

    <p class="summary-line">
      {{ sites.length }} sites across {{ totals.councils }} council areas, with
      {{ totals.trees.toLocaleString('en-AU') }} trees in the ground so far.
      {{ totals.establishing }} sites are still establishing and need regular watering.
    </p>

    <DataTable id="sites-table" caption="Planting sites" :columns="columns" :rows="sites" @filtered="visibleRows = $event">
      <template #toolbar>
        <ExportButtons filename="urbancanopy-planting-sites" title="UrbanCanopy planting sites" :columns="columns" :rows="visibleRows" />
      </template>
      <template #cell-name="{ row }">
        <a class="text-link" :href="`#/map?site=${row.id}`" @click.prevent="emit('navigate', 'map', { site: row.id })">{{ row.name }}</a>
      </template>
    </DataTable>
  </main>
</template>
