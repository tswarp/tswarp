"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCargoToml = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const updateCargoToml = async () => {
    const spinner = (0, ora_1.default)('🔍 Updating Cargo.toml, Cargo.lock, and src/main.rs...').start();
    try {
        const currentWorkingDir = process.cwd();
        const parentDir = path_1.default.dirname(currentWorkingDir);
        const projectName = path_1.default.basename(parentDir);
        const cargoTomlPath = path_1.default.join(parentDir, 'logic', 'Cargo.toml');
        const cargoLockPath = path_1.default.join(parentDir, 'logic', 'Cargo.lock');
        const mainRsPath = path_1.default.join(parentDir, 'logic', 'src', 'main.rs');
        const updateFile = async (filePath, oldName, newName) => {
            try {
                const fileContent = await promises_1.default.readFile(filePath, 'utf-8');
                if (fileContent.includes(oldName)) {
                    const updatedContent = fileContent.replace(new RegExp(oldName, 'g'), newName);
                    await promises_1.default.writeFile(filePath, updatedContent, 'utf-8');
                    return true;
                }
                else {
                    console.log(chalk_1.default.blue(`ℹ️  No "${oldName}" found in ${path_1.default.basename(filePath)}.`));
                    return false;
                }
            }
            catch (err) {
                console.log(chalk_1.default.yellow(`⚠️  Cannot access file: ${filePath}`));
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
        }
        else {
            spinner.info('📦 Cargo files and main.rs are already up to date. No changes made.');
        }
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Failed to update Cargo files and main.rs.'));
        console.error(chalk_1.default.red(error.message));
    }
};
exports.updateCargoToml = updateCargoToml;
