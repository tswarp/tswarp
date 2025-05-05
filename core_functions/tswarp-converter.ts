import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import chalk from 'chalk';
import ora from 'ora';
import { updateCargoToml } from "./update-cargo-toml";

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
    return `    pub fn ${snakeName}(&self) -> ${stylusReturnType} {
        self.${matchingField}.get()
    }`;
}

// Helper function to analyze and convert write methods
function convertWriteMethod(node: ts.MethodDeclaration, fields: string[]): string {
    const methodName = node.name.getText();
    const snakeName = toSnakeCase(methodName);

    const parameters: string[] = [];
    const bodyLines: string[] = [];

    // Process parameters
    node.parameters.forEach((param) => {
        const paramName = toSnakeCase(param.name.getText());
        const paramType = param.type?.getText() || "unknown";
        const rustParamType = mapReturnTypeToRustStruct(paramType);
        parameters.push(`${paramName}: ${rustParamType}`);
    });

    // Process the body of the method
    const processStatement = (statement: ts.Statement | ts.Expression): string[] => {
        const result: string[] = [];

        // Handle variable declarations (e.g., let currentCounter = this.counter;)
        if (ts.isVariableStatement(statement)) {
            const declaration = statement.declarationList.declarations[0];
            const varName = toSnakeCase(declaration.name.getText());
            const initializer = declaration.initializer;

            if (initializer) {
                const initValue = wrapExpression(initializer);
                result.push(`let ${varName} = ${initValue};`);
            }
        }

        // Handle assignments (e.g., this.counter = currentCounter + value;)
        else if (ts.isExpressionStatement(statement) && ts.isBinaryExpression(statement.expression)) {
            const expr = statement.expression;
            const left = expr.left.getText();
            const right = wrapExpression(expr.right);

            if (left.startsWith("this.")) {
                const field = toSnakeCase(left.replace("this.", ""));
                result.push(`self.${field}.set(${right});`);
            }
        }

        // Handle if-else chains properly (including else if)
        else if (ts.isIfStatement(statement)) {
            const ifClauses: {condition: string, block: string[]}[] = [];
            let elseBlock: string[] = [];
            
            // Collect all conditions and blocks in the if-else chain
            let currentStatement: ts.Statement | undefined = statement;
            
            while (currentStatement && ts.isIfStatement(currentStatement)) {
                const condition = wrapExpression(currentStatement.expression);
                const thenBlock = processBlock(currentStatement.thenStatement);
                
                ifClauses.push({
                    condition,
                    block: thenBlock
                });
                
                if (!currentStatement.elseStatement) {
                    break;
                } else if (ts.isIfStatement(currentStatement.elseStatement)) {
                    currentStatement = currentStatement.elseStatement;
                } else {
                    elseBlock = processBlock(currentStatement.elseStatement);
                    break;
                }
            }
            
            // Generate Rust code for the if-else chain
            for (let i = 0; i < ifClauses.length; i++) {
                const { condition, block } = ifClauses[i];
                const prefix = i === 0 ? "if" : "} else if";
                
                result.push(`${prefix} ${condition} {`);
                result.push(`    ${block.join("\n    ")}`);
            }
            
            if (elseBlock.length > 0) {
                result.push(`} else {`);
                result.push(`    ${elseBlock.join("\n    ")}`);
            }
            
            if (ifClauses.length > 0) {
                result.push(`}`);
            }
        }

        return result;
    };

    const processBlock = (block: ts.Statement | ts.Block): string[] => {
        if (ts.isBlock(block)) {
            return block.statements.flatMap(processStatement);
        } else {
            return processStatement(block);
        }
    };

    node.body?.statements.forEach((statement) => {
        bodyLines.push(...processStatement(statement));
    });

    return `    pub fn ${snakeName}(&mut self, ${parameters.join(", ")}) {
        ${bodyLines.join("\n        ")}
    }`;
}

// Helper function to wrap literals or expressions
function wrapExpression(node: ts.Node): string {
    if (ts.isNumericLiteral(node)) {
        return `U256::from(${node.getText()})`;
    } else if (ts.isIdentifier(node)) {
        return toSnakeCase(node.getText());
    } else if (ts.isBinaryExpression(node)) {
        const left = wrapExpression(node.left);
        const operator = node.operatorToken.getText();
        const right = wrapExpression(node.right);
        return `${left} ${operator} ${right}`;
    } else if (ts.isPropertyAccessExpression(node) && node.expression.getText() === "this") {
        return `self.${toSnakeCase(node.name.getText())}.get()`;
    }
    return node.getText();
}

function generatePayableRustCode(tsFunction: string): string {
    const isPayable = tsFunction.includes('@payable');
    if (!isPayable) return '// Not a payable method';
  
    const fnNameMatch = tsFunction.match(/@payable\s+(\w+)\(([^)]*)\)/);
    const fnName = fnNameMatch?.[1] || 'unnamed_function';
    const rawParams = fnNameMatch?.[2]?.trim() || '';
  
    // Parse parameters and convert to Rust-style (name: Type)
    const params = rawParams
      .split(',')
      .map(p => p.trim())
      .filter(Boolean)
      .map(param => {
        const [name, type] = param.split(':').map(s => s.trim());
        const rustType = mapReturnTypeToRustStruct(type);
        return `${toSnakeCase(name)}: ${rustType}`;
      })
      .join(', ');
  
    const bodyLines = tsFunction
      .split('{')[1]
      ?.split('}')[0]
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean) || [];
  
    const variableMap: Record<string, string> = {};
    let rustCodeBody = [];
  
    for (const line of bodyLines) {
      // let declarations
      const letMatch = line.match(/^let\s+(\w+)\s*=\s*(.+);?$/);
      if (letMatch) {
        const [_, originalVar, exprRaw] = letMatch;
        const snakeVar = toSnakeCase(originalVar);
        variableMap[originalVar] = snakeVar;
  
        let expression = exprRaw
          .replace(/this\.(\w+)/g, (_, v) => `self.${toSnakeCase(v)}.get()`)
          .replace(/msg\.value\(\)/g, 'self.vm().msg_value()')
          .replace(/;$/, '');
  
        rustCodeBody.push(`let ${snakeVar} = ${expression};`);
        continue;
      }
  
      // Assignments: this.variable = ...
      const assignMatch = line.match(/this\.(\w+)\s*=\s*(.+);?$/);
      if (assignMatch) {
        const variable = assignMatch[1];
        let expression = assignMatch[2];
  
        for (const [orig, snake] of Object.entries(variableMap)) {
          expression = expression.replace(new RegExp(`\\b${orig}\\b`, 'g'), snake);
        }
  
        expression = expression
          .replace(/this\.(\w+)/g, (_, v) => `self.${toSnakeCase(v)}.get()`)
          .replace(/msg\.value\(\)/g, 'self.vm().msg_value()')
          .replace(/;$/, '');
  
        rustCodeBody.push(`self.${toSnakeCase(variable)}.set(${expression});`);
        continue;
      }
  
      // Handle transfer(recipient, amount)
      const transferMatch = line.match(/^transfer\s*\(\s*(.+)\s*,\s*(.+)\s*\);?$/);
      if (transferMatch) {
        let recipient = transferMatch[1].trim();
        let amount = transferMatch[2].trim();
  
        recipient = variableMap[recipient] || toSnakeCase(recipient);
        amount = variableMap[amount] || toSnakeCase(amount);
  
        rustCodeBody.push(`self.vm().transfer_eth(${recipient}, ${amount}).expect("Transfer failed");`);
        continue;
      }
  
      // General fallback line
      let converted = line;
      for (const [orig, snake] of Object.entries(variableMap)) {
        converted = converted.replace(new RegExp(`\\b${orig}\\b`, 'g'), snake);
      }
  
      converted = converted
        .replace(/this\.(\w+)/g, (_, v) => `self.${toSnakeCase(v)}.get()`)
        .replace(/msg\.value\(\)/g, 'self.vm().msg_value()')
        .replace(/;$/, '');
  
      rustCodeBody.push(`${converted};`);
    }
  
    return `    #[payable]
    pub fn ${toSnakeCase(fnName)}(&mut self${params ? `, ${params}` : ''}) {
        ${rustCodeBody.join('\n        ')}
    }`;
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

function isAddressTypeUsed(fields: string[], tsCode: string): boolean {
    return fields.some((field) => field.includes("address")) || tsCode.includes("Address");
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
    const fields: string[] = [];
    let addressUsed = false;
    let implementsIERC20 = false; // Flag to track IERC20 implementation

    ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node) && node.name) {
            const className = node.name.getText();

            // Check if the class implements IERC20
            implementsIERC20 = node.heritageClauses?.some((clause) =>
                clause.types.some((type) => type.expression.getText() === "IERC20")
            ) ?? false;
            // Extract fields and convert the class into a Rust struct
            const fields = extractClassFields(node);
            structDeclaration = `sol_storage! {
    #[entrypoint]
    pub struct ${className} {
${fields.map(field => `        ${field}`).join('\n')}
${implementsIERC20 ? `        #[borrow]
        Erc20 erc20;` : ""}
    }
}`;

            const methods = node.members.filter(ts.isMethodDeclaration);

            // Convert methods based on their decorators
            const viewMethods = methods
                .filter((method) => hasDecorator(method, "view"))
                .map((method) => convertViewMethod(method, fields));

            const writeMethods = methods
                .filter((method) => hasDecorator(method, "write"))
                .map((method) => convertWriteMethod(method, fields));

            const payableMethods = methods
                .filter((method) => hasDecorator(method, "payable"))
                .map((method) => {
                    const methodText = method.getFullText(sourceFile);
                    return generatePayableRustCode(methodText);
                });

            // Add IERC20-specific methods if applicable
            const ierc20Methods = implementsIERC20 ? [
                `    pub fn constructor(&mut self, name: String, symbol: String, decimals: u8) {
        self.erc20.initialize(name, symbol, decimals);
    }`,
                `    pub fn mint(&mut self, value: U256) -> Result<(), Erc20Error> {
        self.erc20.mint(msg::sender(), value)?;
        Ok(())
    }`,
                `    pub fn mint_to(&mut self, to: Address, value: U256) -> Result<(), Erc20Error> {
        self.erc20.mint(to, value)?;
        Ok(())
    }`,
                `    pub fn burn(&mut self, value: U256) -> Result<(), Erc20Error> {
        self.erc20.burn(msg::sender(), value)?;
        Ok(())
    }`,
            ] : [];

            implDeclaration = `#[public]
${implementsIERC20 ? `#[inherit(Erc20)]` : ""}
impl ${className} {
${[ ...ierc20Methods, ...viewMethods, ...writeMethods, ...payableMethods].join('\n\n')}
}`;
        }
    });

    addressUsed = isAddressTypeUsed(fields, tsCode);

    const additionalImports = implementsIERC20 ? `
mod erc20;

use stylus_sdk::{
    msg,
    storage::{StorageString, StorageUint}
};

use crate::erc20::{Erc20, Erc20Error};` : "";

    return `#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use stylus_sdk::{alloy_primitives::{U256${addressUsed || implementsIERC20? ", Address" : ""}}, prelude::*};${additionalImports}

${structDeclaration}

${implDeclaration}`;
}

function checkImplementsIERC20(implementsIERC20: boolean, rustFilePath: string): void {
    if (!implementsIERC20) {
        return;
    }
    const parentFileDir = path.dirname(__filename);
    const grandParentDir = path.dirname(parentFileDir);
    const contractDir = path.join(grandParentDir, 'contract');
    const erc20FilePath = path.join(contractDir, 'erc20.rs');
  
    if (fs.existsSync(erc20FilePath)) {
      const destinationErc20FilePath = path.join(rustFilePath, 'erc20.rs');
      fs.mkdirSync(path.dirname(destinationErc20FilePath), { recursive: true });

      fs.copyFileSync(erc20FilePath, destinationErc20FilePath);
      console.log(`${chalk.green('✅ erc20.rs copied to:')} ${chalk.white(destinationErc20FilePath)}`);
    } else {
      throw new Error(
        `${chalk.red('❌ File missing:')} ${chalk.yellow('erc20.rs')}\n` +
        `${chalk.cyan('💡 Ensure the ERC20 contract file exists in the "contract" directory.')}`
      );
    }
  }

function getProjectTsFile(): string {
  const currentWorkingDir = process.cwd();
  const parentDir = path.dirname(currentWorkingDir);
  const projectName = path.basename(parentDir);
  const tsFilePath = path.join(currentWorkingDir, `${projectName}.ts`);

  if (!fs.existsSync(tsFilePath)) {
    throw new Error(
      `${chalk.red('❌ Missing File:')} ${chalk.yellow(tsFilePath)}\n` +
      `${chalk.cyan('👉 Expected a file named')} ${chalk.bold(`${projectName}.ts`)} ${chalk.cyan('in the current directory.')}`
    );
  }

  return tsFilePath;
}

(async () => {
  const spinner = ora('🔄 Converting TypeScript to Rust using Stylus...').start();

  try {
    updateCargoToml();

    const tsFilePath = getProjectTsFile();
    const tsCode = fs.readFileSync(tsFilePath, 'utf8');
    const stylusCode = convertToStylus(tsCode);

    const parentDir = path.dirname(process.cwd());
    const rustFilePath = path.join(parentDir, 'logic', 'src');
    fs.mkdirSync(rustFilePath, { recursive: true });
    const rustOutputFilePath = path.join(rustFilePath, 'lib.rs');
    fs.writeFileSync(rustOutputFilePath, stylusCode);

    const implementsIERC20 = stylusCode.includes("Erc20");
    checkImplementsIERC20(implementsIERC20, rustFilePath);

    spinner.succeed(chalk.green('Conversion successful!'));
    console.log(`${chalk.blueBright('📦 Output written to:')} ${chalk.white(rustFilePath)}`);
  } catch (error: any) {
    spinner.fail(chalk.red('❌ Conversion failed.'));
    console.error(error.message);
    console.log(chalk.gray('💡 Ensure the TypeScript file exists and is correctly named.'));
    process.exit(1);
  }
})();