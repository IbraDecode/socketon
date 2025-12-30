//=======================================================//

const packageInfo = require('../package.json');
console.log(chalk.magentaBright.bold(`\n© Socketon v${packageInfo.version} - 2025 By IbraDecode`));
console.log(chalk.cyan(`Need Help? WhatsApp: +31617786379`));
console.log(chalk.gray("------------------------------\n"));


import makeWASocket from "./Socket/index.js";
//=======================================================//
export * from "./Defaults/index.js";
export * from "./WABinary/index.js";
export * from "../WAProto/index.js";
export * from "./WAUSync/index.js";
export * from "./Store/index.js";
export * from "./Utils/index.js";
export * from "./Types/index.js";
export * from "./WAM/index.js";
//=======================================================//
export { makeWASocket };
export default makeWASocket;
//=======================================================//