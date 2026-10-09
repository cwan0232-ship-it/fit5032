<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { getAllBooksUrl } from '../api/functions'

const jsondata = ref(null)
const error = ref(null)

const getAllBookAPI = async () => {
  try {
    const response = await axios.get(getAllBooksUrl)
    jsondata.value = JSON.stringify(response.data, null, 2)
    error.value = null
  } catch (err) {
    error.value = 'Error fetching books'
    jsondata.value = null
  }
}

onMounted(() => {
  getAllBookAPI()
})
</script>

<template>
  <pre>{{ jsondata ?? error }}</pre>
</template>
