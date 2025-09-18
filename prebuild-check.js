const fs = require('fs');
const path = require('path');

console.log('=== Import Check Debug ===');

function checkImports(dir, indent = '') {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.startsWith('.')) {
        checkImports(filePath, indent + '  ');
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.includes('@/')) {
          console.log(`FOUND @/ import in ${filePath}:${index + 1}`);
          console.log(`  Line: ${line.trim()}`);
        }
      });
    }
  }
}

// Check app and src directories
console.log('Checking app directory...');
if (fs.existsSync('app')) {
  checkImports('app');
}

console.log('Checking src directory...');
if (fs.existsSync('src')) {
  checkImports('src');
}

console.log('=== End Import Check ===');

// Also check if files exist
console.log('\n=== File Existence Check ===');
const filesToCheck = [
  'src/gee/client.ts',
  'src/mcp/registry.ts',
  'src/mcp/server-consolidated.ts',
  'src/utils/geo.ts',
  'src/lib/global-store.ts'
];

filesToCheck.forEach(file => {
  console.log(`${file}: ${fs.existsSync(file) ? 'EXISTS' : 'MISSING'}`);
});

console.log('===================');
