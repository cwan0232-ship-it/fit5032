<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { countBooksUrl } from '../api/functions'

const jsondata = ref(null)
const error = ref(null)

const getBookCountAPI = async () => {
  try {
    const response = await axios.get(countBooksUrl)
    jsondata.value = JSON.stringify(response.data, null, 2)
    error.value = null
  } catch (err) {
    error.value = 'Error fetching book count'
    jsondata.value = null
  }
}

onMounted(() => {
  getBookCountAPI()
})
</script>

<template>
  <pre>{{ jsondata ?? error }}</pre>
</template>
