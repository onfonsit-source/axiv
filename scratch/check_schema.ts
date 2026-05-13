import { supabase } from './src/lib/supabaseClient';

async function checkSchema() {
  const { data, error } = await supabase.from('places').select('*').limit(1);
  if (error) {
    console.error('Schema check error:', error);
  } else {
    console.log('Existing columns in places table:', Object.keys(data[0] || {}));
  }
}

checkSchema();
