const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: ads, error: adsErr } = await supabase.from('platform_ads').select('id').limit(1);
  console.log('platform_ads:', adsErr ? adsErr.message : 'exists');
  
  const { data: codes, error: codesErr } = await supabase.from('discount_codes').select('id').limit(1);
  console.log('discount_codes:', codesErr ? codesErr.message : 'exists');
  
  const { data: bookings, error: bookingsErr } = await supabase.from('bookings').select('id').limit(1);
  console.log('bookings:', bookingsErr ? bookingsErr.message : 'exists');
}

run();
