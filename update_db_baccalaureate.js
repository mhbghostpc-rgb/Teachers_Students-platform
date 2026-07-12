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

async function updateDB() {
  console.log('Renaming ثانوي to البكالوريا...');
  const { error: e1 } = await supabase
    .from('educational_stages')
    .update({ name: 'البكالوريا' })
    .eq('name', 'ثانوي');
  
  if (e1) console.error('Error renaming:', e1.message);
  else console.log('Successfully renamed.');

  console.log('Adding new subjects for Baccalaureate & International...');
  const newSubjects = [
    'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'التاريخ', 'الجغرافيا',
    'الفلسفة', 'علم النفس', 'الاقتصاد', 'إدارة الأعمال',
    'ماث (Math)', 'ساينس (Science)', 'English', 'Math', 'Science',
    'Biology', 'Chemistry', 'Physics', 'Business', 'Economics', 'French', 'German'
  ];

  for (const name of newSubjects) {
    await supabase.from('subjects').insert({ name }).select('*').single();
  }
  console.log('Finished adding subjects.');
}

updateDB();
