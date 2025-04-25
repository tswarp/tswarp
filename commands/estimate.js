const { exec } = require("child_process");
const dotenv = require("dotenv");
const chalk = require("chalk");

dotenv.config(); // Load environment variables from .env

async function estimateGas() {
  const endpoint = process.env.ENDPOINT;
  const privateKey = process.env.PRIVATE_KEY;

  if (!endpoint || !privateKey) {
    throw new Error(
      "Missing environment variables. Ensure `ENDPOINT` and `PRIVATE_KEY` are set in your .env file."
    );
  }

  console.log(chalk.yellow("This process may take a few minutes. Please wait..."));

  const command = `cargo stylus deploy --endpoint='${endpoint}' --private-key='${privateKey}' --estimate-gas`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(chalk.red("❌ Gas estimation failed."));
        reject(new Error(stderr));
      } else {
        console.log(chalk.green("✅ Gas estimation successful!"));
        console.log(chalk.white(stdout));
        resolve();
      }
    });
  });
}

module.exports = estimateGas;