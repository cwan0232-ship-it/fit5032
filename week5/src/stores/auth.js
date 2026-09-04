import { ref } from 'vue'

const AUTH_KEY = 'nomash-library-authenticated'

export const isAuthenticated = ref(sessionStorage.getItem(AUTH_KEY) === 'true')

export const login = (username, password) => {
  const credentialsAreValid = username === 'library' && password === 'Vue5032!'

  if (credentialsAreValid) {
    isAuthenticated.value = true
    sessionStorage.setItem(AUTH_KEY, 'true')
  }

  return credentialsAreValid
}

export const logout = () => {
  isAuthenticated.value = false
  sessionStorage.removeItem(AUTH_KEY)
}
