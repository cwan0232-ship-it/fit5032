<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const apikey = import.meta.env.VITE_OPENWEATHER_API_KEY

const city = ref('')
const weatherData = ref(null)
const error = ref('')
const loading = ref(false)

// OpenWeather returns Kelvin by default, convert it to Celsius
const temperature = computed(() =>
  weatherData.value ? Math.round(weatherData.value.main.temp - 273.15) : null,
)

const iconUrl = computed(() =>
  weatherData.value
    ? `https://openweathermap.org/img/wn/${weatherData.value.weather[0].icon}@2x.png`
    : null,
)

const fetchWeatherData = async (url) => {
  loading.value = true
  error.value = ''
  try {
    const response = await axios.get(url)
    weatherData.value = response.data
  } catch (err) {
    console.error('Error fetching weather data:', err)
    error.value =
      err.response?.data?.message || 'Could not load weather data.'
  } finally {
    loading.value = false
  }
}

// Task 10.1 - weather of the current location
const fetchCurrentLocationWeather = () => {
  if (!navigator.geolocation) {
    error.value = 'Geolocation is not supported by this browser.'
    return
  }
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apikey}`
      await fetchWeatherData(url)
    },
    () => {
      error.value = 'Location permission was denied.'
    },
  )
}

// Task 10.2 - search the weather by city, e.g. "Clayton, AU"
const searchByCity = async () => {
  if (!city.value.trim()) return
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city.value.trim())}&appid=${apikey}`
  await fetchWeatherData(url)
}

onMounted(() => {
  fetchCurrentLocationWeather()
})
</script>

<template>
  <p class="eyebrow">WEEK 10 · EXTERNAL API</p>
  <h1>Weather Check</h1>
  <form class="weather-search" @submit.prevent="searchByCity">
    <input
      id="city"
      v-model="city"
      type="text"
      placeholder="Enter a city, e.g. Clayton, AU"
      aria-label="City"
    />
    <button type="button" @click="searchByCity">Search</button>
    <button type="button" class="secondary" @click="fetchCurrentLocationWeather">
      My location
    </button>
  </form>

  <p v-if="loading" role="status">Loading weather…</p>
  <p v-if="error" class="error" role="alert">{{ error }}</p>

  <main class="weather-card panel">
    <div v-if="weatherData">
      <h2>{{ weatherData.name }}, {{ weatherData.sys.country }}</h2>
      <div class="weather-now">
        <img :src="iconUrl" alt="Weather Icon" />
        <p class="temperature">{{ temperature }} °C</p>
      </div>
      <span class="description">{{ weatherData.weather[0].description }}</span>
    </div>
    <p v-else-if="!loading">Allow location access or search for a city.</p>
  </main>
</template>
