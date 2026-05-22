const DAY_IN_MS = 86_400_000

export function createId(prefix = 'us-plus') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function formatDate(value) {
  if (!value) {
    return 'No date yet'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'No date yet'
  }

  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}

export function formatDateTime(value) {
  if (!value) {
    return 'No time yet'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'No time yet'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function getDaysTogether(startDate, now = new Date()) {
  if (!startDate) {
    return 0
  }

  const start = new Date(startDate)

  if (Number.isNaN(start.getTime())) {
    return 0
  }

  start.setHours(0, 0, 0, 0)

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  return Math.max(1, Math.floor((today.getTime() - start.getTime()) / DAY_IN_MS) + 1)
}

export function getCountdownParts(targetDate, now = new Date()) {
  const target = new Date(targetDate)

  if (Number.isNaN(target.getTime())) {
    return {
      complete: false,
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    }
  }

  const difference = target.getTime() - now.getTime()
  const safeDifference = Math.max(0, difference)
  const totalSeconds = Math.floor(safeDifference / 1000)

  return {
    complete: difference <= 0,
    totalMs: safeDifference,
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

export function isWithinDays(targetDate, dayCount, now = new Date()) {
  const target = new Date(targetDate)

  if (Number.isNaN(target.getTime())) {
    return false
  }

  const difference = target.getTime() - now.getTime()

  return difference > 0 && difference <= dayCount * DAY_IN_MS
}

export function sortByDateAsc(items, getDate) {
  return [...items].sort(
    (left, right) =>
      new Date(getDate(left)).getTime() - new Date(getDate(right)).getTime(),
  )
}

export function sortByDateDesc(items, getDate) {
  return [...items].sort(
    (left, right) =>
      new Date(getDate(right)).getTime() - new Date(getDate(left)).getTime(),
  )
}

export function getDailyQuote(quotes, date = new Date()) {
  if (!quotes.length) {
    return ''
  }

  const today = new Date(date)
  today.setHours(0, 0, 0, 0)

  const dayIndex = Math.abs(Math.floor(today.getTime() / DAY_IN_MS))

  return quotes[dayIndex % quotes.length]
}

export function truncate(text, length = 120) {
  if (!text) {
    return ''
  }

  return text.length <= length ? text : `${text.slice(0, length).trim()}...`
}
