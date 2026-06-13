const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('const supabase = createClient();')) {
    // Add useState to import if not present
    if (!content.includes('useState')) {
        content = content.replace(/import \{([^}]+)\} from 'react';/, function(match, p1) {
            return `import { ${p1}, useState } from 'react';`;
        });
        // If there's no react import at all
        if (!content.includes("from 'react'")) {
            content = "import { useState } from 'react';\n" + content;
        }
    }
    content = content.replace(/const supabase = createClient\(\);/g, 'const [supabase] = useState(() => createClient());');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
}

const files = [
  'e:/POS SaaS/src/app/customers/page.js',
  'e:/POS SaaS/src/app/pos/page.js',
  'e:/POS SaaS/src/app/products/page.js',
  'e:/POS SaaS/src/app/suppliers/page.js',
  'e:/POS SaaS/src/app/transactions/page.js',
  'e:/POS SaaS/src/components/Sidebar.js'
];

files.forEach(replaceInFile);
