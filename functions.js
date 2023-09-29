function timeDifference(date1, date2) {
    let difference = date1 - date2;

    const daysDifference = Math.floor(difference / 1000 / 60 / 60 / 24);
    difference -= daysDifference * 1000 * 60 * 60 * 24

    const hoursDifference = Math.floor(difference / 1000 / 60 / 60);
    difference -= hoursDifference * 1000 * 60 * 60

    const minutesDifference = Math.floor(difference / 1000 / 60);
    difference -= minutesDifference * 1000 * 60

    const secondsDifference = Math.floor(difference / 1000);
    //  console.log(difference)
    return [daysDifference, hoursDifference, minutesDifference, secondsDifference]
}

function timestamp() {
    return "[" + new Date().toLocaleString() + "]";
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

module.exports = { timeDifference, timestamp, sleep, getRndInteger };