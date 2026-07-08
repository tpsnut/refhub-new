import { createClient } from '@supabase/supabase-js'

// ดึงค่ากุญแจลับที่เรากรอกไว้ในไฟล์ .env มาเปิดท่อเชื่อมต่อ
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)