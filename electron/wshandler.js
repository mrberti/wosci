"use strict"

module.exports = {
    createWebsocketServer: createWebsocketServer,
}

const WebSocketServer = require('websocket').server
const http = require('http')

let wsServer
let httpServer

function createHTTPServer() {
    httpServer = new http.createServer( (request, response) => {
        // Nothing to do here.
    })
    httpServer.listen(5679, () => {})
    console.log(new Date() + " HTTP Server created")
}

function createWebsocketServer() {
    createHTTPServer()
    wsServer = new WebSocketServer({
        httpServer: httpServer
    })
    wsServer.on('request', messageHandler)
    console.log(new Date() + " WebSocket Server created")
}

function messageHandler(request) {
    var connection = request.accept(null, request.origin)
    console.log(new Date() + " Got new connection: " + request.origin)

    connection.sendUTF("Welcome to Wosci node.js server.")

    connection.on('message', (message) => {
        console.log(new Date() + " Received message: "+ message)
    })
}