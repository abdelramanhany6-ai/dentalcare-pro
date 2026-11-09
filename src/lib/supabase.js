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

export const supabase = createClient(url, anonKey, {
  global: { headers: { 'x-dental-device-id': deviceId } }
})
