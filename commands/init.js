const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

module.exports = function init(args) {
  const projectName = args[0];
  if (!projectName) {
    console.error('❌ Please provide a project name: luffy init myproject');
    process.exit(1);
  }

  const targetPath = path.join(process.cwd(), projectName);
  const templatePath = path.join(__dirname, '..', 'templates', 'logic');

  if (fs.existsSync(targetPath)) {
    console.error('❌ Directory already exists!');
    process.exit(1);
  }

  fs.cpSync(templatePath, targetPath, { recursive: true });

  console.log(`✅ Project "${projectName}" initialized!`);
  console.log(`👉 cd ${projectName}`);
}