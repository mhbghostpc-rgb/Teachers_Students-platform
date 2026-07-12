const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function clean() {
  console.log('Fetching users...');
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  
  const users = data.users || [];
  const teacherUsers = users.filter(u => u.email && u.email.endsWith('@teacher.local'));
  console.log(`Found ${teacherUsers.length} teacher users to clean up.`);
  
  let deletedCount = 0;
  for (const u of teacherUsers) {
    const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(u.id);
    if (delError) {
        console.error(`Failed to delete ${u.email}:`, delError.message);
    } else {
        deletedCount++;
    }
  }
  
  console.log(`Attempting to clean up public.users...`);
  const { error: pErr } = await supabaseAdmin.from('users').delete().like('email', '%@teacher.local');
  if (pErr) console.error('Error deleting from public.users:', pErr.message);
  else console.log('Cleaned up public.users.');
  
  console.log(`Successfully deleted ${deletedCount} Auth users. Done!`);
}
clean();
