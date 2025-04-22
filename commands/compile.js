const path = require('path');
const { execSync } = require('child_process');

module.exports = function compile() {
  const converterPath = path.join(__dirname, '..', 'luffy-converter.ts');

  try {
    // Compile the TS file and run it (requires ts-node to be installed)
    execSync(`npx ts-node ${converterPath}`, { stdio: 'inherit' });
    console.log('✅ Stylus code generated successfully!');
  } catch (error) {
    console.error('❌ Failed to compile the TypeScript logic:', error.message);
  }
};