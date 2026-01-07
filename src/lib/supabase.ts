import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = 'https://bxnfcyelrfwknhwmsevw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4bmZjeWVscmZ3a25od21zZXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTk1OTIsImV4cCI6MjA4MzM3NTU5Mn0.xEdQn01V8F7Bc0W-M8owHODZBU82dJJhNHgvWCXBB6c'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
