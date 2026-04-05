import { createClient } from "@supabase/supabase-js";
const supabaseUrl ='https://urylhfdaokxhkxqplups.supabase.co';
const supabaseAnonKey ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyeWxoZmRhb2t4aGt4cXBsdXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MjU2NTMsImV4cCI6MjA3MzEwMTY1M30.naGe9ydKgBo2hFAtQVaBjYDAiYaeO0zS0hAIFqBNyEo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);