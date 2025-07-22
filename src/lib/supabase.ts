import { createClient } from '@supabase/supabase-js';


// Initialize Supabase client
// Using direct values from project configuration
const supabaseUrl = 'https://xhojfxzqbxbhvaysqtle.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhob2pmeHpxYnhiaHZheXNxdGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MjI4ODQsImV4cCI6MjA2ODA5ODg4NH0.aD6MITEklTjgnc07fKttG0tb6gMn99hXHK33TwQueCQ';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };