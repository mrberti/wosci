"use strict";
module.exports = {
    getPacket: getPacket,
}

const net = require("net");

let temps = [];

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

client.setEncoding("utf8");

client.on("data", (data) => {
    let temp = parseFloat(data);
    if (temps.length > 10000) {
        temps.shift();
    }
    temps.push(temp);
    // console.log(temps.toString());
    packet.dataVectors[0].length = temps.length;
    // packet.dataVectors[0].values = temps;
    // console.log(packet);
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

// Test module
// if(require.main === module) {
    setInterval( () => {
        client.connect(scpiPort, scpiHost);
    }, 1000);
// };
