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

// Send the device header only to PostgREST and Edge Functions.
// Do not attach it to Supabase Auth requests; that can break browser CORS preflight.
const deviceAwareFetch = (input, init = {}) => {
  const requestUrl = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url
  const headers = new Headers(init.headers ?? (input instanceof Request ? input.headers : undefined))

  if (typeof requestUrl === 'string') {
    const path = new URL(requestUrl, url).pathname
    if (path.startsWith('/rest/v1/') || path.startsWith('/functions/v1/')) {
      headers.set('x-dental-device-id', deviceId)
    }
  }

  return fetch(input, { ...init, headers })
}

export const supabase = createClient(url, anonKey, {
  global: { fetch: deviceAwareFetch }
})
