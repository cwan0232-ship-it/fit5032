<script setup>
// BR E.2 - map with place search (geocoding) and route planning with trip information
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import sites from '../data/sites.json'

const props = defineProps({ params: { type: Object, default: () => ({}) } })

const MELBOURNE = [-37.8136, 144.9631]
const statusColours = { Planned: '#8a6d00', Planted: '#0f6849', Establishing: '#2f7fb8', Maintenance: '#7a4fa3' }
const travelModes = {
  foot: { label: 'Walking', profile: 'routed-foot' },
  bike: { label: 'Cycling', profile: 'routed-bike' },
  car: { label: 'Driving', profile: 'routed-car' },
}

const mapElement = ref(null)
const typeFilter = ref('All')
const searchQuery = ref('')
const searchResults = ref([])
const searchStatus = ref('')
const origin = ref(null)
const destinationId = ref(props.params.site || '')
const mode = ref('foot')
const route = ref(null)
const routeStatus = ref('')
const routing = ref(false)

let map = null
let siteLayer = null
let originMarker = null
let routeLine = null

const siteTypes = ['All', ...new Set(sites.map((site) => site.type))]
const visibleSites = computed(() => sites.filter((site) => typeFilter.value === 'All' || site.type === typeFilter.value))
const destination = computed(() => sites.find((site) => site.id === destinationId.value))

function distanceKm(a, b) {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

const nearestSites = computed(() => {
  if (!origin.value) return []
  return sites
    .map((site) => ({ ...site, distance: distanceKm(origin.value, site) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
})

function drawSites() {
  siteLayer.clearLayers()
  visibleSites.value.forEach((site) => {
    L.circleMarker([site.lat, site.lng], {
      radius: 8, color: '#ffffff', weight: 2, fillColor: statusColours[site.status], fillOpacity: 0.95,
    })
      .bindPopup(`<strong>${site.name}</strong><br>${site.type} · ${site.status}<br>${site.trees} trees planted`)
      .on('click', () => { destinationId.value = site.id })
      .addTo(siteLayer)
  })
}

function setOrigin(place) {
  origin.value = place
  originMarker?.remove()
  originMarker = L.marker([place.lat, place.lng], {
    title: place.label,
    alt: place.label,
    icon: L.divIcon({ className: 'origin-pin', html: '<span></span>', iconSize: [22, 22] }),
  }).addTo(map).bindPopup(place.label)
  map.flyTo([place.lat, place.lng], 13)
}

// Feature 1: search for any place in Melbourne using OpenStreetMap geocoding
async function searchPlaces() {
  const queryText = searchQuery.value.trim()
  searchResults.value = []
  if (queryText.length < 3) {
    searchStatus.value = 'Enter at least three characters.'
    return
  }
  searchStatus.value = 'Searching…'
  try {
    const params = new URLSearchParams({
      q: queryText, format: 'jsonv2', limit: '5', countrycodes: 'au', viewbox: '144.4,-37.4,145.6,-38.4', bounded: '1',
    })
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`)
    if (!response.ok) throw new Error('Search failed')
    searchResults.value = (await response.json()).map((item) => ({
      id: item.place_id, label: item.display_name, lat: Number(item.lat), lng: Number(item.lon),
    }))
    searchStatus.value = searchResults.value.length
      ? `${searchResults.value.length} places found.`
      : 'No places found in Greater Melbourne.'
  } catch {
    searchStatus.value = 'Place search is unavailable right now. Try again shortly.'
  }
}

function chooseResult(place) {
  setOrigin(place)
  searchResults.value = []
  searchStatus.value = `Starting point set to ${place.label.split(',')[0]}.`
}

function useMyLocation() {
  if (!navigator.geolocation) {
    searchStatus.value = 'Location is not supported by this browser.'
    return
  }
  searchStatus.value = 'Finding your location…'
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      setOrigin({ label: 'Your location', lat: coords.latitude, lng: coords.longitude })
      searchStatus.value = 'Starting point set to your location.'
    },
    () => { searchStatus.value = 'Location permission was denied. Search for a place instead.' },
  )
}

function describeStep(step) {
  const { type, modifier } = step.maneuver
  const road = step.name ? ` onto ${step.name}` : ''
  if (type === 'depart') return `Start${step.name ? ` on ${step.name}` : ''}`
  if (type === 'arrive') return 'Arrive at the planting site'
  if (type === 'roundabout' || type === 'rotary') return `Take the roundabout${road}`
  if (!modifier || modifier === 'straight') return `Continue straight${road}`
  if (modifier === 'uturn') return `Make a U-turn${road}`
  return `Turn ${modifier}${road}`
}

// Feature 2: plan a route to a planting site with distance, travel time and directions
async function planRoute() {
  route.value = null
  if (!origin.value || !destination.value) {
    routeStatus.value = 'Choose a starting point and a planting site first.'
    return
  }
  routing.value = true
  routeStatus.value = 'Planning your route…'
  try {
    const points = `${origin.value.lng},${origin.value.lat};${destination.value.lng},${destination.value.lat}`
    const url = `https://routing.openstreetmap.de/${travelModes[mode.value].profile}/route/v1/driving/${points}?overview=full&geometries=geojson&steps=true`
    const response = await fetch(url)
    const data = await response.json()
    if (!response.ok || data.code !== 'Ok') throw new Error('No route')
    const best = data.routes[0]
    routeLine?.remove()
    routeLine = L.geoJSON(best.geometry, { style: { color: '#0a3f2d', weight: 5, opacity: 0.85 } }).addTo(map)
    map.fitBounds(routeLine.getBounds(), { padding: [40, 40] })
    route.value = {
      distance: (best.distance / 1000).toFixed(1),
      minutes: Math.round(best.duration / 60),
      steps: best.legs[0].steps
        .filter((step) => step.distance > 0 || step.maneuver.type === 'arrive')
        .map((step) => ({ text: describeStep(step), distance: Math.round(step.distance) })),
    }
    routeStatus.value = `${travelModes[mode.value].label} route: ${route.value.distance} km, about ${route.value.minutes} minutes.`
  } catch {
    routeStatus.value = 'A route could not be found. Try another travel mode or starting point.'
  } finally {
    routing.value = false
  }
}

function focusSite(id) {
  const site = sites.find((item) => item.id === id)
  if (!site || !map) return
  destinationId.value = id
  map.flyTo([site.lat, site.lng], 14)
}

watch(visibleSites, () => siteLayer && drawSites())
watch(() => props.params.site, (id) => id && focusSite(id))

onMounted(() => {
  map = L.map(mapElement.value, { center: MELBOURNE, zoom: 10, keyboard: true })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)
  siteLayer = L.layerGroup().addTo(map)
  drawSites()
  if (props.params.site) focusSite(props.params.site)
})

onBeforeUnmount(() => map?.remove())
</script>

<template>
  <main id="main-content" class="page-shell map-page" tabindex="-1">
    <header class="page-heading compact-heading">
      <h1>Map of planting sites</h1>
      <p>Search for a suburb or address to see the closest sites, then get walking, cycling or driving directions.</p>
    </header>

    <div class="map-layout">
      <div class="map-panel">
        <section class="map-card" aria-labelledby="search-title">
          <h2 id="search-title">Where are you starting from?</h2>
          <form class="inline-form" role="search" @submit.prevent="searchPlaces">
            <label for="place-search">Search a place or address</label>
            <div class="input-row">
              <input id="place-search" v-model="searchQuery" type="search" autocomplete="street-address" placeholder="e.g. Monash University Clayton">
              <button class="button button-primary" type="submit">Search</button>
            </div>
          </form>
          <button class="text-button" type="button" @click="useMyLocation">Use my current location</button>
          <p class="field-help" role="status" aria-live="polite">{{ searchStatus }}</p>
          <ul v-if="searchResults.length" class="result-list" aria-label="Place search results">
            <li v-for="place in searchResults" :key="place.id">
              <button type="button" @click="chooseResult(place)">{{ place.label }}</button>
            </li>
          </ul>
          <div v-if="nearestSites.length" class="nearest">
            <h3>Nearest planting sites</h3>
            <ol>
              <li v-for="site in nearestSites" :key="site.id">
                <button class="text-button" type="button" @click="focusSite(site.id)">{{ site.name }}</button>
                <span>{{ site.distance.toFixed(1) }} km · {{ site.type }}</span>
              </li>
            </ol>
          </div>
        </section>

        <section class="map-card" aria-labelledby="route-title">
          <h2 id="route-title">Directions to a site</h2>
          <form class="stack-form compact" @submit.prevent="planRoute">
            <div class="field-group">
              <label for="route-destination">Planting site</label>
              <select id="route-destination" v-model="destinationId">
                <option value="">Choose a planting site</option>
                <option v-for="site in sites" :key="site.id" :value="site.id">{{ site.name }} ({{ site.type }})</option>
              </select>
            </div>
            <fieldset class="mode-options">
              <legend>Travel mode</legend>
              <label v-for="(option, key) in travelModes" :key="key">
                <input v-model="mode" type="radio" name="travel-mode" :value="key">
                {{ option.label }}
              </label>
            </fieldset>
            <button class="button button-primary" type="submit" :disabled="routing">
              {{ routing ? 'Planning…' : 'Plan route' }}
            </button>
          </form>
          <p class="field-help" role="status" aria-live="polite">{{ routeStatus }}</p>
          <div v-if="route" class="trip-info">
            <dl>
              <div><dt>Distance</dt><dd>{{ route.distance }} km</dd></div>
              <div><dt>Travel time</dt><dd>{{ route.minutes }} min</dd></div>
            </dl>
            <h3>Directions</h3>
            <ol class="directions">
              <li v-for="(step, index) in route.steps" :key="index">
                {{ step.text }}<span v-if="step.distance"> · {{ step.distance }} m</span>
              </li>
            </ol>
          </div>
        </section>
      </div>

      <div class="map-column">
        <div class="field-group map-filter">
          <label for="site-type-filter">Show site type</label>
          <select id="site-type-filter" v-model="typeFilter">
            <option v-for="type in siteTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </div>
        <div
          ref="mapElement"
          class="map-canvas"
          role="region"
          aria-label="Map of planting sites. Use the arrow keys to pan and plus or minus to zoom. All map features are also available in the forms beside the map."
        />
        <ul class="map-legend" aria-label="Map legend">
          <li v-for="(colour, status) in statusColours" :key="status">
            <span class="legend-dot" :style="{ background: colour }" aria-hidden="true" />{{ status }}
          </li>
          <li><span class="legend-dot origin" aria-hidden="true" />Starting point</li>
        </ul>
      </div>
    </div>
  </main>
</template>
