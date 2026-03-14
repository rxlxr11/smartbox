import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZWp0bnhndnNzaHhnd3B3dGYiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczMzE0NzI0OCwiZXhwIjoxODkwODEzMjQ4fQ.exampletoken';

console.log('Testing Supabase createClient with:');
console.log('  URL:', supabaseUrl);
console.log('  Key:', supabaseKey.substring(0, 20) + '...');

try {
  const client = createClient(supabaseUrl, supabaseKey);
  console.log('✓ Client created successfully');
  console.log('  Client type:', typeof client);
  console.log('  Has from method:', typeof client.from === 'function');
} catch (error) {
  console.error('✗ Error creating client:');
  console.error('  Message:', error.message);
  console.error('  Stack:', error.stack);
}
