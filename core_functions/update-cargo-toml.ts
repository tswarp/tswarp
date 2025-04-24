import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

const updateCargoToml = async () => {
  const spinner = ora('🔍 Updating Cargo.toml, Cargo.lock, and src/main.rs...').start();

  try {
    const currentWorkingDir = process.cwd();
    const parentDir = path.dirname(currentWorkingDir);
    const projectName = path.basename(parentDir);

    const cargoTomlPath = path.join(parentDir, 'logic', 'Cargo.toml');
    const cargoLockPath = path.join(parentDir, 'logic', 'Cargo.lock');
    const mainRsPath = path.join(parentDir, 'logic', 'src', 'main.rs');

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

    // Update Cargo.toml
    const updatedToml = await updateFile(cargoTomlPath, 'stylus-hello-world', projectName);

    // Update Cargo.lock
    const updatedLock = await updateFile(cargoLockPath, 'stylus-hello-world', projectName);

    // Update src/main.rs
    const updatedMainRs = await updateFile(mainRsPath, 'stylus_hello_world', projectName);

    if (updatedToml || updatedLock || updatedMainRs) {
      spinner.succeed('🚀 Cargo files and main.rs updated successfully!');
    } else {
      spinner.info('📦 Cargo files and main.rs are already up to date. No changes made.');
    }
  } catch (error: any) {
    spinner.fail(chalk.red('❌ Failed to update Cargo files and main.rs.'));
    console.error(chalk.red(error.message));
  }
};

export { updateCargoToml };