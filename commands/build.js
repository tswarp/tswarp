const chalk = require('chalk'); // For colorful output
const ora = require('ora'); // For spinners
const { execSync } = require('child_process'); // For running shell commands

module.exports = async function build() {
  const spinner = ora('Running "cargo stylus check"...').start();

  try {
    // Run the cargo stylus check command
    execSync('cargo stylus check', { stdio: 'inherit' });
    spinner.succeed(chalk.green('"cargo stylus check" completed successfully!'));
  } catch (error) {
    // Handle errors gracefully
    spinner.fail(chalk.red(`"cargo stylus check" failed!`));
    console.error(chalk.red(`❌ Error: ${error.message}`));
    process.exit(1);
  }
};