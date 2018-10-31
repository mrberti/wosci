"""
Sample code for using websockets with Autobahn.

requires autobahn

> pip install autobahn
"""

import json
import logging
import numpy as np
import socket
import asyncio
from autobahn.asyncio.websocket import WebSocketServerProtocol, WebSocketServerFactory

logging.basicConfig(format='%(asctime)s <%(levelname)s> %(message)s', level = logging.DEBUG)

def getIP(defaultIP="127.0.0.1", dns="1.1.1.1", port=80):
    """Try to establish a connection to a DNS server and get the local IP from 
    the socket name.
    """
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s: 
            s.connect((dns, port))
            ip = s.getsockname()[0]
    except Exception as e:
        ip = defaultIP
        logging.warning("Could not get the correct IP. Using default: " + ip + ". " + str(e))
    return ip

class WosciServerProtocol(WebSocketServerProtocol):
    """This class implements the Autobahn websocket protocol.
    """

    def __init__(self):
        super().__init__()

    def sendPacket(self, data):
        self.sendMessage(json.dumps(data).encode("UTF-8"))

    def onConnect(self, request):
        logging.info("New client connected: " + request.peer)

    async def onOpen(self):
        logging.info("WebSocket connection open.")
        
        # Create welcome message and send to client
        packet = dict()
        packet["message_type"] = "message"
        packet["message"] = "Welcome to the Autobahn server."
        self.sendPacket(packet)
        await asyncio.sleep(.4)

        while True:
            # Create sample data and send to client
            packet = dict()
            packet["message_type"] = "data_vectors"
            packet["data_vectors_count"] = 10
            data_vectors = []
            for i in range(0,packet["data_vectors_count"]):
                np_data = np.random.randint(low=100*i,high=100*(i+1),size=101)
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

    def onMessage(self, payload, isBinary):
        if isBinary:
            logging.info("Binary message received: " + len(payload) + " bytes")
        else:
            logging.info("Text message received: " + payload.decode('utf8'))

    def onClose(self, wasClean, code, reason):
        logging.info("WebSocket connection closed: " + reason)

if __name__ == '__main__':
    logging.info('Starting server')
    localIP = getIP()
    port = 5678
    serverString = u"ws://" + localIP + ":" + str(port)
    logging.info("Creating server on: " + serverString)

    factory = WebSocketServerFactory(serverString)
    factory.protocol = WosciServerProtocol

    asyncioLoop = asyncio.get_event_loop()
    coRoutine = asyncioLoop.create_server(factory, '0.0.0.0', port)
    server = asyncioLoop.run_until_complete(coRoutine)

    try:
        asyncioLoop.run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        logging.info("Closing server...")
        server.close()
        asyncioLoop.close()
        logging.info("Bye bye!")
