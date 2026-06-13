const fs = require('fs');

const files = [
  'e:/POS SaaS/src/app/page.js',
  'e:/POS SaaS/src/app/employees/page.js',
  'e:/POS SaaS/src/app/reports/page.js',
  'e:/POS SaaS/src/components/Topbar.js'
];

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes("import { supabase } from '@/lib/supabase';")) {
    content = content.replace(
      "import { supabase } from '@/lib/supabase';", 
      "import { createClient } from '@/utils/supabase/client';"
    );
    
    // Add const supabase = createClient(); inside the component
    // We will look for the component declaration
    content = content.replace(
      /export default function (\w+)\((.*?)\) \{/,
      "export default function $1($2) {\n  const supabase = createClient();"
    );
    
    // For Topbar which is export default function Topbar
    // Already handled by the regex above!
    
    // Wait, what if it doesn't match? Let's verify Topbar
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed imports in', filePath);
  }
});
