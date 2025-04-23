import * as fs from "fs";
import * as path from "path";

// Function to extract the class name from the TypeScript file
function extractClassName(filePath: string): string | null {
  const fileContent = fs.readFileSync(filePath, "utf8");
  const classMatch = fileContent.match(/class\s+(\w+)/);
  return classMatch ? classMatch[1] : null;
}

// Function to update the `Cargo.toml` file
function updateCargoToml(className: string, cargoPath: string): void {
  const cargoContent = fs.readFileSync(cargoPath, "utf8");

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

  updateCargoToml(className, cargoTomlPath);
  console.log(`✅ Cargo.toml updated successfully with class name: ${className}`);
}