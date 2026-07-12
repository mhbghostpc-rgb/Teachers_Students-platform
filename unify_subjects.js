const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('Starting unification of subjects...');

  // 1. Fetch all subjects
  const { data: subjects, error: subErr } = await supabase.from('subjects').select('*');
  if (subErr) {
    console.error('Error fetching subjects', subErr);
    return;
  }

  // Find canonical IDs
  const engCanonical = subjects.find(s => s.name === 'اللغة الإنجليزية');
  const arCanonical = subjects.find(s => s.name === 'اللغة العربية');
  const mathCanonical = subjects.find(s => s.name === 'الرياضيات');

  if (!engCanonical) {
    console.error('Could not find canonical اللغة الإنجليزية subject');
    return;
  }

  // 2. Define mappings: Old Subject Name -> Canonical ID
  const mappings = {};
  
  subjects.forEach(s => {
    if (['انجليزي', 'English'].includes(s.name)) {
      mappings[s.id] = engCanonical.id;
    }
    if (arCanonical && ['عربي', 'Arabic'].includes(s.name)) {
      mappings[s.id] = arCanonical.id;
    }
    if (mathCanonical && ['رياضيات'].includes(s.name)) {
      mappings[s.id] = mathCanonical.id;
    }
  });

  console.log(`Found ${Object.keys(mappings).length} duplicate subjects to merge.`);

  if (Object.keys(mappings).length === 0) {
    console.log('No duplicates to merge.');
    return;
  }

  // 3. Update teacher_subjects table
  for (const [oldId, newId] of Object.entries(mappings)) {
    console.log(`Mapping subject ${oldId} to ${newId}`);
    
    // First, check if the teacher already has the newId to avoid unique constraint violations
    const { data: existingLinks, error: linkErr } = await supabase
      .from('teacher_subjects')
      .select('*')
      .eq('subject_id', oldId);
      
    if (linkErr) {
      console.error('Error fetching links', linkErr);
      continue;
    }

    for (const link of existingLinks) {
      // Check if the teacher already has the canonical subject
      const { data: checkData } = await supabase
        .from('teacher_subjects')
        .select('*')
        .eq('teacher_id', link.teacher_id)
        .eq('subject_id', newId)
        .single();
        
      if (checkData) {
        // Teacher already has the canonical subject, so just delete the old duplicate link
        console.log(`Teacher ${link.teacher_id} already has canonical subject. Deleting duplicate link.`);
        await supabase
          .from('teacher_subjects')
          .delete()
          .eq('id', link.id);
      } else {
        // Update the link to point to the canonical subject
        console.log(`Updating teacher ${link.teacher_id} to canonical subject.`);
        await supabase
          .from('teacher_subjects')
          .update({ subject_id: newId })
          .eq('id', link.id);
      }
    }

    // 4. Delete the old subject from subjects table
    const { error: delErr } = await supabase
      .from('subjects')
      .delete()
      .eq('id', oldId);
      
    if (delErr) {
      console.error(`Error deleting old subject ${oldId}`, delErr);
    } else {
      console.log(`Deleted old duplicate subject ${oldId}`);
    }
  }

  console.log('Unification complete!');
}

run();
