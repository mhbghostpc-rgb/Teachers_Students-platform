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

async function syncDB() {
  const stages = ['ابتدائي', 'إعدادي', 'ثانوي', 'البكالوريا'];
  for (const name of stages) {
    await supabase.from('educational_stages').insert({ name, is_active: true }).select();
  }

  const subjects = [
    'اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'العلوم', 'الدراسات الاجتماعية', 'تربية دينية إسلامية', 'تربية دينية مسيحية', 'حاسب آلي (ICT)',
    'الفيزياء', 'الكيمياء', 'الأحياء', 'التاريخ', 'الجغرافيا', 'علم النفس', 'الفلسفة', 'العلوم المتكاملة', 'ألماني', 'فرنساوي', 'إيطالي',
    'Arabic', 'English', 'Math', 'Science', 'Social Studies', 'Religion', 'ICT', 'French', 'German',
    'Physics', 'Chemistry', 'Biology', 'Integrated Science', 'Business', 'Economics'
  ];

  for (const name of subjects) {
    await supabase.from('subjects').insert({ name, is_active: true }).select();
  }
  
  console.log('Sync complete.');
}

syncDB();
