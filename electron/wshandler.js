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
        console.log(new Date() + " Received message: "+ message);
    })

    setTimeout(() => {
        setInterval(() => {
            let data = null
            if (useSCPI) { data = scpi.getPacket(); }
            if (useSerial) { data = serial.getPacket(); }
            connection.sendUTF(JSON.stringify(data));
        }, 50);
        // }, 1000);
    }, 1000);
}

function shutdown() {
    wsServer.closeAllConnections();
    wsServer.shutDown();
    wsServer = null;
    httpServer.close();
    httpServer = null;
}

// Test module
if(require.main === module) {
    createWebsocketServer();
}
