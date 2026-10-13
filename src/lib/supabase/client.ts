import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uiijdktqnulkipwspxjh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpaWpka3RxbnVsa2lwd3NweGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NjMxNzgsImV4cCI6MjEwNjIzOTE3OH0.qsMeGrFMeHegt8RZbqjgBzoOT2k8dVHqzvGD1f9FFFI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
