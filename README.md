# Luffy CLI

![Luffy CLI](templates/logic/header.png)

🚀 **Luffy CLI** is a powerful tool that simplifies the process of converting TypeScript code to Rust and managing Rust projects. With just a few commands, you can initialize projects, compile TypeScript to Rust, and validate Rust projects using `cargo stylus check`.

---

## Features

- **Project Initialization**: Quickly scaffold a new project with both TypeScript and Rust templates.
- **TypeScript to Rust Compilation**: Compile TypeScript files into Rust code.
- **Rust Validation**: Use `cargo stylus check` to validate Rust projects.
- **Customizable Templates**: Comes with prebuilt templates for both TypeScript (converter) and Rust (logic).

---

## Installation

### Prerequisites
- **Node.js**: Ensure you have Node.js installed.
- **Rust**: Install Rust using [rustup](https://rustup.rs/).

### Install the CLI
1. Clone this repository:
   ```bash
   git clone https://github.com/<your-username>/luffy-cli.git
   cd luffy-cli
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Link the CLI globally:
   ```bash
   npm link
   ```

You can now use `luffy` as a global command.

---

## Usage

### Commands

#### 1. **Initialize a New Project**
```bash
luffy init <projectname>
```
- **Description**: Creates a new project with a TypeScript converter and Rust logic templates.
- **Example**:
  ```bash
  luffy init myproject
  ```
- **Result**:
  - A new directory `myproject` is created.
  - TypeScript templates are placed under `converter/`.
  - Rust templates are placed under `logic/`.

#### 2. **Compile TypeScript to Rust**
```bash
luffy compile
```
- **Description**: Compiles the TypeScript files in the `converter` directory into Rust code.
- **Example**:
  ```bash
  luffy compile
  ```

#### 3. **Run `cargo stylus check`**
```bash
luffy build
```
- **Description**: Runs the `cargo stylus check` command in the current directory to validate Rust projects.
- **Example**:
  ```bash
  luffy build
  ```

#### 4. **View CLI Version**
```bash
luffy --version
```
- **Description**: Displays the current version of the Luffy CLI.
- **Example**:
  ```bash
  luffy --version
  ```

#### 5. **View Help Information**
```bash
luffy --help
```
- **Description**: Shows the help menu with a list of all available commands.
- **Example**:
  ```bash
  luffy --help
  ```

---

## Project Structure

When you initialize a new project with `luffy init <projectname>`, the following structure is created:

```
<projectname>/
├── converter/                 # TypeScript project
│   ├── counter.ts             # TypeScript example file
│   ├── package.json           # Node.js package configuration
│   └── node_modules/          # Node.js dependencies
├── logic/                     # Rust project
│   ├── Cargo.toml             # Rust package configuration
│   ├── Cargo.lock             # Rust dependencies lock file
│   ├── rust-toolchain.toml    # Rust toolchain configuration
│   ├── src/                   # Rust source code
│   │   ├── main.rs            # Main Rust entry point
│   │   └── lib.rs             # Rust library code
│   └── examples/              # Example Rust files
│       └── counter.rs
```

---

## Development Workflow

### Initializing a Project
1. **Create a New Project**:
   ```bash
   luffy init myproject
   ```

2. **Navigate to the Project Directory**:
   ```bash
   cd myproject
   ```

3. **Install Dependencies** (for the TypeScript converter):
   ```bash
   cd converter
   npm install
   ```

### Compiling TypeScript to Rust
1. **Run the Compiler**:
   ```bash
   luffy compile
   ```

2. **Check the Generated Rust Files**:
   - Output files will be added to the Rust `logic` directory.

### Validating Rust Code
1. **Run `cargo stylus check`**:
   ```bash
   luffy build
   ```

2. **Fix Any Rust Issues**:
   - Review and fix any warnings or errors reported by the `cargo stylus check` command.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork this repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes with clear messages.
4. Submit a pull request.

---

## License

This project is licensed under the [MIT License](LICENSE). See the `LICENSE` file for details.

---

## Acknowledgments

- **Rust**: The powerful toolchain for systems programming.
- **TypeScript**: A strongly typed programming language for JavaScript.
- **Node.js**: The runtime for running the CLI.

Enjoy using Luffy CLI! 🚀
