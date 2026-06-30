import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// In demo mode (no env vars), create a dummy client that won't crash.
// Auth calls will fail gracefully and AuthContext handles the fallback.
const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.placeholder'

export const isDemoMode = !supabaseUrl || !supabaseAnonKey

if (isDemoMode) {
  console.info('[RCA] Supabase env vars ausentes — modo demo ativo. Configurar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para usar auth real.')
}

export const supabase = createClient(
  supabaseUrl || PLACEHOLDER_URL,
  supabaseAnonKey || PLACEHOLDER_KEY
)
