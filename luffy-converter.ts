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
  const setLines: string[] = [];
  const localAssignments: string[] = [];

  node.parameters.forEach((param) => {
    const paramName = toSnakeCase(param.name.getText());
    const paramType = param.type?.getText() || "unknown";
    const stylusParamType = mapTypeScriptTypeToRustStruct(paramType);
    const rustParamType = mapReturnTypeToRustStruct(stylusParamType);
    parameters.push(`${paramName}: ${rustParamType}`);
  });

  node.body?.statements.forEach((statement) => {
    // Handle: let varName = this.field;
    if (ts.isVariableStatement(statement)) {
      const declaration = statement.declarationList.declarations[0];
      const varName = toSnakeCase(declaration.name.getText());
      const initializer = declaration.initializer?.getText();

      if (initializer?.startsWith("this.")) {
        const fieldName = toSnakeCase(initializer.replace("this.", ""));
        localAssignments.push(`let ${varName} = self.${fieldName}.get();`);
      }
    }

    // Handle: this.field = ...
    if (ts.isExpressionStatement(statement) && ts.isBinaryExpression(statement.expression)) {
      const expr = statement.expression;
      const left = expr.left.getText();
      const rightExpr = expr.right;

      if (left.startsWith("this.")) {
        const field = toSnakeCase(left.replace("this.", ""));

        // Handle binary right-hand side like: x + 1
        if (ts.isBinaryExpression(rightExpr)) {
          const op = rightExpr.operatorToken.getText();
          const leftOp = wrapLiterals(rightExpr.left);
          const rightOp = wrapLiterals(rightExpr.right);
          setLines.push(`self.${field}.set(${leftOp} ${op} ${rightOp});`);
        } else {
          // Handle direct assignment: this.field = 5 or this.field = someVar;
          const value = wrapLiterals(rightExpr);
          setLines.push(`self.${field}.set(${value});`);
        }
      }
    }
  });

  return `
    pub fn ${snakeName}(&mut self, ${parameters.join(", ")}) {
${localAssignments.length > 0 ? `        ${localAssignments.join("\n        ")}\n` : ""}        ${setLines.join("\n        ")}
    }
  `.trim();
}

// Utility to wrap numeric literals with U256::from
function wrapLiterals(expr: ts.Expression): string {
  if (ts.isNumericLiteral(expr)) {
    return `U256::from(${expr.getText()})`;
  } else {
    return toSnakeCase(expr.getText());
  }
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
${fields.map(field => `        ${field}`).join('\n')}
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

          const allMethods = [...viewMethods, ...writeMethods]
              .map(method => method.split('\n').map(line => `        ${line}`).join('\n'))
              .join('\n\n');

          implDeclaration += `
#[public]
impl ${className} {
${allMethods}
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