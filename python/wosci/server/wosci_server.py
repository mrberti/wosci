"""This Python module acts as the main server for the frontend. The 
communication protocol is based on websockets from the autobahn implementation.

Due to the use of python's asyncio library, python3.4 is required.

requires autobahn
$ pip install autobahn
"""

import json
import logging
import time
import socket

from .. import utils

try:
    # Import non-standard dependencies
    import numpy as np
    import asyncio
    from autobahn.asyncio.websocket import (WebSocketServerProtocol, 
        WebSocketServerFactory)
except:
    logging.error("Required packages: numpy, asyncio, autobahn")
    exit()

class WosciServer():
    """This class acts as the main Wosci Server object.
    """

    def __init__(self, webSocket=None):
        self.webSocket = webSocket
        self.running = False

    def sendPacket(self, data):
        self.webSocket.sendMessage(json.dumps(data).encode("UTF-8"))

    async def run(self):
        self.running = True
        # Create welcome message and send to client
        logging.info("Running wosci server")
        packet = dict()
        packet["message_type"] = "message"
        packet["message"] = "Welcome to the Autobahn server."
        self.sendPacket(packet)
        await asyncio.sleep(.1)

        while self.running:
            try:
                # Create sample data and send to client
                packet = dict()
                packet["message_type"] = "data_vectors"
                packet["data_vectors_count"] = 10
                data_vectors = []
                for i in range(0,packet["data_vectors_count"]):
                    np_data = np.random.randint(low=100*i, high=100*(i+1), 
                        size=101)
                    data = np_data.tolist()
                    l = dict()
                    l["label"] = str(i)
                    l["unit"] = "V"
                    l["length"] = len(data)
                    l["values"] = data
                    data_vectors.append(l)
                packet["data_vectors"] = data_vectors
                await asyncio.sleep(.05)
                self.sendPacket(packet)
            except Exception as e:
                logging.error(str(e))
                self.running = False
        logging.debug("Wosci run() finished ordinarily.")
    
    def stop(self):
        self.running = False

class WosciServerProtocol(WebSocketServerProtocol):
    """This class implements the Autobahn websocket protocol.
    """

    connectionCount = 0

    def __init__(self):
        super().__init__()

    def onConnect(self, request):
        self.peer = request.peer
        WosciServerProtocol.connectionCount = \
            WosciServerProtocol.connectionCount + 1
        logging.info("New client connected: " + self.peer + ". Active "
            "connections: " + str(WosciServerProtocol.connectionCount))

    async def onOpen(self):
        logging.info("WebSocket connection open: " + self.peer)
        self.wosci = WosciServer(self)
        await self.wosci.run()

    def onMessage(self, payload, isBinary):
        if isBinary:
            logging.info("Binary message received: " + len(payload) + " bytes")
        else:
            logging.info("Text message received: " + payload.decode('utf8'))

    def onClose(self, wasClean, code, reason):
        self.wosci.stop()
        del self.wosci
        WosciServerProtocol.connectionCount = \
            WosciServerProtocol.connectionCount - 1
        logging.info("WebSocket connection closed. " + self.peer + ". Reason: "
             + str(reason) + ". Active connections: "
             + str(WosciServerProtocol.connectionCount))

def run_server():
    logging.basicConfig(
        format='%(asctime)s <%(levelname)s> %(message)s', 
        level=logging.DEBUG, 
    )
    logging.info('Starting server')
    localIP = utils.get_local_ip()
    port = 5678
    serverString = u"ws://" + localIP + ":" + str(port)
    logging.info("Creating server on: " + serverString)

    factory = WebSocketServerFactory(serverString)
    factory.protocol = WosciServerProtocol

    asyncioLoop = asyncio.get_event_loop()
    coRoutine = asyncioLoop.create_server(factory, host=None, port=port)
    server = asyncioLoop.run_until_complete(coRoutine)

    try:
        asyncioLoop.run_forever()
    except KeyboardInterrupt:
        logging.warning("Received KeyboardInterrupt. Closing server.")
    finally:
        logging.info("Closing server...")
        server.close()
        asyncioLoop.stop()
        logging.info("Bye bye!")
