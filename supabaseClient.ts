import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frndrcpinhenquqfhpzg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZybmRyY3BpbmhlbnF1cWZocHpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODMyNzIsImV4cCI6MjA4NjU1OTI3Mn0.NeRRDVZolft32t8eV0MSsuU5EY1aS-X8WbQ4Vz3biic';

export const supabase = createClient(supabaseUrl, supabaseKey);