const path = require('path');
const { execSync } = require('child_process');
const ora = require('ora');
const chalk = require('chalk');

module.exports = async function compile() {
  const converterPath = path.join(__dirname, '..','core_functions', 'tswarp-converter.ts');
  const spinner = ora('🔧 Compiling TypeScript to Stylus Rust...').start();

  try {
    // Attempt to run the converter using ts-node
    execSync(`npx ts-node ${converterPath}`, { stdio: 'inherit' });
    spinner.succeed(chalk.green('✅ Stylus code generated successfully!'));
  } catch (error) {
    spinner.fail(chalk.red('❌ Compilation failed.'));
    console.error(chalk.red('Error:'), chalk.yellow(error.message));
    console.log(chalk.cyan('\n👉 Tip: Make sure ts-node is installed (npm install -D ts-node)\n'));
  }
};