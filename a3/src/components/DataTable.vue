<script setup>
// BR D.3 - reusable interactive table: sort, global search, per-column search, 10 rows per page
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({
  id: { type: String, required: true },
  caption: { type: String, required: true },
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  rowKey: { type: String, default: 'id' },
  pageSize: { type: Number, default: 10 },
  selectable: { type: Boolean, default: false },
  selected: { type: Array, default: () => [] },
  actionsLabel: { type: String, default: '' },
  emptyMessage: { type: String, default: 'No rows match these filters.' },
})
const emit = defineEmits(['update:selected', 'filtered'])

const globalQuery = ref('')
const columnFilters = reactive(Object.fromEntries(props.columns.map((column) => [column.key, ''])))
const sortKey = ref('')
const sortDirection = ref('ascending')
const page = ref(1)

const display = (row, column) => (column.format ? column.format(row[column.key], row) : row[column.key] ?? '')
const searchText = (row, column) => String(column.searchValue ? column.searchValue(row) : display(row, column)).toLowerCase()

const filteredRows = computed(() => {
  const query = globalQuery.value.trim().toLowerCase()
  const active = props.columns.filter((column) => column.filterable !== false && columnFilters[column.key].trim())
  const rows = props.rows.filter((row) => {
    if (query && !props.columns.some((column) => searchText(row, column).includes(query))) return false
    return active.every((column) => searchText(row, column).includes(columnFilters[column.key].trim().toLowerCase()))
  })

  const column = props.columns.find((item) => item.key === sortKey.value)
  if (!column) return rows
  const direction = sortDirection.value === 'ascending' ? 1 : -1
  return [...rows].sort((a, b) => {
    const left = column.sortValue ? column.sortValue(a) : a[column.key]
    const right = column.sortValue ? column.sortValue(b) : b[column.key]
    if (typeof left === 'number' && typeof right === 'number') return (left - right) * direction
    return String(left ?? '').localeCompare(String(right ?? ''), 'en-AU', { numeric: true }) * direction
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / props.pageSize)))
const firstIndex = computed(() => (page.value - 1) * props.pageSize)
const pageRows = computed(() => filteredRows.value.slice(firstIndex.value, firstIndex.value + props.pageSize))
const summary = computed(() => {
  const total = filteredRows.value.length
  if (!total) return 'No results'
  return `Showing ${firstIndex.value + 1}–${Math.min(firstIndex.value + props.pageSize, total)} of ${total}`
})
const pageNumbers = computed(() => {
  const start = Math.max(1, Math.min(page.value - 2, pageCount.value - 4))
  return Array.from({ length: Math.min(5, pageCount.value) }, (_, index) => start + index)
})

watch([globalQuery, () => ({ ...columnFilters })], () => { page.value = 1 })
watch(pageCount, (count) => { if (page.value > count) page.value = count })
watch(filteredRows, (rows) => emit('filtered', rows), { immediate: true })

function sortBy(column) {
  if (sortKey.value === column.key) {
    sortDirection.value = sortDirection.value === 'ascending' ? 'descending' : 'ascending'
  } else {
    sortKey.value = column.key
    sortDirection.value = 'ascending'
  }
}

function clearFilters() {
  globalQuery.value = ''
  Object.keys(columnFilters).forEach((key) => { columnFilters[key] = '' })
}

const selectedSet = computed(() => new Set(props.selected))
const allOnPageSelected = computed(() => pageRows.value.length > 0
  && pageRows.value.every((row) => selectedSet.value.has(row[props.rowKey])))

function toggleRow(row) {
  const key = row[props.rowKey]
  emit('update:selected', selectedSet.value.has(key)
    ? props.selected.filter((item) => item !== key)
    : [...props.selected, key])
}

function togglePage() {
  const keys = pageRows.value.map((row) => row[props.rowKey])
  emit('update:selected', allOnPageSelected.value
    ? props.selected.filter((key) => !keys.includes(key))
    : [...new Set([...props.selected, ...keys])])
}
</script>

<template>
  <div class="data-table">
    <div class="table-toolbar">
      <div class="field-group">
        <label :for="`${id}-search`">Search all columns</label>
        <input :id="`${id}-search`" v-model="globalQuery" type="search" :placeholder="`Search ${caption.toLowerCase()}`">
      </div>
      <p class="table-summary" role="status" aria-live="polite">{{ summary }}</p>
      <button class="button button-outline" type="button" @click="clearFilters">Clear filters</button>
      <slot name="toolbar" />
    </div>

    <div class="table-scroll" tabindex="0" :aria-labelledby="`${id}-caption`">
      <table :id="id">
        <caption :id="`${id}-caption`" class="visually-hidden">
          {{ caption }}. Column headers with buttons can be sorted.
        </caption>
        <thead>
          <tr>
            <th v-if="selectable" scope="col" class="select-cell">
              <input
                type="checkbox"
                :checked="allOnPageSelected"
                :aria-label="`Select all rows on page ${page}`"
                @change="togglePage"
              >
            </th>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :aria-sort="sortKey === column.key ? sortDirection : undefined"
            >
              <button v-if="column.sortable !== false" class="sort-button" type="button" @click="sortBy(column)">
                {{ column.label }}
                <span aria-hidden="true">{{ sortKey === column.key ? (sortDirection === 'ascending' ? '▲' : '▼') : '↕' }}</span>
              </button>
              <span v-else>{{ column.label }}</span>
            </th>
            <th v-if="actionsLabel" scope="col">{{ actionsLabel }}</th>
          </tr>
          <tr class="filter-row">
            <td v-if="selectable" />
            <td v-for="column in columns" :key="column.key">
              <input
                v-if="column.filterable !== false"
                v-model="columnFilters[column.key]"
                type="search"
                :aria-label="`Filter by ${column.label}`"
                placeholder="Filter"
              >
            </td>
            <td v-if="actionsLabel" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in pageRows" :key="row[rowKey]" :class="{ 'row-selected': selectedSet.has(row[rowKey]) }">
            <td v-if="selectable" class="select-cell">
              <input
                type="checkbox"
                :checked="selectedSet.has(row[rowKey])"
                :aria-label="`Select ${display(row, columns[0])}`"
                @change="toggleRow(row)"
              >
            </td>
            <td v-for="column in columns" :key="column.key">
              <slot :name="`cell-${column.key}`" :row="row" :value="display(row, column)">{{ display(row, column) }}</slot>
            </td>
            <td v-if="actionsLabel"><slot name="actions" :row="row" /></td>
          </tr>
          <tr v-if="!pageRows.length">
            <td :colspan="columns.length + (selectable ? 1 : 0) + (actionsLabel ? 1 : 0)" class="empty-cell">
              {{ emptyMessage }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav v-if="pageCount > 1" class="pagination" :aria-label="`${caption} pages`">
      <button class="button button-outline" type="button" :disabled="page === 1" @click="page -= 1">Previous</button>
      <button
        v-for="number in pageNumbers"
        :key="number"
        class="page-button"
        type="button"
        :aria-current="number === page ? 'page' : undefined"
        :aria-label="`Page ${number}`"
        @click="page = number"
      >
        {{ number }}
      </button>
      <button class="button button-outline" type="button" :disabled="page === pageCount" @click="page += 1">Next</button>
    </nav>
  </div>
</template>
