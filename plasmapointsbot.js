const { timestamp, timeDifference, getRndInteger, sleep } = require("./functions");
const { sendFunds } = require("./zenon_functions");

const WALLET_ADDRESS = "";
const WALLET_PASS = "";
const NODE = "ws://127.0.0.1:35998";
const FAUCET_ZTS = "zts1hz3ys62vnc8tdajnwrz6pp";
const FAUCET_AMOUNT = "1000";
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

var challenges = [];
var completedRequests = [];
var walletInUse = false;

async function newChallenge(chatId, address) {
    let num1 = getRndInteger(1, 10)
    let num2 = getRndInteger(1, 10)
    let hasBeenSolved = false;

    challenges[chatId] = {
        "num1": num1,
        "num2": num2,
        "hasBeenSolved": hasBeenSolved,
        "address": address
    }

    let msg = `Challenge: ${num1} + ${num2}`
    await bot.sendMessage(chatId, msg);
}

async function challengeResponse(chatId, answer) {
    let user = challenges[chatId]
    if (user === undefined || user.hasBeenSolved) {
        return
    }

    if (challengeSuccess(user.num1, user.num2, answer)) {
        challenges[chatId].hasBeenSolved = true
        while (walletInUse) {
            await sleep(2000)
        }
        walletInUse = true
        let response = await sendFunds(PATH, user.address, FAUCET_AMOUNT, FAUCET_ZTS, WALLET_ADDRESS, WALLET_PASS, NODE)
        walletInUse = false

        if (response === 0) {
            let msg = `1000 PP has been sent to the address ${user.address}`
            completedRequests.push([chatId, Date.now()])
            await bot.sendMessage(chatId, msg);
        } else if (response === 1) {
            let msg = `${user.address} is not a valid address`
            await bot.sendMessage(chatId, msg);
        } else {
            let msg = `There was an unexpected error. Please reach out to ${CONTACT}`
            await bot.sendMessage(chatId, msg);
        }
    } else {
        let msg = `Wrong answer`
        await bot.sendMessage(chatId, msg);
    }
}

function challengeSuccess(num1, num2, answer) {
    return (num1 + num2 === answer)
}

function recentRequests(chatId) {
    let t = Date.now()
    let numberRequests = 0;
    for (let req in completedRequests) {
        if (completedRequests[req][0] === chatId) {
            let res = timeDifference(t, completedRequests[req][1])
            if (res[0] === 0)
                numberRequests += 1
        }
    }
    return numberRequests
}

async function handleFaucetRequest(chatId, username, address) {
    if (recentRequests(chatId) >= 1) {
        let msg = `@${username} has already requested today.`
        await bot.sendMessage(chatId, msg);
    } else {
        await newChallenge(chatId, address)
    }
}

function isValid(msg) {
    return (!msg.from.is_bot && msg.chat.type === 'private')
}

async function main() {
    console.log("Initialized the telegram bot")

    bot.onText(/\/(start|help)/, async function resp(msg, match) {
	    if (!isValid(msg)) return;
	    const username = msg.chat.username;
	    await bot.sendMessage(msg.chat.id,
            "PlasmaPoints Bot\n" +
            "Use syntax: /faucet your_znn_address\n" +
            "You can claim from this faucet once daily."
        );
    });

    bot.onText(/\/faucet (.{40})$/, async function resp(msg, match){
	if (!isValid(msg)) return;
        const chatId = msg.chat.id;
        const username = msg.chat.username;
        const address = match[1].replace(/[\W_]+/g, "");
        await handleFaucetRequest(chatId, username, address)
    });

    bot.onText(/^[0-9]*$/, async function resp(msg) {
	if (!isValid(msg)) return;
        const chatId = msg.chat.id;
        const answer = parseInt(msg.text);
        await challengeResponse(chatId, answer)
    });
}

main()
