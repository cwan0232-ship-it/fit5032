<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { countBooksUrl } from '../api/functions'

const count = ref(null)
const error = ref(null)

const getBookCount = async () => {
  try {
    const response = await axios.get(countBooksUrl)
    count.value = response.data.count
    error.value = null
  } catch (err) {
    console.error('Error fetching book count:', err)
    error.value = 'Error fetching book count'
    count.value = null
  }
}
</script>

<template>
  <p class="eyebrow">WEEK 9 · CLOUD FUNCTIONS</p>
  <h1>Book Counter</h1>
  <p>Calls the deployed <code>countBooks</code> Cloud Function.</p>
  <section class="panel function-panel">
    <button @click="getBookCount">Get Book Count</button>
    <p v-if="count !== null" class="result">Total number of books: {{ count }}</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p class="endpoint">GET {{ countBooksUrl }}</p>
  </section>
</template>
