const {timestamp} = require("./functions");
const execSync = require("child_process").execSync;

async function createWallet(mnemonic, password, node) {
    let cmd = `./znn-cli wallet.createFromMnemonic send ${mnemonic} -p ${password} -u ${node}`
    let result = execSync(cmd).toString();
    if (result.includes("invalid") || result.includes("Checksum")) {
        console.log(`${timestamp()} error: ${result}`);
        return 1;
    }

    if (!result.includes("Done")) {
        console.log(`${timestamp()} unknown error: ${result}`);
        return 2;
    }
    console.log(`stdout: ${result}`);
    return 0
}

async function sendFunds(path, recipient, amount, zts, keystore, password, node) {
    let cmd = `${path}/znn-cli send ${recipient} ${amount} ${zts} -k ${keystore} -p ${password} -i 0 -u ${node}`
    try {
        let result = execSync(cmd).toString();
        if (result.includes("invalid") || result.includes("Checksum")) {
            console.log(`${timestamp()} error: ${result}`);
            return 1;
        }

        if (!result.includes("Done")) {
            console.log(`${timestamp()} unknown error: ${result}`);
            return 2;
        }
        // console.log(`result: ${result}`);
        return 0
    } catch (e) {
        if (e.toString().includes("invalid") || e.toString().includes("Checksum")) {
            return 1;
        }
        console.log(`exception: ${e.toString()}`);
        return 2
    }
}

module.exports = { createWallet, sendFunds };