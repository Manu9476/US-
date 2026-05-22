import { useEffect, useState } from 'react'

function resolveInitialValue(initialValue) {
  return typeof initialValue === 'function' ? initialValue() : initialValue
}

function readStorageValue(key, initialValue) {
  if (typeof window === 'undefined') {
    return resolveInitialValue(initialValue)
  }

  try {
    const rawValue = window.localStorage.getItem(key)

    if (rawValue === null) {
      return resolveInitialValue(initialValue)
    }

    return JSON.parse(rawValue)
  } catch {
    return resolveInitialValue(initialValue)
  }
}

export function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() => readStorageValue(key, initialValue))

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore storage write failures and keep the UI responsive.
    }
  }, [key, value])

  return [value, setValue]
}
