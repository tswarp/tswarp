#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const ora = require('ora'); // For spinners
const chalk = require('chalk'); // For colorful output
const figlet = require('figlet'); // For ASCII art
const { execSync, exec } = require('child_process');
const dotenv = require('dotenv');
const { version } = require('../package.json');

// Function to display the tswarp banner
function showBanner() {
  console.clear(); // Clear the terminal for a clean start
  console.log('\n' + chalk.blueBright('='.repeat(80)));
  console.log(
    chalk.blueBright(
      figlet.textSync('Tswarp', {
        font: 'ANSI Shadow', // Choose a font (many options available)
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: 80,
        whitespaceBreak: true,
      })
    )
  );
  console.log(chalk.blueBright('='.repeat(80) + '\n'));
  console.log(chalk.blueBright.bold('Tswarp CLI - A tool for TypeScript to Stylus Rust conversion\n'));
}

// Function to display usage information
function showUsage() {
  showBanner();
  console.log(chalk.blueBright.bold('Usage:\n'));
  console.log(chalk.cyan('  tswarp init <projectname>') + chalk.white('  - Initialize a new project'));
  console.log(chalk.cyan('  tswarp compile') + chalk.white('         - Compile TypeScript to Stylus Rust'));
  console.log(chalk.cyan('  tswarp build') + chalk.white('           - Build and validate your Stylus Rust project'));
  console.log(chalk.cyan("  tswarp estimate") + chalk.white("        - Estimate gas for deployment"));
  console.log(chalk.cyan("  tswarp deploy") + chalk.white("          - Deploy the contract"));
  console.log(chalk.cyan('  tswarp --version') + chalk.white('       - Show the current version'));
  console.log(chalk.cyan('  tswarp --help') + chalk.white('          - Show usage information'));
  console.log('\n' + chalk.blueBright('='.repeat(80)) + '\n');
}

// Function to display a spinner for a given task
async function withSpinner(taskName, taskFunction) {
  const spinner = ora(taskName).start();
  try {
    await taskFunction();
    spinner.succeed(`${taskName} completed successfully!`);
  } catch (error) {
    spinner.fail(`${taskName} failed!`);
    console.error(chalk.red(`❌ Error: ${error.message}`));
    process.exit(1);
  }
}

// Implementation of init command
async function init(args) {
  const spinner = ora(); // Initialize spinner
  const projectName = args[0];

  if (!projectName) {
    console.error(chalk.red('❌ Please provide a project name: tswarp init myproject'));
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
    execSync('npm install tswarp', { cwd: converterPath, stdio: 'inherit' });
    spinner.succeed(chalk.green('npm install completed in converter'));
  } catch (err) {
    spinner.fail(chalk.red(`npm install failed in converter: ${err.message}`));
  }

  // Final success message
  console.log('\n' + chalk.blueBright('='.repeat(80)));
  console.log(chalk.green(`✅ Project "${projectName}" initialized successfully!`));
  console.log(chalk.cyan(`👉 cd ${projectName}`));
  console.log(chalk.blueBright('='.repeat(80)) + '\n');
}

// Implementation of compile command
async function compile() {
  const converterPath = path.join(__dirname, '..', 'core_functions', 'tswarp-converter.ts');
  const spinner = ora('🔧 Compiling TypeScript to Stylus Rust...').start();

  try {
    // Attempt to run the converter using ts-node
    execSync(`npx ts-node ${converterPath}`, { stdio: 'inherit' });
    spinner.succeed(chalk.green('✅ Stylus code generated successfully!'));
  } catch (error) {
    spinner.fail(chalk.red('❌ Compilation failed.'));
    console.error(chalk.red('Error:'), chalk.yellow(error.message));
    console.log(chalk.cyan('\n👉 Tip: Make sure ts-node is installed (npm install -D ts-node)\n'));
    throw error;
  }
}

// Implementation of build command
async function build() {
  const spinner = ora('Running build...').start();

  try {
    // Run the cargo stylus check command
    execSync('cargo stylus check', { stdio: 'inherit' });
    spinner.succeed(chalk.green('Build completed successfully!'));
  } catch (error) {
    // Handle errors gracefully
    spinner.fail(chalk.red(`build failed!`));
    console.error(chalk.red(`❌ Error: ${error.message}`));
    throw error;
  }
}

// Implementation of estimate command
async function estimateGas() {
  dotenv.config(); // Load environment variables from .env
  
  const endpoint = process.env.ENDPOINT;
  const privateKey = process.env.PRIVATE_KEY;

  if (!endpoint || !privateKey) {
    throw new Error(
      "Missing environment variables. Ensure `ENDPOINT` and `PRIVATE_KEY` are set in your .env file."
    );
  }

  console.log(chalk.yellow("\nThis process may take a few minutes. Please wait..."));

  const command = `cargo stylus deploy --endpoint='${endpoint}' --private-key='${privateKey}' --estimate-gas`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(chalk.red("❌ Gas estimation failed."));
        reject(new Error(stderr));
      } else {
        console.log(chalk.green("✅ Gas estimation successful!"));
        console.log(chalk.white(stdout));
        resolve();
      }
    });
  });
}

// Implementation of deploy command
async function deployContract() {
  dotenv.config();
  
  const endpoint = process.env.ENDPOINT;
  const privateKey = process.env.PRIVATE_KEY;

  if (!endpoint || !privateKey) {
    throw new Error(
      "Missing environment variables. Ensure `ENDPOINT` and `PRIVATE_KEY` are set in your .env file."
    );
  }

  console.log(chalk.yellow("\nThis process may take a few minutes. Please wait..."));

  const command = `cargo stylus deploy --endpoint='${endpoint}' --private-key='${privateKey}'`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(chalk.red("❌ Deployment failed."));
        console.error(stderr);
        reject(new Error(stderr));
      } else {
        console.log(chalk.green("✅ Deployment successful!"));
        
        // Convert output to string and log it
        const outputStr = stdout.toString();
        console.log(outputStr);

        // First attempt with precise line matching
        let address, txHash;
        
        // Process each line individually
        const lines = outputStr.split('\n');
        for (const line of lines) {
          const cleanLine = line.trim();
          
          if (cleanLine.includes('deployed code at address:')) {
            const addrMatch = cleanLine.match(/0x[a-fA-F0-9]{40}/);
            if (addrMatch) address = addrMatch[0];
          }
          
          if (cleanLine.includes('deployment tx hash:')) {
            const txMatch = cleanLine.match(/0x[a-fA-F0-9]{64}/);
            if (txMatch) txHash = txMatch[0];
          }
        }

        // If still not found, try a broader approach
        if (!address || !txHash) {
          // Try to find any 0x address format in the output
          const addressMatches = outputStr.match(/0x[a-fA-F0-9]{40}/g);
          const txHashMatches = outputStr.match(/0x[a-fA-F0-9]{64}/g);
          
          if (addressMatches && addressMatches.length > 0) {
            address = addressMatches[addressMatches.length - 1];
          }
          
          if (txHashMatches && txHashMatches.length > 0) {
            txHash = txHashMatches[txHashMatches.length - 1];
          }
        }

        if (address && txHash) {
          console.log(chalk.blue(`Contract Address: https://sepolia.arbiscan.io/address/${address}`));
          console.log(chalk.blue(`Transaction Hash: ${txHash}`));

          const tsContent = `export const contractAddress = "${address}";
export const deploymentTxHash = "${txHash}";
`;

          fs.writeFileSync("contractAddress.ts", tsContent);
          console.log(chalk.green("📁 contractAddress.ts file created successfully!"));
        } else {
          console.log(chalk.red("❗ Could not extract contract address or transaction hash."));
          console.log(chalk.yellow("Manual extraction required:"));
          
          // Debug info
          console.log(chalk.yellow("Lines containing address information:"));
          lines.filter(line => line.includes("address")).forEach(line => console.log(chalk.gray(line)));
          
          console.log(chalk.yellow("Lines containing hash information:"));
          lines.filter(line => line.includes("hash")).forEach(line => console.log(chalk.gray(line)));
        }

        resolve();
      }
    });
  });
}

// Extract command and arguments from process.argv
const [, , cmd, ...args] = process.argv;

// Display version if the user requests it
if (cmd === '--version') {
  console.log('\n' + chalk.green.bold(`Tswarp CLI version: ${version}`));
  process.exit(0);
}

// Display help if the user requests it
if (cmd === '--help' || !cmd) {
  showUsage();
  process.exit(0);
}

// Handle commands
switch (cmd) {
  case 'init':
    if (args.length === 0) {
      console.log(chalk.red('\n❌ Error: Missing project name.'));
      console.log(chalk.yellow('👉 Example: ') + chalk.cyan('tswarp init myproject\n'));
      process.exit(1);
    }
    withSpinner('Initializing project', async () => {
      await init(args);
    });
    break;

  case 'compile':
    withSpinner('Compiling TypeScript to Stylus Rust', async () => {
      await compile();
    });
    break;
    
  case 'build':
    withSpinner('Running "cargo stylus check"', async () => {
      await build();
    });
    break;
    
  case "estimate":
    withSpinner("Estimating gas for deployment", async () => {
      await estimateGas();
    });
    break;

  case "deploy":
    withSpinner("Deploying the contract", async () => {
      await deployContract();
    });
    break;
    
  default:
    console.log(chalk.red(`\n❌ Unknown command: ${cmd}`));
    showUsage();
    process.exit(1);
}