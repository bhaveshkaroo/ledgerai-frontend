import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://mzxkymayfgscbtdwmjhf.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16eGt5bWF5ZmdzY2J0ZHdtamhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMzkwNzksImV4cCI6MjEwMzgxNTA3OX0.cRdvGkdPpVKY_3Arr2f4HGqj7ZRipn3JZtAML0erT_E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
