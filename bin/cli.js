#!/usr/bin/env node
const chalk = require('chalk'); // For colorful output
const ora = require('ora'); // For spinners
const figlet = require('figlet'); // For ASCII art
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
      const init = require('../commands/init');
      await init(args);
    });
    break;

  case 'compile':
    withSpinner('Compiling TypeScript to Stylus Rust', async () => {
      const compile = require('../commands/compile');
      await compile();
    });
    break;
  case 'build':
    withSpinner('Running "cargo stylus check"', async () => {
      const build = require('../commands/build');
      await build();
    });
      break;
  default:
    console.log(chalk.red(`\n❌ Unknown command: ${cmd}`));
    showUsage();
    process.exit(1);
}