<script setup>
import { exportCsv, exportPdf } from '../utils/export.js'

const props = defineProps({
  filename: { type: String, required: true },
  title: { type: String, required: true },
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
})
</script>

<template>
  <div class="export-actions" role="group" :aria-label="`Export ${title}`">
    <button class="button button-outline" type="button" :disabled="!rows.length" @click="exportCsv(`${props.filename}.csv`, columns, rows)">
      Export CSV
    </button>
    <button class="button button-outline" type="button" :disabled="!rows.length" @click="exportPdf(`${props.filename}.pdf`, title, columns, rows)">
      Export PDF
    </button>
  </div>
</template>
