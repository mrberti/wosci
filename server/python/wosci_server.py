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
from autobahn.asyncio.websocket import WebSocketServerProtocol, WebSocketServerFactory

class MyServerProtocol(WebSocketServerProtocol):

    def __init__(self):
        pass

    def onConnect(self, request):
        logging.info("Client connecting: {0}".format(request.peer))

    async def onOpen(self):
        logging.info("WebSocket connection open.")
        data = json.dumps("Welcome to the Autobahn server.").encode("UTF-8")
        self.sendMessage(data)

        packet = dict()
        while True:
            data = random.sample(range(0,1024), 20)
            packet["data_length"] = len(data)
            packet["data"] = data
            await asyncio.sleep(.05)
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
    factory = WebSocketServerFactory(u"ws://127.0.0.1:5678")
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
