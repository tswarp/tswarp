# Tswarp CLI

![Tswarp CLI](templates/logic/header.png)

🚀 **Tswarp CLI** is a powerful tool that simplifies the process of converting TypeScript code to Stylus Rust and managing Stylus Rust projects. With just a few commands, you can initialize projects, compile TypeScript to Stylus Rust, and validate Stylus Rust projects using `cargo stylus check`.

---

## Features

- **Project Initialization**: Quickly scaffold a new project with both TypeScript and Stylus Rust templates.
- **TypeScript to Stylus Rust Compilation**: Compile TypeScript files into Stylus Rust code.
- **Stylus Rust Validation**: Use `cargo stylus check` to validate Stylus Rust projects.
- **Customizable Templates**: Comes with prebuilt templates for both TypeScript (converter) and Stylus Rust (logic).

---

## Installation

### Prerequisites
- **Node.js**: Ensure you have Node.js installed.
- **Stylus Rust**: Install Stylus Rust using [Stylus Rustup](https://Stylus Rustup.rs/).

### Install the CLI
1. Clone this repository:
   ```bash
   git clone https://github.com/<your-username>/tswarp-cli.git
   cd tswarp-cli
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Link the CLI globally:
   ```bash
   npm link
   ```

You can now use `tswarp` as a global command.

---

## Usage

### Commands

#### 1. **Initialize a New Project**
```bash
tswarp init <projectname>
```
- **Description**: Creates a new project with a TypeScript converter and Stylus Rust logic templates.
- **Example**:
  ```bash
  tswarp init myproject
  ```
- **Result**:
  - A new directory `myproject` is created.
  - TypeScript templates are placed under `converter/`.
  - Stylus Rust templates are placed under `logic/`.

#### 2. **Compile TypeScript to Stylus Rust**
```bash
tswarp compile
```
- **Description**: Compiles the TypeScript files in the `converter` directory into Stylus Rust code.
- **Example**:
  ```bash
  tswarp compile
  ```

#### 3. **Run `cargo stylus check`**
```bash
tswarp build
```
- **Description**: Runs the `cargo stylus check` command in the current directory to validate Stylus Rust projects.
- **Example**:
  ```bash
  tswarp build
  ```

#### 4. **View CLI Version**
```bash
tswarp --version
```
- **Description**: Displays the current version of the Tswarp CLI.
- **Example**:
  ```bash
  tswarp --version
  ```

#### 5. **View Help Information**
```bash
tswarp --help
```
- **Description**: Shows the help menu with a list of all available commands.
- **Example**:
  ```bash
  tswarp --help
  ```

---

## Project Structure

When you initialize a new project with `tswarp init <projectname>`, the following structure is created:

```
<projectname>/
├── converter/                 # TypeScript project
│   ├── counter.ts             # TypeScript example file
│   ├── package.json           # Node.js package configuration
│   └── node_modules/          # Node.js dependencies
├── logic/                     # Stylus Rust project
│   ├── Cargo.toml             # Stylus Rust package configuration
│   ├── Cargo.lock             # Stylus Rust dependencies lock file
│   ├── Stylus Rust-toolchain.toml    # Stylus Rust toolchain configuration
│   ├── src/                   # Stylus Rust source code
│   │   ├── main.rs            # Main Stylus Rust entry point
│   │   └── lib.rs             # Stylus Rust library code
│   └── examples/              # Example Stylus Rust files
│       └── counter.rs
```

---

## Development Workflow

### Initializing a Project
1. **Create a New Project**:
   ```bash
   tswarp init myproject
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

### Compiling TypeScript to Stylus Rust
1. **Run the Compiler**:
   ```bash
   tswarp compile
   ```

2. **Check the Generated Stylus Rust Files**:
   - Output files will be added to the Stylus Rust `logic` directory.

### Validating Stylus Rust Code
1. **Run `cargo stylus check`**:
   ```bash
   tswarp build
   ```

2. **Fix Any Stylus Rust Issues**:
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

- **Stylus Rust**: The powerful toolchain for systems programming.
- **TypeScript**: A strongly typed programming language for JavaScript.
- **Node.js**: The runtime for running the CLI.

Enjoy using Tswarp CLI! 🚀