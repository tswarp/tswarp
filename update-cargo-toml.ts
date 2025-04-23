import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// Function to extract the class name from the TypeScript file
function extractClassName(filePath: string): string | null {
  const fileContent = fs.readFileSync(filePath, "utf8");
  const classMatch = fileContent.match(/class\s+(\w+)/);
  return classMatch ? classMatch[1] : null;
}

// Function to read the project name from `Cargo.toml`
function getCargoProjectName(cargoPath: string): string | null {
  const cargoContent = fs.readFileSync(cargoPath, "utf8");
  const nameMatch = cargoContent.match(/name\s*=\s*"([^"]+)"/);
  return nameMatch ? nameMatch[1] : null;
}

// Function to update the `Cargo.toml` file
function updateCargoToml(className: string, cargoPath: string): boolean {
  const cargoContent = fs.readFileSync(cargoPath, "utf8");

  // Check if the `[package]` name already matches the class name
  const currentName = getCargoProjectName(cargoPath);
  if (currentName === className.toLowerCase()) {
    console.log(`ℹ️  Project name in Cargo.toml is already "${currentName}". No update needed.`);
    return false; // No need to update
  }

  // Update the `[package]` name
  const updatedPackageContent = cargoContent.replace(
    /name\s*=\s*".*"/,
    `name = "${className.toLowerCase()}"`
  );

  // Update the `[[bin]]` name
  const updatedBinContent = updatedPackageContent.replace(
    /name\s*=\s*".*"/g,
    (match, offset, string) => {
      // Only replace the second occurrence of `name =`
      if (string.slice(0, offset).includes("[[bin]]")) {
        return `name = "${className.toLowerCase()}"`;
      }
      return match;
    }
  );

  // Write the updated content back to the `Cargo.toml` file
  fs.writeFileSync(cargoPath, updatedBinContent, "utf8");
  console.log(`✅ Cargo.toml updated successfully with class name: ${className}`);
  return true; // Indicates that an update was made
}

// Main function to be executed
export function updateCargoTomlOnCompile(): void {
  // Dynamically determine the TypeScript file based on the current directory name
  const currentDirectoryName = path.basename(process.cwd());
  const tsFilePath = path.resolve(process.cwd(), `${currentDirectoryName}.ts`);
  const cargoTomlPath = path.resolve(process.cwd(), "Cargo.toml");

  if (!fs.existsSync(tsFilePath)) {
    console.error(`❌ TypeScript file "${currentDirectoryName}.ts" not found in the current directory.`);
    process.exit(1);
  }

  if (!fs.existsSync(cargoTomlPath)) {
    console.error(`❌ Cargo.toml file not found in the current directory.`);
    process.exit(1);
  }

  const className = extractClassName(tsFilePath);
  if (!className) {
    console.error(`❌ Class name not found in "${currentDirectoryName}.ts".`);
    process.exit(1);
  }

  // Update Cargo.toml and check if an update was made
  const updated = updateCargoToml(className, cargoTomlPath);

  // Regenerate the Cargo.lock file only if Cargo.toml was updated
  if (updated) {
    try {
      execSync("cargo generate-lockfile", { stdio: "inherit" });
      console.log(`✅ Cargo.lock updated successfully.`);
    } catch (error) {
      console.error(`❌ Failed to update Cargo.lock: ${error}`);
      process.exit(1);
    }
  } else {
    console.log(`ℹ️  No changes made to Cargo.toml. Skipping Cargo.lock regeneration.`);
  }
}