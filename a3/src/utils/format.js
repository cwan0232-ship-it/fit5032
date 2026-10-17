const dateFormat = new Intl.DateTimeFormat('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
const timeFormat = new Intl.DateTimeFormat('en-AU', { hour: 'numeric', minute: '2-digit' })

export const formatDate = (value) => (value ? dateFormat.format(new Date(value)) : '')
export const formatTime = (value) => (value ? timeFormat.format(new Date(value)) : '')
export const formatTimeRange = (start, end) => `${formatTime(start)} – ${formatTime(end)}`
