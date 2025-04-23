const fs = require('fs');
const path = require('path');
const ora = require('ora'); // For spinners
const chalk = require('chalk'); // For colorful output
const { execSync } = require('child_process');

module.exports = async function init(args) {
  const spinner = ora(); // Initialize spinner
  const projectName = args[0];

  if (!projectName) {
    console.error(chalk.red('❌ Please provide a project name: luffy init myproject'));
    process.exit(1);
  }

  const originalDir = process.cwd();
  const targetPath = path.join(originalDir, projectName);
  const templatesPath = path.join(__dirname, '..', 'templates');

  if (fs.existsSync(targetPath)) {
    console.error(chalk.red('❌ Directory already exists!'));
    process.exit(1);
  }

  // Create the project directory
  spinner.start(`Creating project directory "${projectName}"...`);
  try {
    fs.mkdirSync(targetPath, { recursive: true });
    spinner.succeed(chalk.green(`Created project directory "${projectName}"`));
  } catch (error) {
    spinner.fail(chalk.red(`Failed to create project directory: ${error.message}`));
    process.exit(1);
  }

  // Copy both 'converter' and 'logic' folders into target
  spinner.start('Copying template files...');
  const foldersToCopy = ['converter', 'logic'];
  try {
    for (const folder of foldersToCopy) {
      const source = path.join(templatesPath, folder);
      const destination = path.join(targetPath, folder);
      fs.cpSync(source, destination, { recursive: true });
    }
    spinner.succeed(chalk.green('Template files copied successfully'));
  } catch (error) {
    spinner.fail(chalk.red(`Failed to copy template files: ${error.message}`));
    process.exit(1);
  }

  // Step 1: Handle 'counter.ts' renaming based on projectName
  spinner.start('Renaming "counter.ts" and updating class name...');
  const counterFilePath = path.join(targetPath, 'converter', 'counter.ts');

  if (fs.existsSync(counterFilePath)) {
    try {
      if (projectName === 'counter') {
        spinner.succeed(`Project name is "${chalk.blueBright('counter')}", keeping "counter.ts" as is`);
      } else {
        const renamedFilePath = path.join(targetPath, 'converter', `${projectName}.ts`);
        let fileContent = fs.readFileSync(counterFilePath, 'utf8');

        const className = projectName.charAt(0).toUpperCase() + projectName.slice(1);
        fileContent = fileContent.replace(/class\s+Counter/, `class ${className}`);

        fs.writeFileSync(renamedFilePath, fileContent, 'utf8');
        fs.unlinkSync(counterFilePath);

        spinner.succeed(
          `Renamed "counter.ts" to "${chalk.green(`${projectName}.ts`)}" with updated class name "${chalk.green(
            className
          )}"`
        );
      }
    } catch (error) {
      spinner.fail(chalk.red(`Failed to rename "counter.ts": ${error.message}`));
      process.exit(1);
    }
  } else {
    spinner.fail(chalk.red('❌ counter.ts not found in converter folder!'));
    process.exit(1);
  }

  // Step 2: Update `package.json` inside converter
  spinner.start('Updating "package.json" in converter...');
  const packageJsonPath = path.join(targetPath, 'converter', 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      packageJson.name = projectName;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
      spinner.succeed(chalk.green(`Updated "package.json" name to "${projectName}"`));
    } catch (error) {
      spinner.fail(chalk.red(`Failed to update "package.json": ${error.message}`));
    }
  } else {
    spinner.fail(chalk.red('❌ package.json not found in converter folder!'));
  }

  // Step 3: Run npm install inside converter
  const converterPath = path.join(targetPath, 'converter');
  spinner.start('📦 Running npm install in converter...');
  try {
    execSync('npm install', { cwd: converterPath, stdio: 'inherit' });
    spinner.succeed(chalk.green('npm install completed in converter'));
  } catch (err) {
    spinner.fail(chalk.red(`npm install failed in converter: ${err.message}`));
  }

  // Final success message
  console.log('\n' + chalk.blueBright('='.repeat(80)));
  console.log(chalk.green(`✅ Project "${projectName}" initialized successfully!`));
  console.log(chalk.cyan(`👉 cd ${projectName}`));
  console.log(chalk.blueBright('='.repeat(80)) + '\n');
};