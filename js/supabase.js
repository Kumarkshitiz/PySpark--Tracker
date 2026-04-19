const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.db = db;
// ── SESSION ──
async function getUser() {
  const { data: { session } } = await db.auth.getSession()
  return session?.user || null
}