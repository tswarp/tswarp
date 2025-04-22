#!/usr/bin/env node
const { version } = require('../package.json');

const [,, cmd, ...args] = process.argv;

if (cmd === '--version') {
    console.log(`luffy version: ${version}`);
    process.exit(0);
  }

switch (cmd) {
  case 'init':
    require('../commands/init')(args);
    break;
  default:
    console.log(`Unknown command: ${cmd}`);
    console.log(`Usage: luffy init <projectname>`);
}