// Generates the mock datasets used by the app and the Cloud Functions.
// A seeded random generator keeps the output identical every time it runs.
import { mkdirSync, writeFileSync } from 'node:fs'

let seed = 5032
function random() {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}
const pick = (list) => list[Math.floor(random() * list.length)]
const between = (min, max) => Math.round(min + random() * (max - min))

const suburbs = [
  ['Footscray', -37.8, 144.899, 'Maribyrnong'], ['Dandenong', -37.987, 145.214, 'Greater Dandenong'],
  ['Brunswick', -37.766, 144.96, 'Merri-bek'], ['Sunshine', -37.788, 144.832, 'Brimbank'],
  ['Altona', -37.867, 144.83, 'Hobsons Bay'], ['Preston', -37.742, 145.0, 'Darebin'],
  ['Coburg', -37.744, 144.966, 'Merri-bek'], ['Richmond', -37.823, 144.998, 'Yarra'],
  ['St Kilda', -37.867, 144.98, 'Port Phillip'], ['Frankston', -38.144, 145.126, 'Frankston'],
  ['Werribee', -37.9, 144.661, 'Wyndham'], ['Box Hill', -37.819, 145.122, 'Whitehorse'],
  ['Broadmeadows', -37.68, 144.919, 'Hume'], ['Collingwood', -37.802, 144.988, 'Yarra'],
  ['Clayton', -37.915, 145.12, 'Monash'], ['Glen Waverley', -37.878, 145.165, 'Monash'],
  ['Reservoir', -37.717, 145.007, 'Darebin'], ['Williamstown', -37.858, 144.897, 'Hobsons Bay'],
  ['Northcote', -37.77, 144.999, 'Darebin'], ['Ringwood', -37.815, 145.229, 'Maroondah'],
  ['Moonee Ponds', -37.765, 144.92, 'Moonee Valley'], ['Heidelberg', -37.756, 145.067, 'Banyule'],
]
const siteTypes = ['Street trees', 'Park revegetation', 'Creek corridor', 'School grounds', 'Pollinator garden', 'Wetland edge']
const species = ['River Red Gum', 'Lemon-scented Gum', 'Blackwood', 'Drooping She-oak', 'Silver Banksia', 'Kangaroo Grass', 'Tree Violet', 'Lilly Pilly', 'Yellow Box', 'Sweet Bursaria']
const statuses = ['Planned', 'Planted', 'Establishing', 'Maintenance']
const places = ['Reserve', 'Park', 'Creek Trail', 'Primary School', 'Street', 'Wetlands', 'Community Garden', 'Linear Park']

const sites = Array.from({ length: 60 }, (_, index) => {
  const [suburb, lat, lng, council] = pick(suburbs)
  const type = pick(siteTypes)
  const status = pick(statuses)
  const year = status === 'Planned' ? 2026 : between(2023, 2026)
  const month = String(between(1, status === 'Planned' ? 12 : 9)).padStart(2, '0')
  return {
    id: `site-${String(index + 1).padStart(3, '0')}`,
    name: `${suburb} ${pick(places)}`,
    suburb,
    council,
    type,
    species: pick(species),
    trees: status === 'Planned' ? 0 : between(12, 420),
    target: between(150, 600),
    status,
    date: `${year}-${month}-${String(between(1, 28)).padStart(2, '0')}`,
    lat: Number((lat + (random() - 0.5) * 0.02).toFixed(5)),
    lng: Number((lng + (random() - 0.5) * 0.02).toFixed(5)),
  }
})

const projects = [
  ['creek-habitat-day', 'Creek Habitat Day', 'Footscray', 'Biodiversity', 20],
  ['street-tree-care', 'Street Tree Care Morning', 'Dandenong', 'Tree planting', 24],
  ['pollinator-corridor', 'Pollinator Corridor Working Bee', 'Brunswick', 'Biodiversity', 16],
  ['school-canopy', 'School Canopy Planting Day', 'Sunshine', 'Tree planting', 30],
  ['wetland-watch', 'Community Wetland Watch', 'Altona', 'Citizen science', 12],
  ['seedling-workshop', 'Native Seedling Workshop', 'Preston', 'Education', 18],
]
const slots = [['09:00', '12:00'], ['10:00', '13:00'], ['13:00', '16:00'], ['14:00', '16:30']]
const sessions = []
const first = new Date('2026-10-19T00:00:00Z')
projects.forEach(([projectId, title, suburb, type, capacity], projectIndex) => {
  for (let week = 0; week < 9; week += 1) {
    const day = new Date(first)
    // Sessions alternate between Saturdays and Sundays so some overlap on the same day.
    day.setUTCDate(first.getUTCDate() + week * 7 + 5 + (projectIndex % 2))
    const date = day.toISOString().slice(0, 10)
    const [start, end] = slots[(projectIndex + week) % slots.length]
    sessions.push({
      id: `${projectId}-${date}`,
      projectId,
      title,
      suburb,
      type,
      start: `${date}T${start}:00+11:00`,
      end: `${date}T${end}:00+11:00`,
      capacity: Math.round(capacity / 2),
    })
  }
})
sessions.sort((a, b) => a.start.localeCompare(b.start))

for (const dir of ['src/data', 'functions/data']) {
  mkdirSync(dir, { recursive: true })
  writeFileSync(`${dir}/sites.json`, `${JSON.stringify(sites, null, 2)}\n`)
  writeFileSync(`${dir}/sessions.json`, `${JSON.stringify(sessions, null, 2)}\n`)
}
console.log(`Generated ${sites.length} sites and ${sessions.length} sessions.`)
