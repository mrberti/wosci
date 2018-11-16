import logging
logging.basicConfig(format='%(asctime)s <%(levelname)s> %(message)s', level = 
    logging.DEBUG)
import socket
import time
import sys
import threading
import random
import re

def get_ip(dns="1.1.1.1", port=80):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.connect((dns, port))
        ip = s.getsockname()[0]
    except Exception as e:
        ip = "127.0.0.1"
        logging.warning("Could not get correct IP. Set to " + ip + ". " 
            + str(e))
    finally:
        s.close()
    return ip

class WosciSCPI():
    settings = {}
    def __init__(self):
        pass

class WosciSignalGenerator():
    def __init__(self):
        self.sockReceiver = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sockSender =  socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.localHost = None
        self.localPort = None
        self.destHost = None
        self.destPort = None
        self.threadEvent = threading.Event()
        self.threadListener = threading.Thread(name='_messageHandler', 
            target=self._messageHandler, args=(self.threadEvent,))
        self.threadSender = threading.Thread(name='_senderHandler', 
            target=self._senderHandler, args=(self.threadEvent,))
        # Set the threads as daemon so we can forget about them
        self.threadListener.daemon = True
        self.threadSender.daemon = True

    def __del__(self):
        if self.sockReceiver:
            self.sockReceiver.close()
        if self.sockSender:
            self.sockSender.close()
        logging.info("Signal generator deleted")

    def startListener(self, localHost="127.0.0.1", localPort=5005):
        logging.info("Bind listener to: " + str(localHost) + ":" 
            + str(localPort))
        try:
            self.sockReceiver.bind((localHost, localPort))
        except Exception as e:
            logging.error("Could not bind to socket. " + str(e))
        if not self.threadListener.isAlive():
            self.threadListener.start()

    def startSender(self, destHost, destPort=5006):
        self.destHost = destHost
        self.destPort = destPort
        logging.debug("Started sending to: " + str(self.destHost) + ":" 
            + str(self.destPort))
        if not self.threadSender.isAlive():
            self.threadSender.start()

    def _messageHandler(self, event):
        logging.debug("Started message Handler thread.")
        while True:
            try:
                # The message handler thread will be caught in this blocking
                # call and wait for messages forever
                finish_recv = False
                data, addr = self.sockReceiver.recvfrom(10240)
                while not finish_recv:
                    if not "\n" in data:
                        logging.debug("Did not receive EOL character." 
                            + repr(data))
                        data = data + self.sockReceiver.recv(10240)
                    else:
                        finish_recv = True
                logging.debug("Receive complete: " + repr(data))
            except Exception as e:
                logging.error(str(e))
                continue
            cmd = data.decode('UTF-8').upper()
            
            if re.match(r"\*IDN\?", cmd):
                retStr = "WOSCISIGNALGEN,V0.0\n"
                logging.debug(repr(retStr))
                self.sockSender.sendto(retStr.encode('UTF-8'), addr)
            if re.match(r"\*RST", cmd):
                logging.debug("*RST")
                #event.set()
                #destHost = addr[0]
                #self.startSender(destHost)
            #elif "stop" in cmd:
            #    event.clear()

    def _senderHandler(self, event):
        logging.debug("Started sender Handler thread. Host: " + self.destHost 
            + ":" + str(self.destPort))
        data = 0
        while True:
            if event.is_set():
                data = random.randint(0,1024)
                data_str = str(data) + "\n"
                message = data_str.encode('UTF-8')
                self.sockSender.sendto(message, (self.destHost, self.destPort))
            time.sleep(.1)

if __name__ == "__main__":
    localHost = get_ip()
    localPort = 5005

    w = WosciSignalGenerator()
    w.startListener(localHost, localPort)
    
    while True:
        try:
            time.sleep(1)
        except KeyboardInterrupt:
            logging.warning("Received KeyboardInterrupt")
            break