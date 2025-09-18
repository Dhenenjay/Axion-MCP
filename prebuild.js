const fs = require('fs');
console.log('=== Build Debug ===');
console.log('Current directory:', process.cwd());
console.log('package.json exists:', fs.existsSync('package.json'));
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('package.json name:', pkg.name);
  console.log('package.json valid: true');
} catch (e) {
  console.log('package.json error:', e.message);
}
console.log('==================');
