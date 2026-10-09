// Base URL of the deployed Cloud Functions (us-central1 is the default region)
export const functionsBase =
  import.meta.env.VITE_FUNCTIONS_BASE_URL ||
  `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net`

export const countBooksUrl = `${functionsBase}/countBooks`
