import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL: Supabase credentials missing from .env")
}

export const supabase = createClient(
  supabaseUrl || 'https://vahofkiqjteeplikmzve.supabase.co', 
  supabaseAnonKey || 'sb_publishable_s8zi6W7m9pvYXMOUSRbi9Q_6z9fHBj1'
)
