import { computed, ref } from 'vue'
import { makeId, safeRead, safeWrite } from './security.js'

const RATINGS_KEY = 'urbancanopy-ratings-v2'
const seedRatings = [
  { id: 'seed-1', userId: 'community-1', projectId: 'street-tree-care', score: 5 },
  { id: 'seed-2', userId: 'community-2', projectId: 'street-tree-care', score: 4 },
  { id: 'seed-3', userId: 'community-3', projectId: 'pollinator-corridor', score: 5 },
  { id: 'seed-4', userId: 'community-4', projectId: 'school-canopy', score: 4 },
  { id: 'seed-5', userId: 'community-5', projectId: 'school-canopy', score: 5 },
]

const stored = safeRead(RATINGS_KEY, null)
const ratings = ref(Array.isArray(stored) ? stored : seedRatings)
if (!Array.isArray(stored)) safeWrite(RATINGS_KEY, ratings.value)

export function saveRating({ userId, projectId, score }) {
  const numericScore = Number(score)
  if (!userId || !projectId || !Number.isInteger(numericScore) || numericScore < 1 || numericScore > 5) {
    return { ok: false, message: 'Choose a rating from 1 to 5.' }
  }

  const existing = ratings.value.find(
    (rating) => rating.userId === userId && rating.projectId === projectId,
  )

  if (existing) {
    existing.score = numericScore
    existing.updatedAt = new Date().toISOString()
  } else {
    ratings.value.push({
      id: makeId('rating'),
      userId,
      projectId,
      score: numericScore,
      updatedAt: new Date().toISOString(),
    })
  }

  if (!safeWrite(RATINGS_KEY, ratings.value)) {
    return { ok: false, message: 'This browser could not save the rating.' }
  }
  return { ok: true }
}

export function useRatings() {
  const summaries = computed(() => {
    const grouped = new Map()
    ratings.value.forEach((rating) => {
      const group = grouped.get(rating.projectId) ?? []
      group.push(rating.score)
      grouped.set(rating.projectId, group)
    })
    return Object.fromEntries(
      [...grouped].map(([projectId, scores]) => [projectId, {
        count: scores.length,
        average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      }]),
    )
  })

  return { ratings, summaries }
}
