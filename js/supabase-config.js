/* ============================================================
   7DS ORIGIN - SUPABASE CONFIGURATION
   
   INSTRUCTIONS:
   1. Go to https://supabase.com and create a new project
   2. Go to Project Settings > API
   3. Copy your Project URL and anon/public key
   4. Replace the values below
   ============================================================ */

var SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
var SUPABASE_ANON_KEY = "YOUR_PUBLIC_ANON_KEY";

// Check if configured
if (SUPABASE_URL.includes("YOUR_PROJECT_ID")) {
    console.warn("[SupaDB] Supabase is not configured yet. Please update js/supabase-config.js");
}
