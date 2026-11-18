import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Check your .env.local file.')
}

const DEVICE_ID_KEY = 'dentalcare_device_id'
let deviceId = localStorage.getItem(DEVICE_ID_KEY)
if (!deviceId) {
  deviceId = crypto.randomUUID()
  localStorage.setItem(DEVICE_ID_KEY, deviceId)
}

// Leave Supabase Auth and all unrelated requests completely untouched.
// Add the clinic device header only to PostgREST and Edge Function calls.
const deviceAwareFetch = (input, init = {}) => {
  const requestUrl = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url

  let path
  try {
    path = new URL(requestUrl, url).pathname
  } catch {
    return fetch(input, init)
  }

  if (!path.startsWith('/rest/v1/') && !path.startsWith('/functions/v1/')) {
    return fetch(input, init)
  }

  const headers = new Headers(init.headers ?? (input instanceof Request ? input.headers : undefined))
  headers.set('x-dental-device-id', deviceId)
  return fetch(input, { ...init, headers })
}

export const supabase = createClient(url, anonKey, {
  global: { fetch: deviceAwareFetch }
})
