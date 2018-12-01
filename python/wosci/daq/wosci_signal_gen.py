import logging
import socket
import time
import sys
import threading
import random
import re

from . import daqsettings
from .. import utils


class WosciSignalGenerator(object):

    def __init__(self):
        self.sock_receiver = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock_sender =  socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.local_host = None
        self.local_port = None
        self.dest_host = None
        self.dest_port = None
        self.thread_event = threading.Event()
        self.thread_listener = threading.Thread(
            name='_messageHandler', 
            target=self._message_handler, 
            args=(self.thread_event,)
        )
        self.thread_sender = threading.Thread(
            name='_senderHandler', 
            target=self._sender_handler, 
            args=(self.thread_event,)
        )
        # Set the threads as daemon so we can forget about them
        self.thread_listener.daemon = True
        self.thread_sender.daemon = True

    # def __del__(self):
    #     if self.sock_receiver:
    #         self.sock_receiver.close()
    #     if self.sock_sender:
    #         self.sock_sender.close()
    #     logging.info("Signal generator deleted")

    def start_listener(self, 
            local_host="127.0.0.1", 
            local_port=daqsettings.SIGNAL_GENERATOR_UDP_PORT_LISTEN):
        logging.info("Bind listener to: {}:{}"
            .format(str(local_host), str(local_port))
        )
        self.sock_receiver.bind((local_host, local_port))
        if not self.thread_listener.isAlive():
            self.thread_listener.start()

    def start_sender(self, 
            dest_host, 
            dest_port=daqsettings.SIGNAL_GENERATOR_UDP_PORT_SEND):
        self.dest_host = dest_host
        self.dest_port = dest_port
        logging.debug("Started sending to: " + str(self.dest_host) + ":" 
            + str(self.dest_port))
        if not self.thread_sender.isAlive():
            self.thread_sender.start()

    def _message_handler(self, event):
        logging.debug("Started message Handler thread.")
        while True:
            try:
                # The message handler thread will be caught in this blocking
                # call and wait for messages forever
                finish_recv = False
                data, addr = self.sock_receiver.recvfrom(1024)
                while not finish_recv:
                    if not "\n" in data.decode("UTF-8"):
                        pass
                        logging.debug("Did not receive EOL character. {}" 
                            .format(repr(data)))
                        data = data + self.sock_receiver.recv(1024)
                    else:
                        finish_recv = True
                logging.debug("Receive complete: {}".format(repr(data)))
            except Exception as e:
                logging.error(str(e))
                continue
            cmd = data.decode("UTF-8").upper()
            
            if re.match(r"\*IDN\?", cmd, re.I):
                ret_str = "WOSCISIGNALGEN,V0.0\n"
                logging.debug(repr(ret_str))
                self.sock_sender.sendto(ret_str.encode('UTF-8'), addr)
            if re.match(r"\*RST", cmd, re.I):
                logging.debug("*RST")
            if re.match(r"start", cmd, re.I):
                event.set()
                dest_host = addr[0]
                self.start_sender(dest_host)
            if re.match(r"stop", cmd, re.I):
               event.clear()

    def _sender_handler(self, event):
        logging.debug("Started sender Handler thread. Host: " + self.dest_host 
            + ":" + str(self.dest_port))
        data = 0
        while True:
            if event.is_set():
                data = random.randint(0,1024)
                data_str = str(data) + "\n"
                message = data_str.encode('UTF-8')
                self.sock_sender.sendto(message, (self.dest_host, self.dest_port))
            time.sleep(.1)

def run_wosci_signal_generator():
    logging.basicConfig(level=logging.DEBUG)
    local_host = utils.get_local_ip()
    local_port = daqsettings.SIGNAL_GENERATOR_UDP_PORT_LISTEN

    w = WosciSignalGenerator()
    w.start_listener(local_host, local_port)
    
    while True:
        try:
            time.sleep(1)
        except KeyboardInterrupt:
            logging.warning("Received KeyboardInterrupt")
            break
