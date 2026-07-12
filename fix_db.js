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

async function fixDB() {
  console.log('Fixing educational_stages...');
  const { error: e1 } = await supabase
    .from('educational_stages')
    .delete()
    .in('name', ['أزهري', 'جامعي']);
  console.log('Delete stages error:', e1 ? e1.message : 'none');

  console.log('Adding new subjects...');
  const newSubjects = [
    'العلوم المتكاملة',
    'ألماني',
    'فرنساوي',
    'إيطالي',
    'ICT',
    'تربية دينية إسلامية',
    'تربية دينية مسيحية'
  ];
  
  // Note: 'الدراسات الاجتماعية', 'الأحياء', 'العلوم' already exist in schema_v2.sql.
  
  const { error: e2 } = await supabase
    .from('subjects')
    .insert(newSubjects.map(name => ({ name })));
  console.log('Insert subjects error:', e2 ? e2.message : 'none');
}

fixDB();
