/* ============================================================
   7DS ORIGIN - SUPABASE CONFIGURATION
   
   INSTRUCTIONS:
   1. Go to https://supabase.com and create a new project
   2. Go to Project Settings > API
   3. Copy your Project URL and anon/public key
   4. Replace the values below
   ============================================================ */

var SUPABASE_URL = "https://gzlkdxigiejwwxewyikq.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6bGtkeGlnaWVqd3d4ZXd5aWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjU2NzMsImV4cCI6MjA4ODU0MTY3M30.62lXidTteew5WB2r3kmm6zqBVHB_6AHLz-vWwj3rRrs";

// Check if configured
if (SUPABASE_URL.includes("YOUR_PROJECT_ID")) {
    console.warn("[SupaDB] Supabase is not configured yet. Please update js/supabase-config.js");
}
