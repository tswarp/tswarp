const { exec } = require("child_process");
const dotenv = require("dotenv");
const chalk = require("chalk");
const fs = require("fs");

dotenv.config();

async function deployContract() {
  const endpoint = process.env.ENDPOINT;
  const privateKey = process.env.PRIVATE_KEY;

  if (!endpoint || !privateKey) {
    throw new Error(
      "Missing environment variables. Ensure `ENDPOINT` and `PRIVATE_KEY` are set in your .env file."
    );
  }

  const command = `cargo stylus deploy --endpoint='${endpoint}' --private-key='${privateKey}'`;

  console.log(chalk.cyan("🔄 Deploying the contract..."));

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(chalk.red("❌ Deployment failed."));
        console.error(stderr);
        reject(new Error(stderr));
      } else {
        console.log(chalk.green("✅ Deployment successful!"));
        
        // Convert output to string and log it
        const outputStr = stdout.toString();
        console.log(outputStr);

        // First attempt with precise line matching
        let address, txHash;
        
        // Process each line individually
        const lines = outputStr.split('\n');
        for (const line of lines) {
          const cleanLine = line.trim();
          
          if (cleanLine.includes('deployed code at address:')) {
            const addrMatch = cleanLine.match(/0x[a-fA-F0-9]{40}/);
            if (addrMatch) address = addrMatch[0];
          }
          
          if (cleanLine.includes('deployment tx hash:')) {
            const txMatch = cleanLine.match(/0x[a-fA-F0-9]{64}/);
            if (txMatch) txHash = txMatch[0];
          }
        }

        // If still not found, try a broader approach
        if (!address || !txHash) {
          // Try to find any 0x address format in the output
          const addressMatches = outputStr.match(/0x[a-fA-F0-9]{40}/g);
          const txHashMatches = outputStr.match(/0x[a-fA-F0-9]{64}/g);
          
          if (addressMatches && addressMatches.length > 0) {
            address = addressMatches[addressMatches.length - 1];
          }
          
          if (txHashMatches && txHashMatches.length > 0) {
            txHash = txHashMatches[txHashMatches.length - 1];
          }
        }

        if (address && txHash) {
          console.log(chalk.blue(`Contract Address: https://sepolia.arbiscan.io/address/${address}`));
          console.log(chalk.blue(`Transaction Hash: ${txHash}`));

          const tsContent = `export const contractAddress = "${address}";
export const deploymentTxHash = "${txHash}";
`;

          fs.writeFileSync("contractAddress.ts", tsContent);
          console.log(chalk.green("📁 contractAddress.ts file created successfully!"));
        } else {
          console.log(chalk.red("❗ Could not extract contract address or transaction hash."));
          console.log(chalk.yellow("Manual extraction required:"));
          
          // Debug info
          console.log(chalk.yellow("Lines containing address information:"));
          lines.filter(line => line.includes("address")).forEach(line => console.log(chalk.gray(line)));
          
          console.log(chalk.yellow("Lines containing hash information:"));
          lines.filter(line => line.includes("hash")).forEach(line => console.log(chalk.gray(line)));
        }

        resolve();
      }
    });
  });
}

module.exports = deployContract;