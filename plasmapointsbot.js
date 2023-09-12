const WALLET_ADDRESS = "";
const WALLET_PASS = "";
const NODE = "ws://127.0.0.1:35998";
const FAUCET_ZTS = "zts1hz3ys62vnc8tdajnwrz6pp";
const FAUCET_AMOUNT = "1000";
const BOT_USERNAME = "@plasmapoints_bot";
const CONTACT = "";
const PATH = "/path/to/plasmapointsbot"

const {
    exec
} = require("child_process");

const TelegramBot = require('node-telegram-bot-api');
const token = ''; // <---- telegram bot token
const bot = new TelegramBot(token, {
    polling: true
});


async function getZenonId() {
    rez = await bot.getChat(BOT_USERNAME);
    return rez['id'];
}
const chat_id = 0

async function init() {
    console.log("INIT")
    exec("./znn-cli  wallet.createFromMnemonic \"TESTNET_FAUCET_MNEMONIC\" \"Pass-123456\" -u ws://127.0.0.1:35998", (error, stdout, stderr) => {
        if (error) {
            console.log(`${timestamp()} error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`${timestamp()} stderr: ${stderr}`);
            return;
        }
        console.log(`${timestamp()} stdout: ${stdout}`);
    });

}

function timeDifference(date1, date2) {
    var difference = date1 - date2;

    var daysDifference = Math.floor(difference / 1000 / 60 / 60 / 24);
    difference -= daysDifference * 1000 * 60 * 60 * 24

    var hoursDifference = Math.floor(difference / 1000 / 60 / 60);
    difference -= hoursDifference * 1000 * 60 * 60

    var minutesDifference = Math.floor(difference / 1000 / 60);
    difference -= minutesDifference * 1000 * 60

    var secondsDifference = Math.floor(difference / 1000);
    //  console.log(difference)
    return [daysDifference, hoursDifference, minutesDifference, secondsDifference]
}

var error1 = 0
async function giveMoney(addr) {
    error1 = 0
    cmd = PATH + "/znn-cli send " + addr + " " + FAUCET_AMOUNT + " " + FAUCET_ZTS + " -p '" + WALLET_PASS + "' -k " + WALLET_ADDRESS + " -i 0 -u " + NODE
    await exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.log(`${timestamp()} error: ${error.message}`);
            if (String(error).includes("invalid") || String(error).includes("Checksum")) {
                console.log(`invalid address`);
                error1 = 1
            }
            else
                error1 = 2
            return;
        }
        if (stderr) {
            console.log(`${timestamp()} stderr: ${stderr}`);
            if (String(error).includes("invalid") || String(error).includes("Checksum"))
                error1 = 1
            else
                error1 = 2
            return;
        }
        if (!stdout.includes("Done")) {
            error1 = 2
            return;
        }
    });
    await sleep(5000);
}

function timestamp() {
    return "[" + new Date().toLocaleString() + "]";
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const Queue = require('@supercharge/queue-datastructure')
const to_give = new Queue()

var requests = []


async function resolve() {

    while (1) {
        if (!to_give.isEmpty()) {
            let entry = to_give.dequeue()
            let addr = entry["address"];
            let chatId = entry["chatId"];
            let username = entry["username"]
            let t = Date.now()
            var nrs = 0
            for (let req in requests) {
                if (requests[req][0] == chatId) {
                    let res = timeDifference(t, requests[req][1])
                    if (res[0] == 0)
                        nrs = nrs + 1
                }
            }
            if (nrs >= 1) {
                msg = "@" + username + " has already requested today."
                bot.sendMessage(chatId, msg);
            } else {
                await giveMoney(addr)
                if (error1 == 0) {
                    msg = "1000 PP has been sent to the address " + addr
                    requests.push([chatId, t])
                    bot.sendMessage(chatId, msg);
                } else if (error1 == 1) {
                    msg = "The address " + addr + " is invalid."
                    bot.sendMessage(chatId, msg);
                } else {
		    msg = "There was an unexpected error. Please reach out to " + CONTACT + ""
                    bot.sendMessage(chatId, msg);
                }
            }
        }
        await sleep(1000);
    }
}
async function main() {
    //await init();
    //await sleep(10000);
    resolve()

    console.log("ontext")
    bot.onText(/\/(start|help)/, async function resp(msg, match) {
	const username = msg.chat.username;
	bot.sendMessage(msg.chat.id, "PlasmaPoints Bot\nUse syntax: /faucet your_znn_address\nYou can claim from this faucet once daily.")
    });
    bot.onText(/\/faucet (.{40})$/, async function resp(msg, match) {
        const chatId = msg.chat.id;
        const username = msg.chat.username;

        const addr = match[1].replace(/[\W_]+/g, ""); // the captured "whatever"
        to_give.enqueue({
            "address": addr,
            "chatId": chatId,
            "username": username
        })
    });
}


main()
