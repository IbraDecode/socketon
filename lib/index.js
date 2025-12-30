//=======================================================//
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { createRequire } from 'module';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const require = createRequire(import.meta.url);
const packageInfo = require(join(__dirname, '../package.json'));

console.log(chalk.magentaBright.bold(`\n© Socketon v${packageInfo.version} - 2025 By IbraDecode`));
console.log(chalk.cyan(`Need Help? WhatsApp: +31617786379`));
console.log(chalk.gray("------------------------------\n"));

//=======================================================//
import makeWASocket from "./Socket/index.js";
import { makeWASocketon } from "./Socket/socketon.js";
//=======================================================//
export * from "./Defaults/index.js";
export * from "./WABinary/index.js";
export * from "./WAProto/index.js";
export * from "./WAUSync/index.js";
export * from "./Store/index.js";
export * from "./Utils/index.js";
export * from "./Types/index.js";
export * from "./WAM/index.js";
//=======================================================//
export { makeWASocket, makeWASocketon };
export default makeWASocket;
//=======================================================//
