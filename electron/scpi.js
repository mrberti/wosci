"use strict";
module.exports = {
    getPacket: getPacket,
}

const net = require("net");

let client = new net.Socket();
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

function getPacket() {
    return packet;
}

client.setEncoding("utf8");

client.connect(5025, "192.168.1.80", () => {
    console.log("connected");
})

client.on("data", (data) => {
    let temp = parseFloat(data);
    temp = temp;
    if (temps.length > 1000) {
        temps.shift();
    }
    temps.push(temp);
    packet.dataVectors[0].length = temps.length;
    // console.log(packet);
})

client.on("ready", () => {
    setInterval( () => {client.write("MEAS:TEMP?\n");}, 100);
})

// client.on("timeout", () => {
//     client.destroy();
// })

client.on("error", (error) => {
    console.log(error.toString());
})
