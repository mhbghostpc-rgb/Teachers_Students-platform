const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value) acc[key.trim()] = value.join('=').trim();
  return acc;
}, {});

const supabase = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL'],
  env['SUPABASE_SERVICE_ROLE_KEY']
);

async function testQuery() {
  console.log('Testing filter with teacher_stages.educational_stages.name ...');
  let q1 = await supabase
    .from('teachers')
    .select(`
      id,
      display_name,
      teacher_stages!inner (
        stage:educational_stages!inner (name)
      )
    `)
    .eq('status', 'approved')
    .eq('teacher_stages.educational_stages.name', 'ثانوي');
  console.log('Result 1 (educational_stages.name):', q1.data ? q1.data.length : q1.error.message);

  console.log('Testing filter with teacher_stages.stage.name ...');
  let q2 = await supabase
    .from('teachers')
    .select(`
      id,
      display_name,
      teacher_stages!inner (
        stage:educational_stages!inner (name)
      )
    `)
    .eq('status', 'approved')
    .eq('teacher_stages.stage.name', 'ثانوي');
  console.log('Result 2 (stage.name):', q2.data ? q2.data.length : q2.error.message);
}

testQuery();
