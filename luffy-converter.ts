import * as ts from 'typescript';
import * as fs from 'fs';

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

function toSnakeCase(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

// Helper function to analyze and convert view method declarations
function convertViewMethod(node: ts.MethodDeclaration, className: string, fields: string[]): string {
    const methodName = node.name.getText();
    const snakeName = toSnakeCase(methodName);
    const returnType = node.type?.getText();

    // Map TypeScript types to Rust return types
    const rustReturnType = mapTypeScriptTypeToRustStruct(returnType || "unknown")
        .replace("uint", "U")
        .replace("int", "I")
        .replace("address", "Address")
        .replace("bytes", "Bytes");

    // Find the matching field for the return type (if any)
    const matchingField = fields.map(field => {
        const [rustType, fieldName] = field.replace(";", "").split(" ");
        return { rustType, fieldName };
    }).find(field => field.rustType === mapTypeScriptTypeToRustStruct(returnType || "unknown"))?.fieldName;

    if (!matchingField) {
        throw new Error(`No matching field found for return type: ${returnType}`);
    }

    // Generate the Rust implementation for the view method
    return `
    pub fn ${snakeName}(&self) -> ${rustReturnType} {
        self.${matchingField}.get()
    }
    `.trim();
}

// Helper function to check if a method has the @view decorator
function hasViewDecorator(node: ts.MethodDeclaration): boolean {
    const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
    if (!decorators) return false; // No decorators, return false

    // Check if any decorator matches @view
    return decorators.some(decorator => {
        // Ensure that the decorator expression is an identifier and matches the name 'view'
        if (ts.isCallExpression(decorator.expression)) {
            const decoratorIdentifier = decorator.expression.expression;
            return ts.isIdentifier(decoratorIdentifier) && decoratorIdentifier.text === 'view';
        }
        return ts.isIdentifier(decorator.expression) && decorator.expression.text === 'view';
    });
}

// Helper function to extract fields from a TypeScript class
function extractClassFields(node: ts.ClassDeclaration): string[] {
    const fields: string[] = [];

    node.members.forEach(member => {
        if (ts.isPropertyDeclaration(member) && member.name) {
            const fieldName = member.name.getText();
            const fieldType = member.type?.getText() || "unknown";
            const rustType = mapTypeScriptTypeToRustStruct(fieldType); // Struct type mapping

            fields.push(`${rustType} ${fieldName};`);
        }
    });

    return fields;
}

// Convert TS class to Stylus Rust
function convertToStylus(tsCode: string): string {
    const sourceFile = ts.createSourceFile('temp.ts', tsCode, ts.ScriptTarget.Latest, true);

    let structDeclaration = '';
    let implDeclaration = '';

    // Traverse the AST to find the class and its methods
    ts.forEachChild(sourceFile, node => {
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

            // Convert only @view methods to Rust implementation
            implDeclaration += `
#[public]
impl ${className} {
${methods
    .filter(method => hasViewDecorator(method as ts.MethodDeclaration)) // Check for @view decorator
    .map(method => convertViewMethod(method as ts.MethodDeclaration, className, fields))
    .join('\n')}
}
            `.trim();
        }
    });

    // Combine the struct and implementation into the final Rust code
    return `
#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use stylus_sdk::{alloy_primitives::U256, prelude::*};

${structDeclaration}

${implDeclaration}
    `.trim();
}

// Example usage of the converter
const tsCode = fs.readFileSync('counter.ts', 'utf8');
const stylusCode = convertToStylus(tsCode);

// Save the converted Stylus code to a file
fs.writeFileSync('src/lib.rs', stylusCode);

console.log('Conversion complete!');