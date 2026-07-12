const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value) acc[key.trim()] = value.join('=').trim();
  return acc;
}, {});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { error } = await supabase
    .from('teachers')
    .update({ system_types: ['عربي'] })
    .eq('id', '00000000-0000-0000-0000-000000000000');
  
  if (error) {
    console.error("SUPABASE ERROR:", error.message);
  } else {
    console.log("No error!");
  }
}

test();
