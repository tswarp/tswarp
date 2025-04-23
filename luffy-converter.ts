import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import { updateCargoTomlOnCompile } from "./update-cargo-toml";

// Helper function to map TypeScript types to Rust struct types
function mapTypeScriptTypeToRustStruct(type: string): string {
    switch (type) {
        case "number":
            return "uint256";
        case "boolean":
            return "bool";
        case "Uint128":
            return "uint128";
        case "Uint64":
            return "uint64";
        case "Uint32":
            return "uint32";
        case "Uint16":
            return "uint16";
        case "Uint8":
            return "uint8";
        case "Int256":
            return "int256";
        case "Int128":
            return "int128";
        case "Int64":
            return "int64";
        case "Int32":
            return "int32";
        case "Int16":
            return "int16";
        case "Int8":
            return "int8";
        case "Address":
            return "address";
        case "Bytes":
            return "bytes";
        default:
            throw new Error(`Unsupported TypeScript type: ${type}`);
    }
}

function mapReturnTypeToRustStruct(type: string): string {
  const normalizedType = type.toLowerCase();

  switch (normalizedType) {
      case "number":
      case "uint256":
          return "U256";
      case "boolean":
          return "bool";
      case "bool":
          return "bool";
      case "uint128":
          return "U128";
      case "uint64":
          return "U64";
      case "uint32":
          return "U32";
      case "uint16":
          return "U16";
      case "uint8":
          return "U8";
      case "int256":
          return "I256";
      case "int128":
          return "I128";
      case "int64":
          return "I64";
      case "int32":
          return "I32";
      case "int16":
          return "I16";
      case "int8":
          return "I8";
      case "address":
          return "Address";
      case "bytes":
          return "Bytes";
      default:
          throw new Error(`Unsupported TypeScript type: ${type}`);
  }
}

function toSnakeCase(name: string): string {
    return name.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}

// Helper function to analyze and convert view methods
function convertViewMethod(node: ts.MethodDeclaration, fields: string[]): string {
    const methodName = node.name.getText();
    const snakeName = toSnakeCase(methodName);
    const returnType = node.type?.getText();

    // Map TypeScript types to Rust return types
    const rustReturnType = mapTypeScriptTypeToRustStruct(returnType || "unknown");
    const stylusReturnType = mapReturnTypeToRustStruct(rustReturnType || "unknown");

    // Find the matching field for the return type (if any)
    const matchingField = fields
        .map((field) => {
            const [rustType, fieldName] = field.replace(";", "").split(" ");
            return { rustType, fieldName };
        })
        .find((field) => field.rustType === mapTypeScriptTypeToRustStruct(returnType || "unknown"))?.fieldName;

    if (!matchingField) {
        throw new Error(`No matching field found for return type: ${returnType}`);
    }

    // Generate the Rust implementation for the view method
    return `
    pub fn ${snakeName}(&self) -> ${stylusReturnType} {
        self.${matchingField}.get()
    }
    `.trim();
}

// Helper function to analyze and convert write methods
function convertWriteMethod(node: ts.MethodDeclaration, fields: string[]): string {
  const methodName = node.name.getText();
  const snakeName = toSnakeCase(methodName);

  const parameters: string[] = [];
  let structField: string | undefined;

  // Iterate through the parameters
  node.parameters.forEach((param) => {
      const normalParamName = param.name.getText();
      const paramName = toSnakeCase(normalParamName);
      const paramType = param.type?.getText() || "unknown";
      const stylusParamType = mapTypeScriptTypeToRustStruct(paramType);
      const rustParamType = mapReturnTypeToRustStruct(stylusParamType);

      parameters.push(`${paramName}: ${rustParamType}`);
  });

  // Analyze the method body
  node.body?.statements.forEach((statement) => {
      // Look for direct assignments to struct fields
      if (ts.isExpressionStatement(statement) && ts.isBinaryExpression(statement.expression)) {
          const expr = statement.expression;
          const left = expr.left.getText(); // Left-hand side of the assignment
          const right = expr.right.getText(); // Right-hand side of the assignment

          // Check if the left-hand side is accessing a struct field
          if (left.startsWith("this.")) {
              const possibleField = left.replace("this.", ""); // Extract the struct field name
              if (fields.includes(possibleField)) {
                  structField = possibleField;
              } else {
                  // Fallback: Assume it's a struct field even if not in fields array
                  structField = possibleField;
              }
          }
      }
  });

  if (!structField) {
      throw new Error(`No matching struct field found in method: ${methodName}`);
  }

  // Generate the Rust implementation for the write method
  return `
  pub fn ${snakeName}(&mut self, ${parameters.join(", ")}) {
      self.${structField}.set(${parameters[0]?.split(":")[0]});
  }
  `.trim();
}

// Helper function to check if a method has a specific decorator
function hasDecorator(node: ts.MethodDeclaration, decoratorName: string): boolean {
    const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
    if (!decorators) return false;

    return decorators.some((decorator) => {
        if (ts.isCallExpression(decorator.expression)) {
            const decoratorIdentifier = decorator.expression.expression;
            return ts.isIdentifier(decoratorIdentifier) && decoratorIdentifier.text === decoratorName;
        }
        return ts.isIdentifier(decorator.expression) && decorator.expression.text === decoratorName;
    });
}

// Helper function to extract fields from a TypeScript class
function extractClassFields(node: ts.ClassDeclaration): string[] {
    const fields: string[] = [];

    node.members.forEach((member) => {
        if (ts.isPropertyDeclaration(member) && member.name) {
            const fieldName = member.name.getText();
            const fieldType = member.type?.getText() || "unknown";
            const rustType = mapTypeScriptTypeToRustStruct(fieldType);

            fields.push(`${rustType} ${fieldName};`);
        }
    });

    return fields;
}

// Convert TypeScript class to Stylus Rust
function convertToStylus(tsCode: string): string {
    const sourceFile = ts.createSourceFile("temp.ts", tsCode, ts.ScriptTarget.Latest, true);

    let structDeclaration = "";
    let implDeclaration = "";

    ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node) && node.name) {
            const className = node.name.getText();

            // Extract fields and convert the class into a Rust struct
            const fields = extractClassFields(node);
            structDeclaration += `
sol_storage! {
    #[entrypoint]
    pub struct ${className} {
        ${fields.join("\n        ")}
    }
}
            `.trim();

            // Find all methods in the class
            const methods = node.members.filter(ts.isMethodDeclaration);

            // Convert methods based on their decorators
            const viewMethods = methods
                .filter((method) => hasDecorator(method as ts.MethodDeclaration, "view"))
                .map((method) => convertViewMethod(method as ts.MethodDeclaration, fields));

            const writeMethods = methods
                .filter((method) => hasDecorator(method as ts.MethodDeclaration, "write"))
                .map((method) => convertWriteMethod(method as ts.MethodDeclaration, fields));

            implDeclaration += `
#[public]
impl ${className} {
${[...viewMethods, ...writeMethods].join("\n")}
}
            `.trim();
        }
    });

    return `
#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use stylus_sdk::{alloy_primitives::U256, prelude::*};

${structDeclaration}

${implDeclaration}
    `.trim();
}

function getProjectTsFile(): string {
    const currentDirectoryName = path.basename(process.cwd());
    const tsFilePath = path.join(process.cwd(), `${currentDirectoryName}.ts`);

    if (!fs.existsSync(tsFilePath)) {
        throw new Error(`❌ TypeScript file "${currentDirectoryName}.ts" not found in the current directory.`);
    }

    return tsFilePath;
}

try {
    // Step 1: Update Cargo.toml
    updateCargoTomlOnCompile();

    // Step 2: Convert the TypeScript file to Rust
    const tsFilePath = getProjectTsFile();
    const tsCode = fs.readFileSync(tsFilePath, "utf8");
    const stylusCode = convertToStylus(tsCode);

    // Save the converted Stylus code to a file
    const rustFilePath = path.join(process.cwd(), "src", "lib.rs");
    fs.mkdirSync(path.dirname(rustFilePath), { recursive: true });
    fs.writeFileSync(rustFilePath, stylusCode);

    console.log("✅ Conversion complete!");
    console.log(`👉 Rust code saved to: ${rustFilePath}`);
} catch (error: any) {
    console.error(error.message);
    process.exit(1);
}