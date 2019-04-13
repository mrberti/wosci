"use strict";
const net = require("net");
const EventEmitter  = require("events");
const fs = require("fs");
const events = new EventEmitter();
let maxDataPoints = 7200;

module.exports = {
    getPacket: getPacket,
    start: start,
    stop: stop,
    events: events,
    maxDataPoints: maxDataPoints,
}

let temps = Array(maxDataPoints).fill(NaN);

let dataVectors = {
    "label": "label",
    "unit": "unit",
    "length": 0,
    "values": temps,
}

let packet = {
    "packetType": "dataVectors",
    "dataVectorsCount": 1,
    "dataVectors": [dataVectors]
}

let scpiPort = 5025
let scpiHost = "192.168.1.91"
let client = new net.Socket();
let logFile = "log.txt"
// let logFile = null;

client.setEncoding("utf8");

client.on("data", (data) => {
    let temp = parseFloat(data);
    if (temps.length > maxDataPoints) {
        temps.shift();
    }
    temps.push(temp);
    packet.dataVectors[0].length = temps.length;
    events.emit("new_data");
    if (logFile) {
        let writeString = Date.now() + "," + temp + "\n";
        fs.writeFile(logFile, writeString, {flag: "a+"}, (err) => {});
    }
})

client.on("ready", () => {
    // console.log("onReady");
    client.write("MEAS:TEMP?\n");
})

client.on("timeout", () => {
    console.log("onTimeout")
})

client.on("error", (error) => {
    // console.log("onError" + error.toString());
})

client.on("close", () => {
    // console.log("onClose");
});

function getPacket() {
    return packet;
};

var timer = null;
function start() {
    timer = setInterval( () => {
        client.connect(scpiPort, scpiHost);
    }, 1000);
};

function stop() {
    clearInterval(timer);
}

// Test module
// if(require.main === module) {

// };
