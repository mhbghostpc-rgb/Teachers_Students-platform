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

async function fixCity() {
  console.log('Fixing city names in teachers table...');
  const { data, error } = await supabase
    .from('teachers')
    .update({ city: 'أسوان' })
    .eq('city', 'Aswan');
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Successfully updated cities to Arabic.');
  }
}

fixCity();
