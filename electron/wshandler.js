"use strict";

module.exports = {
    createWebsocketServer: createWebsocketServer,
    shutdown: shutdown,
}

const WebSocketServer = require("websocket").server;
const http = require("http");
const scpi = require("./scpi");
// const serial = require("./serial");

let wsServer;
let httpServer;

let useSCPI = true;
let useSerial = false;

let settings = {
    maxDataPoints: 1000,
}

function createHTTPServer() {
    httpServer = new http.createServer( (request, response) => {
        // Nothing to do here.
    })
    httpServer.listen(5678, () => {});
    console.log(new Date() + " HTTP Server created");
}

function createWebsocketServer() {
    createHTTPServer()
    wsServer = new WebSocketServer({
        httpServer: httpServer,
        autoAcceptConnections: false,
    })
    wsServer.on("request", messageHandler);
    console.log(new Date() + " WebSocket Server created");

    if (useSerial) {
        serial.openSerialPort("COM7", 500000);
    }
    if (useSCPI) {
        scpi.start();
    }
}

function updateSettings() {
    scpi.maxDataPoints = settings.maxDataPoints;
}

function messageHandler(request) {
    var connection = request.accept(null, request.origin);
    console.log(new Date() + " Got new connection: " + request.origin);

    let welcomeMessage = {
        packetType: "message",
        message: "Welcome to Wosci node.js server."
    }

    connection.sendUTF(JSON.stringify(welcomeMessage));

    connection.on("message", (message) => {
        let data = message.utf8Data;
        if (data.packetType == "setting") {
            /* No sanity checking here... */
            settings[data.setting] = data.value;
            updateSettings();
        }
        console.log(new Date() + " Received message: " + data);
    })

    connection.on("close", () => {
        console.log(new Date() + " Connection closed.");
        if (useSCPI) {
            scpi.events.off("new_data", sendData);
        }
    })

    function sendData() {
        let data = null;
        if (useSCPI) { data = scpi.getPacket(); }
        connection.sendUTF(JSON.stringify(data));
    }

    if (useSCPI) {
        scpi.events.on("new_data", sendData)
    }
}

function shutdown() {
    wsServer.closeAllConnections();
    wsServer.shutDown();
    wsServer = null;
    httpServer.close();
    httpServer = null;
    if (useSCPI) {
        scpi.stop();
    }
}

// Test module
if(require.main === module) {
    createWebsocketServer();
}
