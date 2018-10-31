"""
Sample code for using websockets with Autobahn.

requires autobahn

> pip install autobahn
"""

import json
import asyncio
import logging
import time
import random
import numpy as np
#import socket
from autobahn.asyncio.websocket import WebSocketServerProtocol, WebSocketServerFactory

def get_ip(defaultIP="127.0.0.1", dns="1.1.1.1", port=80):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s: 
            s.connect((dns, port))
            ip = s.getsockname()[0]
    except Exception as e:
        ip = defaultIP
        logging.warning("Could not get correct IP. Set to " + ip + ". " + str(e))
    return ip

class MyServerProtocol(WebSocketServerProtocol):

    def __init__(self):
        super().__init__()

    def onConnect(self, request):
        logging.info("Client connecting: {0}".format(request.peer))

    async def onOpen(self):
        logging.info("WebSocket connection open.")
        packet = dict()
        packet["message_type"] = "message"
        packet["message"] = "Welcome to the Autobahn server."
        self.sendMessage(json.dumps(packet).encode("UTF-8"))
        await asyncio.sleep(.4)

        while True:
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
            await asyncio.sleep(.1)
            self.sendMessage(json.dumps(packet).encode("UTF-8"))

    def onMessage(self, payload, isBinary):
        if isBinary:
            logging.info("Binary message received: {0} bytes".format(len(payload)))
        else:
            logging.info("Text message received: {0}".format(payload.decode('utf8')))

    def onClose(self, wasClean, code, reason):
        logging.info("WebSocket connection closed: {0}".format(reason))

if __name__ == '__main__':
    logging.basicConfig(format='%(asctime)s <%(levelname)s> %(message)s', level = logging.DEBUG)
    #logging.Formatter.converter = time.localtime
    logging.info('Starting server')
    #server_ip = get_ip("192.168.1.80")
    server_ip = get_ip()
    port = 5678
    serverString = u"ws://"+server_ip+":"+str(port)
    logging.info("Creating server on: " + serverString)
    factory = WebSocketServerFactory(serverString)
    factory.protocol = MyServerProtocol

    loop = asyncio.get_event_loop()
    coro = loop.create_server(factory, '0.0.0.0', 5678)
    server = loop.run_until_complete(coro)

    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        logging.info("Closing server...")
        server.close()
        loop.close()
        logging.info("Bye bye!")
