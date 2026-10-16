const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/g
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function cleanPlainText(value, maxLength = 120) {
  return String(value ?? '')
    .replace(CONTROL_CHARACTERS, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

export function normaliseEmail(value) {
  return cleanPlainText(value, 160).toLowerCase()
}

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(normaliseEmail(value))
}

export function validatePassword(value) {
  const password = String(value ?? '')
  if (password.length < 10 || password.length > 72) {
    return 'Use 10–72 characters.'
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return 'Include an uppercase letter, a lowercase letter and a number.'
  }
  return ''
}

export function safeRead(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null')
    return value ?? fallback
  } catch {
    localStorage.removeItem(key)
    return fallback
  }
}

export function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function makeId(prefix = 'item') {
  return `${prefix}-${crypto.randomUUID()}`
}
