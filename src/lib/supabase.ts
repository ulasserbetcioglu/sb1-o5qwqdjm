import { createClient } from '@supabase/supabase-js';

// Ensure environment variables are defined
const supabaseUrl = 'https://isdwecfqcwtcjnnodwuo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZHdlY2ZxY3d0Y2pubm9kd3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNjkxNzEsImV4cCI6MjA1NTg0NTE3MX0.Nl_CWRDp0zdID42WQE_rfXu9MpDPqDzg6v7aRvC_Nuc';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);