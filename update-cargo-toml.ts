import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

const updateCargoToml = async () => {
  const spinner = ora('🔍 Updating Cargo.toml and Cargo.lock...').start();

  try {
    const currentWorkingDir = process.cwd();
    const parentDir = path.dirname(currentWorkingDir);
    const projectName = path.basename(parentDir);

    const cargoTomlPath = path.join(parentDir, 'logic', 'Cargo.toml');
    const cargoLockPath = path.join(parentDir, 'logic', 'Cargo.lock');

    const updateFile = async (filePath: string, oldName: string, newName: string) => {
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        if (fileContent.includes(oldName)) {
          const updatedContent = fileContent.replace(new RegExp(oldName, 'g'), newName);
          await fs.writeFile(filePath, updatedContent, 'utf-8');
          return true;
        } else {
          console.log(chalk.blue(`ℹ️  No "${oldName}" found in ${path.basename(filePath)}.`));
          return false;
        }
      } catch (err) {
        console.log(chalk.yellow(`⚠️  Cannot access file: ${filePath}`));
        return false;
      }
    };

    const updatedToml = await updateFile(cargoTomlPath, 'stylus-hello-world', projectName);
    const updatedLock = await updateFile(cargoLockPath, 'stylus-hello-world', projectName);

    if (updatedToml || updatedLock) {
      spinner.succeed('🚀 Cargo files updated successfully!');
    } else {
      spinner.info('📦 Cargo files already up to date. No changes made.');
    }
  } catch (error: any) {
    spinner.fail(chalk.red('❌ Failed to update Cargo files.'));
    console.error(chalk.red(error.message));
  }
};

export { updateCargoToml };