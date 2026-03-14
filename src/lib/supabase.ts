import { createClient } from 'supabase-wechat-stable-v2'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_KEY


export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
