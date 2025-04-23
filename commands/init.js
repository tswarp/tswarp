const fs = require('fs');
const path = require('path');

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

  // Copy template files to the target directory
  fs.cpSync(templatePath, targetPath, { recursive: true });

  // Step 1: Rename 'counter.ts' to '<projectName>.ts'
  const counterFilePath = path.join(targetPath, 'counter.ts');
  const renamedFilePath = path.join(targetPath, `${projectName}.ts`);
  if (fs.existsSync(counterFilePath)) {
    let fileContent = fs.readFileSync(counterFilePath, 'utf8');

    // Replace the class name "Counter" with the project name (capitalize the first letter)
    const className = projectName.charAt(0).toUpperCase() + projectName.slice(1);
    fileContent = fileContent.replace(/class\s+Counter/, `class ${className}`);

    // Write the updated content to the renamed file
    fs.writeFileSync(renamedFilePath, fileContent, 'utf8');

    // Delete the original 'counter.ts' file
    fs.unlinkSync(counterFilePath);

    console.log(`✅ Renamed "counter.ts" to "${projectName}.ts" with updated class name "${className}"`);
  } else {
    console.error('❌ counter.ts not found in the template!');
    process.exit(1);
  }

  // Step 2: Update `package.json` name field
  const packageJsonPath = path.join(targetPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.name = projectName; // Update the name field
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    console.log(`✅ Updated "package.json" name to "${projectName}"`);
  } else {
    console.error('❌ package.json not found in the template!');
    process.exit(1);
  }

  console.log(`✅ Project "${projectName}" initialized successfully!`);
  console.log(`👉 cd ${projectName}`);
};