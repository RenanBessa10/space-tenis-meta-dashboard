import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    return null
  }
  return createClient(supabaseUrl, supabaseKey)
}
