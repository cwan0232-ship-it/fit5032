<script setup>
// BR F.1 - interactive Chart.js chart with a text alternative for screen readers
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArcElement, BarController, BarElement, CategoryScale, Chart, DoughnutController, Legend, LinearScale, Tooltip } from 'chart.js'

Chart.register(ArcElement, BarController, BarElement, CategoryScale, DoughnutController, Legend, LinearScale, Tooltip)

const props = defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, default: 'bar' },
  labels: { type: Array, required: true },
  values: { type: Array, required: true },
  valueLabel: { type: String, default: 'Value' },
})

const canvas = ref(null)
const palette = ['#0f6849', '#2f7fb8', '#9a6400', '#7a4fa3', '#a12a2a', '#4f6b5f']
let chart = null

function render() {
  chart?.destroy()
  chart = new Chart(canvas.value, {
    type: props.type,
    data: {
      labels: props.labels,
      datasets: [{
        label: props.valueLabel,
        data: props.values,
        backgroundColor: props.type === 'bar' ? '#0f6849' : palette,
        borderRadius: props.type === 'bar' ? 4 : 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: props.type !== 'bar', position: 'bottom' } },
      scales: props.type === 'bar' ? { y: { beginAtZero: true, ticks: { precision: 0 } } } : {},
    },
  })
}

onMounted(render)
watch(() => [props.labels, props.values], render, { deep: true })
onBeforeUnmount(() => chart?.destroy())
</script>

<template>
  <figure class="chart-card" :aria-labelledby="`${id}-title`">
    <figcaption :id="`${id}-title`">{{ title }}</figcaption>
    <div class="chart-area">
      <canvas ref="canvas" role="img" :aria-label="`${title}. The data table below lists every value.`" />
    </div>
    <details>
      <summary>Show chart data</summary>
      <table>
        <caption class="visually-hidden">{{ title }}</caption>
        <thead><tr><th scope="col">Category</th><th scope="col">{{ valueLabel }}</th></tr></thead>
        <tbody>
          <tr v-for="(label, index) in labels" :key="label"><td>{{ label }}</td><td>{{ values[index] }}</td></tr>
        </tbody>
      </table>
    </details>
  </figure>
</template>
